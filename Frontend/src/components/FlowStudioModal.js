import React, { useState, useRef } from "react";
import { saveFlowRunResults, createFlow, updateFlow } from "../services/flowService";
import { authenticatedFetch } from "../services/authService";
import "./FlowStudioModal.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

// Helper to safely extract nested properties using a dot path like "id", "data.user.id", "response.body.id", "0.id"
function getValueByPath(obj, path) {
  if (obj === null || obj === undefined || !path) return undefined;

  let target = obj;
  if (typeof target === "string") {
    try {
      target = JSON.parse(target);
    } catch {}
  }

  // Clean path: strip leading "response.body.", "response.data.", "body.", "data." if present
  let cleanPath = String(path).trim();
  if (cleanPath.startsWith("response.body.")) cleanPath = cleanPath.slice("response.body.".length);
  else if (cleanPath.startsWith("response.data.")) cleanPath = cleanPath.slice("response.data.".length);
  else if (cleanPath.startsWith("response.")) cleanPath = cleanPath.slice("response.".length);
  else if (cleanPath.startsWith("body.")) cleanPath = cleanPath.slice("body.".length);

  if (!cleanPath) return target;

  const parts = cleanPath.split(".").filter(Boolean);
  let current = target;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    const indexMatch = part.match(/^\[?(\d+)\]?$/);
    if (indexMatch && Array.isArray(current)) {
      current = current[parseInt(indexMatch[1], 10)];
    } else {
      current = current[part];
    }
  }
  return current;
}

// Helper to interpolate {{varName}} in string URLs, headers, and body
function interpolateVariables(template, variables) {
  if (!template || !variables) return template;
  if (typeof template === "object") {
    try {
      const str = JSON.stringify(template);
      const replaced = str.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, varName) => {
        const key = varName.trim();
        const val = variables[key];
        return val !== undefined ? (typeof val === "object" ? JSON.stringify(val) : String(val)) : `{{${varName}}}`;
      });
      return JSON.parse(replaced);
    } catch {
      return template;
    }
  }
  if (typeof template !== "string") return template;

  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, varName) => {
    const key = varName.trim();
    const val = variables[key];
    return val !== undefined ? String(val) : `{{${varName}}}`;
  });
}

export default function FlowStudioModal({ flow, initialMode = "builder", onClose, onSaved }) {
  const [activeTab, setActiveTab] = useState(initialMode); // "builder" | "runner"
  const [name, setName] = useState(flow?.name || "New API Pipeline Flow");
  const [description, setDescription] = useState(flow?.description || "");
  const [steps, setSteps] = useState(
    flow?.steps?.length > 0
      ? flow.steps
      : [
          {
            stepId: "step_1",
            name: "Initial Step",
            method: "GET",
            url: "https://jsonplaceholder.typicode.com/posts/1",
            headers: {},
            params: {},
            body: null,
            extractVariables: [{ varName: "postId", jsonPath: "id" }],
            expectedStatus: 200
          }
        ]
  );

  // Runner state
  const [running, setRunning] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [stepResults, setStepResults] = useState([]);
  const [runtimeVars, setRuntimeVars] = useState(flow?.initialVariables || {});
  const [pausedForHealing, setPausedForHealing] = useState(null); // { stepIdx, diagnosis, step }
  const [healedCount, setHealedCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const isCancelledRef = useRef(false);

  // Save Flow definition
  const handleSaveFlow = async () => {
    setSaving(true);
    const flowData = {
      name: name.trim() || "Untitled Flow",
      description: description.trim(),
      steps,
      initialVariables: runtimeVars
    };

    let saved = null;
    if (flow?._id) {
      saved = await updateFlow(flow._id, flowData);
    } else {
      saved = await createFlow(flowData);
    }

    setSaving(false);
    if (saved && onSaved) {
      onSaved(saved);
    }
  };

  // Add Step in Builder
  const handleAddStep = () => {
    const newId = `step_${Date.now()}`;
    setSteps(prev => [
      ...prev,
      {
        stepId: newId,
        name: `Step ${prev.length + 1}`,
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/posts",
        headers: {},
        params: {},
        body: null,
        extractVariables: [],
        expectedStatus: 200
      }
    ]);
  };

  const handleUpdateStep = (idx, field, val) => {
    setSteps(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleDeleteStep = (idx) => {
    setSteps(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddExtractVar = (stepIdx) => {
    setSteps(prev => {
      const copy = [...prev];
      const existing = copy[stepIdx].extractVariables || [];
      copy[stepIdx] = {
        ...copy[stepIdx],
        extractVariables: [...existing, { varName: `var_${Date.now().toString().slice(-4)}`, jsonPath: "id" }]
      };
      return copy;
    });
  };

  const handleUpdateExtractVar = (stepIdx, varIdx, field, val) => {
    setSteps(prev => {
      const copy = [...prev];
      const vars = [...(copy[stepIdx].extractVariables || [])];
      vars[varIdx] = { ...vars[varIdx], [field]: val };
      copy[stepIdx] = { ...copy[stepIdx], extractVariables: vars };
      return copy;
    });
  };

  const handleDeleteExtractVar = (stepIdx, varIdx) => {
    setSteps(prev => {
      const copy = [...prev];
      copy[stepIdx] = {
        ...copy[stepIdx],
        extractVariables: copy[stepIdx].extractVariables.filter((_, i) => i !== varIdx)
      };
      return copy;
    });
  };

  // 🚀 Flow Execution Engine
  const startFlowRun = async () => {
    setActiveTab("runner");
    setRunning(true);
    setStepResults([]);
    setCurrentStepIdx(0);
    setPausedForHealing(null);
    setHealedCount(0);
    isCancelledRef.current = false;

    let vars = { ...(flow?.initialVariables || {}) };
    setRuntimeVars(vars);

    await executeFlowFromStep(0, vars, [], 0, steps);
  };

  // Executes flow starting from given step index
  const executeFlowFromStep = async (startIdx, currentVars, currentResults, currentHealed, currentSteps) => {
    let localVars = { ...currentVars };
    let results = [...currentResults];
    let healed = currentHealed;
    let localSteps = [...currentSteps];

    for (let i = startIdx; i < localSteps.length; i++) {
      if (isCancelledRef.current) break;

      setCurrentStepIdx(i);
      const step = localSteps[i];

      // 1. Resolve variable interpolations & sanitize URL
      let rawResolvedUrl = interpolateVariables(step.url, localVars);
      let cleanUrl = String(rawResolvedUrl || "").trim();
      if (cleanUrl.match(/^(GET|POST|PUT|DELETE|PATCH)\s+/i)) {
        cleanUrl = cleanUrl.replace(/^(GET|POST|PUT|DELETE|PATCH)\s+/i, "").trim();
      }
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = `https://${cleanUrl}`;
      }
      const resolvedUrl = cleanUrl;

      const resolvedHeaders = {};
      Object.entries(step.headers || {}).forEach(([k, v]) => {
        if (k) resolvedHeaders[k] = interpolateVariables(v, localVars);
      });
      if (!resolvedHeaders["Content-Type"]) {
        resolvedHeaders["Content-Type"] = "application/json";
      }

      let resolvedBody = step.body;
      if (typeof resolvedBody === "string" && resolvedBody.trim()) {
        try {
          const interpolatedStr = interpolateVariables(resolvedBody, localVars);
          resolvedBody = JSON.parse(interpolatedStr);
        } catch {
          resolvedBody = interpolateVariables(resolvedBody, localVars);
        }
      } else if (resolvedBody && typeof resolvedBody === "object") {
        resolvedBody = JSON.parse(interpolateVariables(JSON.stringify(resolvedBody), localVars));
      }

      // 2. Execute Step via Backend Proxy
      const startTime = Date.now();
      let responseStatus = 0;
      let responseData = null;
      let stepPassed = false;
      let errorMsg = null;

      try {
        const res = await authenticatedFetch(`${BACKEND_URL}/api/request`, {
          method: "POST",
          body: JSON.stringify({
            method: (step.method || "GET").toUpperCase(),
            url: resolvedUrl,
            headers: resolvedHeaders,
            body: resolvedBody || null,
            params: step.params || {}
          })
        });

        const json = await res.json();
        const duration = Date.now() - startTime;
        responseStatus = json.status || res.status;
        
        // Extract body correctly from json.body or json.data
        responseData = json.body !== undefined ? json.body : (json.data !== undefined ? json.data : json);

        const expected = step.expectedStatus || 200;
        stepPassed = responseStatus === expected || (expected === 200 && responseStatus >= 200 && responseStatus < 300);

        if (!stepPassed) {
          errorMsg = `Status ${responseStatus} did not match expected ${expected}`;
        }

        // 3. If Step Passed -> Extract Variables into localVars
        const extractedThisStep = {};
        if (stepPassed && responseData !== undefined && responseData !== null) {
          (step.extractVariables || []).forEach(vRule => {
            if (vRule.varName && vRule.jsonPath) {
              const val = getValueByPath(responseData, vRule.jsonPath);
              if (val !== undefined && val !== null) {
                const cleanKey = vRule.varName.trim();
                extractedThisStep[cleanKey] = val;
                localVars[cleanKey] = val;
              }
            }
          });
          setRuntimeVars({ ...localVars });
        }

        const stepResultItem = {
          stepId: step.stepId,
          name: step.name,
          method: step.method,
          url: resolvedUrl,
          status: responseStatus,
          duration,
          passed: stepPassed,
          error: errorMsg,
          extracted: extractedThisStep,
          healed: false
        };

        results[i] = stepResultItem;
        setStepResults([...results]);

        // 4. Autonomous Failure Pause & RAG Self-Healing Trigger
        if (!stepPassed) {
          setRunning(false);

          // Call Existing GenAI RAG Failure Assist for diagnosis & auto-fix
          let diagnosis = null;
          try {
            const diagRes = await authenticatedFetch(`${BACKEND_URL}/api/ai/failure-assist`, {
              method: "POST",
              body: JSON.stringify({
                method: step.method,
                url: resolvedUrl,
                status: responseStatus,
                response: responseData || errorMsg,
                headers: resolvedHeaders,
                userId: localStorage.getItem("currentUserId") || "guest",
                previousAttempts: []
              })
            });

            if (diagRes.ok) {
              const diagJson = await diagRes.json();
              diagnosis = diagJson.diagnosis || diagJson;
            }
          } catch (dErr) {
            console.error("Failure assist call error in flow runner:", dErr);
          }

          setPausedForHealing({
            stepIdx: i,
            step,
            resolvedUrl,
            status: responseStatus,
            error: errorMsg,
            diagnosis,
            currentVars: localVars,
            results,
            healedCount: healed,
            currentSteps: localSteps
          });
          return; // Pause runner here!
        }
      } catch (execErr) {
        console.error("Step execution error:", execErr);
        results[i] = {
          stepId: step.stepId,
          name: step.name,
          method: step.method,
          url: resolvedUrl,
          status: "Network Error",
          duration: Date.now() - startTime,
          passed: false,
          error: execErr.message,
          extracted: {},
          healed: false
        };
        setStepResults([...results]);
        setRunning(false);
        return;
      }
    }

    // Complete flow run successfully
    setRunning(false);
    setCurrentStepIdx(-1);

    const totalPassed = results.every(r => r && r.passed);
    const lastRunSummary = {
      runId: `run_${Date.now()}`,
      timestamp: new Date(),
      passed: totalPassed,
      totalSteps: localSteps.length,
      healedStepsCount: healed,
      duration: results.reduce((acc, r) => acc + (r?.duration || 0), 0),
      stepResults: results
    };

    if (flow?._id) {
      await saveFlowRunResults(flow._id, lastRunSummary, localSteps);
    }
  };

  // 🛠️ Self-Healing Application & Auto-Resumption
  const handleApplyHealingAndResume = async () => {
    if (!pausedForHealing) return;

    const { stepIdx, step, diagnosis, currentVars, results, healedCount: curHealed, currentSteps: curSteps } = pausedForHealing;
    const autoFix = diagnosis?.autoFix;

    const mutatedSteps = [...curSteps];
    const targetStep = { ...mutatedSteps[stepIdx] };

    // Apply auto-fix mutation to step configuration
    if (autoFix && autoFix.actionPayload) {
      const act = autoFix.actionPayload;
      if (act.type === "set_url" && act.value) {
        targetStep.url = act.value;
      } else if (act.type === "add_header" && act.key) {
        targetStep.headers = { ...(targetStep.headers || {}), [act.key]: act.value };
      } else if (act.type === "change_method" && act.value) {
        targetStep.method = act.value;
      } else if (act.type === "fix_body" && act.value) {
        targetStep.body = act.value;
      }
    }

    mutatedSteps[stepIdx] = targetStep;
    setSteps(mutatedSteps);

    // Auto-Index Healed Episode into ChromaDB RAG Memory
    try {
      await authenticatedFetch(`${BACKEND_URL}/api/ai/rag/index-episode`, {
        method: "POST",
        body: JSON.stringify({
          userId: localStorage.getItem("currentUserId") || "guest",
          endpoint: `${targetStep.method} ${targetStep.url}`,
          failedStatus: pausedForHealing.status,
          previousError: pausedForHealing.error || "Step failed in flow execution",
          rootCauseLayer: diagnosis?.rootCause?.predictedLayer || "Validation",
          successfulFixUsed: autoFix || { title: "Self-healing parameter correction" },
          resultStatus: 200,
          resultDuration: 150
        })
      });
    } catch (idxErr) {
      console.warn("Could not index healed episode into ChromaDB:", idxErr);
    }

    // Mark step as healed in result list
    const updatedResults = [...results];
    if (updatedResults[stepIdx]) {
      updatedResults[stepIdx].healed = true;
      updatedResults[stepIdx].healingDetails = {
        originalError: pausedForHealing.error,
        appliedFix: autoFix?.title || "Self-healing parameter update"
      };
    }

    const newHealedCount = curHealed + 1;
    setHealedCount(newHealedCount);
    setPausedForHealing(null);
    setRunning(true);

    // Seamlessly re-execute from this step and continue remaining flow!
    await executeFlowFromStep(stepIdx, currentVars, updatedResults, newHealedCount, mutatedSteps);
  };

  return (
    <div className="flow-studio-overlay" onClick={onClose}>
      <div className="flow-studio-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flow-studio-header">
          <div className="flow-header-left">
            <span className="flow-header-title">
              🔀 {name || "Flow Studio"}
            </span>
            <span className="flow-badge">
              {steps.length} Steps
            </span>
            {healedCount > 0 && (
              <span className="flow-badge" style={{ background: "rgba(249, 226, 175, 0.2)", color: "#f9e2af" }}>
                🛠️ {healedCount} Healed
              </span>
            )}
          </div>

          <div className="flow-header-actions">
            <button className="studio-run-btn" onClick={startFlowRun} disabled={running}>
              {running ? "⏳ Running..." : "🚀 Run Flow"}
            </button>
            <button className="studio-save-btn" onClick={handleSaveFlow} disabled={saving}>
              {saving ? "Saving..." : "💾 Save"}
            </button>
            <button className="studio-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flow-studio-tabs">
          <button
            className={`studio-tab-btn ${activeTab === "builder" ? "active" : ""}`}
            onClick={() => setActiveTab("builder")}
          >
            🛠️ Flow Builder
          </button>
          <button
            className={`studio-tab-btn ${activeTab === "runner" ? "active" : ""}`}
            onClick={() => setActiveTab("runner")}
          >
            ⚡ Autonomous Runner & Self-Healing
          </button>
        </div>

        {/* Body */}
        <div className="flow-studio-body">
          {activeTab === "builder" ? (
            /* BUILDER MODE */
            <>
              <div className="flow-meta-form">
                <div className="flow-input-group">
                  <label>Flow Name</label>
                  <input
                    type="text"
                    className="flow-text-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. E-Commerce Checkout Pipeline"
                  />
                </div>
                <div className="flow-input-group">
                  <label>Description</label>
                  <input
                    type="text"
                    className="flow-text-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief summary of this multi-step flow..."
                  />
                </div>
              </div>

              <div className="flow-steps-section">
                <div className="flow-steps-header">
                  <h4>Pipeline Steps ({steps.length})</h4>
                  <button className="add-step-btn" onClick={handleAddStep}>
                    + Add Step
                  </button>
                </div>

                {steps.map((step, idx) => (
                  <div key={step.stepId || idx} className="step-card">
                    <div className="step-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="step-number-badge">{idx + 1}</span>
                        <input
                          type="text"
                          className="flow-text-input"
                          style={{ padding: "4px 8px", fontSize: "12px", width: "220px" }}
                          value={step.name}
                          onChange={(e) => handleUpdateStep(idx, "name", e.target.value)}
                          placeholder="Step Name"
                        />
                      </div>
                      <button
                        className="step-delete-btn"
                        onClick={() => handleDeleteStep(idx)}
                        title="Delete Step"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="step-row-top">
                      <select
                        className="step-method-select"
                        value={step.method}
                        onChange={(e) => handleUpdateStep(idx, "method", e.target.value)}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </select>

                      <input
                        type="text"
                        className="step-url-input"
                        value={step.url}
                        onChange={(e) => handleUpdateStep(idx, "url", e.target.value)}
                        placeholder="https://api.example.com/items/{{itemId}}"
                      />
                    </div>

                    {/* Variable Extractions for this step */}
                    <div className="variables-extraction-box">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="var-extract-title">
                          📥 Extract Response Variables (Passed to downstream steps)
                        </span>
                        <button
                          className="add-step-btn"
                          style={{ padding: "2px 6px", fontSize: "10px" }}
                          onClick={() => handleAddExtractVar(idx)}
                        >
                          + Extract Var
                        </button>
                      </div>

                      {(step.extractVariables || []).map((vRule, vIdx) => (
                        <div key={vIdx} className="var-extract-row">
                          <input
                            type="text"
                            className="var-extract-input"
                            style={{ width: "130px" }}
                            placeholder="Variable (e.g. token)"
                            value={vRule.varName}
                            onChange={(e) => handleUpdateExtractVar(idx, vIdx, "varName", e.target.value)}
                          />
                          <span style={{ color: "#6c7086" }}>= response.body.</span>
                          <input
                            type="text"
                            className="var-extract-input"
                            style={{ flex: 1 }}
                            placeholder="JSON Path (e.g. data.id or token)"
                            value={vRule.jsonPath}
                            onChange={(e) => handleUpdateExtractVar(idx, vIdx, "jsonPath", e.target.value)}
                          />
                          <button
                            className="step-delete-btn"
                            onClick={() => handleDeleteExtractVar(idx, vIdx)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* RUNNER & SELF-HEALING MODE */
            <>
              <div className="runner-status-bar">
                <div>
                  <strong>Status: </strong>
                  {running ? (
                    <span style={{ color: "#89b4fa" }}>⏳ Executing Step {currentStepIdx + 1}...</span>
                  ) : pausedForHealing ? (
                    <span style={{ color: "#f9e2af" }}>🛠️ Paused for Autonomous Self-Healing</span>
                  ) : stepResults.length > 0 ? (
                    stepResults.every(r => r && r.passed) ? (
                      <span style={{ color: "#a6e3a1" }}>✅ Pipeline Completed Successfully!</span>
                    ) : (
                      <span style={{ color: "#f38ba8" }}>❌ Pipeline Terminated with Failures</span>
                    )
                  ) : (
                    <span style={{ color: "#a6adc8" }}>Ready to execute</span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="studio-run-btn" onClick={startFlowRun} disabled={running}>
                    {running ? "Running..." : "▶️ Start Flow"}
                  </button>
                </div>
              </div>

              {/* Dynamic Variables Pool */}
              {Object.keys(runtimeVars).length > 0 && (
                <div className="runner-context-box">
                  <div className="runner-context-header">🔗 Live Injected Variable Pool:</div>
                  <div className="runner-context-tags">
                    {Object.entries(runtimeVars).map(([k, v]) => (
                      <div key={k} className="runner-ctx-pill">
                        <strong>{`{{${k}}}`}</strong>: {JSON.stringify(v)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Stepper */}
              <div className="runner-stepper">
                {steps.map((step, idx) => {
                  const result = stepResults[idx];
                  const isCurrent = running && currentStepIdx === idx;
                  const isPaused = pausedForHealing && pausedForHealing.stepIdx === idx;

                  let statusClass = "pending";
                  let statusTag = <span className="runner-step-status-tag">Pending</span>;

                  if (isCurrent) {
                    statusClass = "running";
                    statusTag = <span className="runner-step-status-tag running">⏳ Running</span>;
                  } else if (isPaused) {
                    statusClass = "failed";
                    statusTag = <span className="runner-step-status-tag failed">🔴 Failed ({pausedForHealing.status})</span>;
                  } else if (result) {
                    if (result.healed) {
                      statusClass = "healed";
                      statusTag = <span className="runner-step-status-tag healed">🛠️ Healed & Passed</span>;
                    } else if (result.passed) {
                      statusClass = "passed";
                      statusTag = <span className="runner-step-status-tag passed">✅ Passed ({result.status})</span>;
                    } else {
                      statusClass = "failed";
                      statusTag = <span className="runner-step-status-tag failed">❌ Failed ({result.status})</span>;
                    }
                  }

                  return (
                    <div key={step.stepId || idx} className={`runner-step-card ${statusClass}`}>
                      <div className="runner-step-top">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span className="step-number-badge">{idx + 1}</span>
                          <span className="runner-step-title">{step.name}</span>
                          <span style={{ color: "#34d399", fontWeight: "700", fontSize: "11px" }}>{step.method}</span>
                          <span style={{ color: "#a1a1aa", fontSize: "11px", fontFamily: "monospace" }}>
                            {result?.url || interpolateVariables(step.url, runtimeVars)}
                          </span>
                        </div>
                        {statusTag}
                      </div>

                      {result?.extracted && Object.keys(result.extracted).length > 0 && (
                        <div style={{ fontSize: "10.5px", color: "#fbbf24", display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <span>📥 Extracted:</span>
                          {Object.entries(result.extracted).map(([k, v]) => (
                            <span key={k} style={{ background: "#18181f", border: "1px solid #27272a", padding: "1px 6px", borderRadius: "3px", color: "#34d399" }}>
                              <strong>{k}</strong> = {JSON.stringify(v)}
                            </span>
                          ))}
                        </div>
                      )}

                      {result && result.duration > 0 && (
                        <div style={{ fontSize: "10.5px", color: "#71717a" }}>
                          Response Time: {result.duration}ms {result.error && `| Error: ${result.error}`}
                        </div>
                      )}

                      {/* 🛠️ Confirmed Self-Healing Intervention Box */}
                      {isPaused && pausedForHealing && (
                        <div className="flow-healing-panel">
                          <div className="flow-healing-header">
                            <span style={{ fontSize: "16px" }}>🛠️</span>
                            <span className="flow-healing-title">Autonomous Self-Healing Proposal</span>
                          </div>

                          <div className="flow-healing-desc">
                            {pausedForHealing.diagnosis?.whatHappened || `Step failed with HTTP status ${pausedForHealing.status}.`}
                          </div>

                          {pausedForHealing.diagnosis?.rootCause && (
                            <div style={{ fontSize: "11px", color: "#89b4fa" }}>
                              🧠 <strong>Predicted Layer:</strong> {pausedForHealing.diagnosis.rootCause.predictedLayer} ({pausedForHealing.diagnosis.rootCause.confidence}% confidence)
                            </div>
                          )}

                          {pausedForHealing.diagnosis?.autoFix?.diff && (
                            <div className="flow-healing-diff">
                              {pausedForHealing.diagnosis.autoFix.diff}
                            </div>
                          )}

                          <div className="flow-healing-actions">
                            <button
                              className="apply-flow-fix-btn"
                              onClick={handleApplyHealingAndResume}
                            >
                              ✅ Apply Fix & Resume Pipeline
                            </button>
                            <button
                              className="skip-flow-step-btn"
                              onClick={() => {
                                setPausedForHealing(null);
                                setRunning(false);
                              }}
                            >
                              Abort Run
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
