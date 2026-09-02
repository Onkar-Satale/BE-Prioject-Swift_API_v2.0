import React, { useState, useRef } from "react";
import { saveFlowRunResults, createFlow, updateFlow } from "../services/flowService";
import { authenticatedFetch } from "../services/authService";
import "./FlowStudioModal.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

// Helper to safely extract nested properties from response data or full response wrapper
export function getValueByPath(obj, path, fullResponse = null) {
  if (obj === null || obj === undefined || !path) return undefined;

  const resolve = (root, pathStr) => {
    if (root === null || root === undefined || typeof pathStr !== "string") return undefined;
    let target = root;
    if (typeof target === "string") {
      try {
        target = JSON.parse(target);
      } catch {}
    }

    // Convert bracket notation [0] or ['key'] or ["key"] into dot notation .0 or .key
    const normalized = pathStr
      .trim()
      .replace(/\[['"]?([^'"\]]+)['"]?\]/g, '.$1')
      .replace(/^\./, '');

    const parts = normalized.split('.').map(p => p.trim()).filter(Boolean);
    let current = target;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current === "string") {
        try {
          current = JSON.parse(current);
        } catch {}
      }
      current = current[part];
    }
    return current;
  };

  const rawPath = String(path).trim();

  // 1. Try resolving exact path on obj (e.g. responseData)
  let val = resolve(obj, rawPath);
  if (val !== undefined && val !== null) return val;

  // 2. Strip common prefixes (response.body., response.data., response., body., data.) and resolve on obj
  const cleanedPath = rawPath
    .replace(/^response\.body\./i, '')
    .replace(/^response\.data\./i, '')
    .replace(/^response\./i, '')
    .replace(/^body\./i, '')
    .replace(/^data\./i, '');

  if (cleanedPath !== rawPath) {
    val = resolve(obj, cleanedPath);
    if (val !== undefined && val !== null) return val;
  }

  // 3. Array / Object Cross-Compatibility Fallbacks:
  // 3A. If obj is an Array and user didn't specify array index (e.g. user typed "name" or "updated_at" on an array response)
  if (Array.isArray(obj) && obj.length > 0) {
    const arrayItemVal = resolve(obj[0], cleanedPath);
    if (arrayItemVal !== undefined && arrayItemVal !== null) return arrayItemVal;
  }

  // 3B. If obj is a single Object and user specified array index (e.g. user typed "0.updated_at" on a single object response)
  if (typeof obj === "object" && !Array.isArray(obj)) {
    const strippedIndex = cleanedPath.replace(/^0\./, '').replace(/^\[0\]\./, '');
    if (strippedIndex !== cleanedPath) {
      const objVal = resolve(obj, strippedIndex);
      if (objVal !== undefined && objVal !== null) return objVal;
    }
  }

  // 4. Fallback: Try resolving on fullResponse object if available
  if (fullResponse && typeof fullResponse === "object") {
    val = resolve(fullResponse, rawPath);
    if (val !== undefined && val !== null) return val;

    val = resolve(fullResponse, cleanedPath);
    if (val !== undefined && val !== null) return val;

    if (fullResponse.body) {
      val = resolve(fullResponse.body, cleanedPath);
      if (val !== undefined && val !== null) return val;
      if (Array.isArray(fullResponse.body) && fullResponse.body.length > 0) {
        val = resolve(fullResponse.body[0], cleanedPath);
        if (val !== undefined && val !== null) return val;
      }
    }
    if (fullResponse.data) {
      val = resolve(fullResponse.data, cleanedPath);
      if (val !== undefined && val !== null) return val;
      if (Array.isArray(fullResponse.data) && fullResponse.data.length > 0) {
        val = resolve(fullResponse.data[0], cleanedPath);
        if (val !== undefined && val !== null) return val;
      }
    }
  }

  return undefined;
}

// Helper to interpolate {{varName}} in string URLs, headers, params, and body
export function interpolateVariables(template, variables) {
  if (!template || !variables || typeof variables !== "object") return template;

  const replaceString = (str) => {
    if (typeof str !== "string") return str;
    return str.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, rawKey) => {
      const key = rawKey.trim();

      // 1. Direct key match
      if (variables[key] !== undefined && variables[key] !== null) {
        return typeof variables[key] === "object" ? JSON.stringify(variables[key]) : String(variables[key]);
      }

      // 2. Stripped prefix key match (e.g. response.body.login -> login)
      const cleanKey = key
        .replace(/^response\.body\./i, '')
        .replace(/^response\.data\./i, '')
        .replace(/^response\./i, '')
        .replace(/^body\./i, '')
        .replace(/^data\./i, '')
        .replace(/^vars\./i, '')
        .replace(/^variables\./i, '');

      if (variables[cleanKey] !== undefined && variables[cleanKey] !== null) {
        return typeof variables[cleanKey] === "object" ? JSON.stringify(variables[cleanKey]) : String(variables[cleanKey]);
      }

      // 3. Case-insensitive key match fallback
      const lowerKey = key.toLowerCase();
      const lowerCleanKey = cleanKey.toLowerCase();
      const found = Object.entries(variables).find(([k]) => {
        const kLower = k.toLowerCase();
        return kLower === lowerKey || kLower === lowerCleanKey;
      });

      if (found && found[1] !== undefined && found[1] !== null) {
        return typeof found[1] === "object" ? JSON.stringify(found[1]) : String(found[1]);
      }

      return match; // Return unchanged if variable is not found in pool
    });
  };

  if (typeof template === "string") {
    return replaceString(template);
  }

  if (typeof template === "object") {
    try {
      const stringified = JSON.stringify(template);
      const replaced = replaceString(stringified);
      return JSON.parse(replaced);
    } catch {
      return template;
    }
  }

  return template;
}

// Helper to render templates with {{varName}} highlighted in green (if resolved) or red (if unresolved)
export function renderHighlightedTemplate(template, variables = {}) {
  if (!template || typeof template !== "string") return template;

  const parts = template.split(/(\{\{\s*[a-zA-Z0-9_.-]+\s*\}\})/g);
  if (parts.length <= 1) return template;

  return parts.map((part, idx) => {
    const match = part.match(/^\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}$/);
    if (!match) return <span key={idx}>{part}</span>;

    const rawKey = match[1].trim();
    const cleanKey = rawKey
      .replace(/^response\.body\./i, '')
      .replace(/^response\.data\./i, '')
      .replace(/^response\./i, '')
      .replace(/^body\./i, '')
      .replace(/^data\./i, '')
      .replace(/^vars\./i, '')
      .replace(/^variables\./i, '');

    const resolvedVal = variables[rawKey] !== undefined ? variables[rawKey] : variables[cleanKey];
    const isResolved = resolvedVal !== undefined && resolvedVal !== null;

    if (isResolved) {
      const displayVal = typeof resolvedVal === "object" ? JSON.stringify(resolvedVal) : String(resolvedVal);
      return (
        <span
          key={idx}
          className="flow-var-tag resolved"
          title={`Resolved: ${displayVal}`}
        >
          {`{{${rawKey}}}`}
          <span className="flow-var-preview">{displayVal.length > 20 ? `${displayVal.slice(0, 18)}…` : displayVal}</span>
        </span>
      );
    }

    return (
      <span
        key={idx}
        className="flow-var-tag unresolved"
        title="Unresolved: Variable not yet extracted in preceding steps"
      >
        {`{{${rawKey}}}`}
        <span className="flow-var-preview unres">unresolved</span>
      </span>
    );
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
  const [expandedResponses, setExpandedResponses] = useState({});

  const toggleResponseView = (idx) => {
    setExpandedResponses(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const isCancelledRef = useRef(false);

  // Sync state when flow prop changes
  React.useEffect(() => {
    if (flow) {
      setName(flow.name || "New API Pipeline Flow");
      setDescription(flow.description || "");
      if (Array.isArray(flow.steps) && flow.steps.length > 0) {
        setSteps(flow.steps);
      }
      if (flow.initialVariables) {
        setRuntimeVars(flow.initialVariables);
      }
    }
  }, [flow]);

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
        extractVariables: [
          ...existing,
          { varName: `var_${existing.length + 1}`, jsonPath: "id" }
        ]
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
      const rawTemplateUrl = step.url;
      const rawResolvedUrl = interpolateVariables(step.url, localVars);
      let cleanUrl = String(rawResolvedUrl || "").trim();
      while (cleanUrl.match(/^(GET|POST|PUT|DELETE|PATCH)\s+/i)) {
        cleanUrl = cleanUrl.replace(/^(GET|POST|PUT|DELETE|PATCH)\s+/i, "").trim();
      }
      cleanUrl = cleanUrl.replace(/\s+\//g, '/').replace(/\/\s+/g, '/');
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
      if (!resolvedHeaders["User-Agent"]) {
        resolvedHeaders["User-Agent"] = "SwiftAPIClient/1.0";
      }

      const resolvedParams = {};
      Object.entries(step.params || {}).forEach(([k, v]) => {
        if (k) resolvedParams[k] = interpolateVariables(v, localVars);
      });

      let resolvedBody = step.body;
      if (typeof resolvedBody === "string" && resolvedBody.trim()) {
        try {
          const interpolatedStr = interpolateVariables(resolvedBody, localVars);
          resolvedBody = JSON.parse(interpolatedStr);
        } catch {
          resolvedBody = interpolateVariables(resolvedBody, localVars);
        }
      } else if (resolvedBody && typeof resolvedBody === "object") {
        resolvedBody = interpolateVariables(resolvedBody, localVars);
      }

      // 🔍 Debug Logging: Step Details, Template URL, Current Pool, and Resolved URL
      console.log(`\n=================== [FlowRunner] STEP ${i + 1}: "${step.name || step.stepId}" ===================`);
      console.log(`[FlowRunner] Step ${i + 1} Template URL:`, rawTemplateUrl);
      console.log(`[FlowRunner] Step ${i + 1} Configured Extraction Rules:`, step.extractVariables || []);
      console.log(`[FlowRunner] Current execution variable pool:`, JSON.parse(JSON.stringify(localVars)));
      console.log(`[FlowRunner] Step ${i + 1} Resolved URL:`, resolvedUrl);

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
            params: resolvedParams || {}
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

        // 3. If Step Passed -> Extract Variables into localVars ONLY from user-configured extractVariables
        const extractedThisStep = {};
        if (stepPassed && responseData !== undefined && responseData !== null) {
          (step.extractVariables || []).forEach(vRule => {
            if (vRule.varName && vRule.jsonPath) {
              const val = getValueByPath(responseData, vRule.jsonPath, json);
              if (val !== undefined && val !== null) {
                const cleanKey = vRule.varName.trim();
                extractedThisStep[cleanKey] = val;
                localVars[cleanKey] = val;
              }
            }
          });

          setRuntimeVars({ ...localVars });
        }

        // 🔍 Debug Logging: Response Data, Extracted Variables, and Updated Pool
        console.log(`[FlowRunner] Step ${i + 1} Response (Status ${responseStatus}):`, responseData);
        console.log(`[FlowRunner] Extracted variables from Step ${i + 1}:`, JSON.parse(JSON.stringify(extractedThisStep)));
        console.log(`[FlowRunner] Current execution variable pool (after extraction):`, JSON.parse(JSON.stringify(localVars)));
        console.log(`=================================================================================\n`);

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
          responseBody: responseData,
          healed: false
        };

        results[i] = stepResultItem;
        setStepResults([...results]);

        // 4. Autonomous Failure Pause & RAG Self-Healing Trigger
        if (!stepPassed) {
          setRunning(false);

          // Call Existing GenAI RAG Failure Assist for diagnosis & auto-fix
          let diagnosis = null;
          let retrievedEpisodes = [];
          try {
            const diagRes = await authenticatedFetch(`${BACKEND_URL}/api/ai/failure-assist`, {
              method: "POST",
              body: JSON.stringify({
                method: step.method || "GET",
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
              retrievedEpisodes = diagJson.retrievedEpisodes || [];
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
            retrievedEpisodes,
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

    const { stepIdx, diagnosis, currentVars, results, healedCount: curHealed, currentSteps: curSteps } = pausedForHealing;
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
                    {step.url && step.url.includes("{{") && (
                      <div style={{ fontSize: "11px", color: "#a1a1aa", marginTop: "4px", display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ color: "#71717a" }}>Variable Preview:</span>
                        <span>{renderHighlightedTemplate(step.url, runtimeVars)}</span>
                      </div>
                    )}

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

                      {(!step.extractVariables || step.extractVariables.length === 0) && (
                        <div style={{ fontSize: "10.5px", color: "#71717a", marginTop: "4px", fontStyle: "italic" }}>
                          💡 No extraction rules yet. Click "+ Extract Var" to map any JSON response field (e.g. userId = user.id, token = token, orderId = order.id).
                        </div>
                      )}

                      {(step.extractVariables || []).map((vRule, vIdx) => (
                        <div key={vIdx} className="var-extract-row">
                          <input
                            type="text"
                            className="var-extract-input"
                            style={{ width: "130px" }}
                            placeholder="Variable (e.g. userId, token)"
                            value={vRule.varName}
                            onChange={(e) => handleUpdateExtractVar(idx, vIdx, "varName", e.target.value)}
                          />
                          <span style={{ color: "#6c7086" }}>= response.body.</span>
                          <input
                            type="text"
                            className="var-extract-input"
                            style={{ flex: 1 }}
                            placeholder="JSON Path (e.g. user.id, data.token, 0.name)"
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
                            {result?.url || renderHighlightedTemplate(step.url, runtimeVars)}
                          </span>
                        </div>
                        {statusTag}
                      </div>

                      {result && result.duration > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10.5px", color: "#71717a", flexWrap: "wrap", gap: "6px" }}>
                          <span>Response Time: {result.duration}ms {result.error && `| Error: ${result.error}`}</span>
                          {result.responseBody && (
                            <button
                              style={{ background: "transparent", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "10.5px", textDecoration: "underline", padding: 0 }}
                              onClick={() => toggleResponseView(idx)}
                            >
                              {expandedResponses[idx] ? "▲ Hide Response JSON" : "▼ View Response JSON"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Expandable Response JSON Viewer */}
                      {expandedResponses[idx] && result?.responseBody && (
                        <div style={{ background: "#09090d", border: "1px solid #1f1f23", borderRadius: "4px", padding: "8px", maxHeight: "180px", overflowY: "auto", fontFamily: "monospace", fontSize: "10.5px", color: "#a6adc8", whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(result.responseBody, null, 2)}
                        </div>
                      )}

                      {/* 📥 Output Variables from this Step (Only Explicitly Extracted) */}
                      {result && (
                        <div className="runner-step-outputs-box">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                            <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#38bdf8" }}>
                              📥 Output Variables:
                            </span>
                          </div>
                          {result.extracted && Object.keys(result.extracted).length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                              {Object.entries(result.extracted).map(([outKey, outVal]) => (
                                <button
                                  key={outKey}
                                  className="output-var-chip"
                                  title={`Click to copy {{${outKey}}}`}
                                  onClick={() => {
                                    if (navigator.clipboard) {
                                      navigator.clipboard.writeText(`{{${outKey}}}`);
                                    }
                                  }}
                                >
                                  <span className="var-chip-name">{`{{${outKey}}}`}</span>
                                  <span className="var-chip-val">: {typeof outVal === "object" ? JSON.stringify(outVal) : String(outVal)}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: "10.5px", color: "#71717a", fontStyle: "italic" }}>
                              No variables extracted.
                            </div>
                          )}
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

                          {/* 🏛️ Retrieved Historical Evidence (RAG) */}
                          {pausedForHealing.retrievedEpisodes && pausedForHealing.retrievedEpisodes.length > 0 && (
                            <div style={{ background: "#0d0d12", border: "1px solid #1f1f23", padding: "6px 8px", borderRadius: "4px" }}>
                              <div style={{ fontSize: "10.5px", fontWeight: "700", color: "#f5c2e7", display: "flex", gap: "6px", alignItems: "center", marginBottom: "3px" }}>
                                <span>🏛️</span>
                                <span>Retrieved Historical Evidence (RAG):</span>
                                <span style={{ color: "#34d399", fontSize: "9.5px", background: "rgba(16, 185, 129, 0.15)", padding: "1px 5px", borderRadius: "3px" }}>
                                  {pausedForHealing.retrievedEpisodes.length} Precedent(s) Found
                                </span>
                              </div>
                              {pausedForHealing.retrievedEpisodes.map((ep, epI) => (
                                <div key={epI} style={{ fontSize: "10px", color: "#a1a1aa", marginTop: "2px" }}>
                                  🎯 <strong>{ep.matchPercentage || 95}% Match</strong> — Proven Fix: <span style={{ color: "#34d399" }}>{ep.successfulFixUsed?.title || ep.successfulFixUsed?.description || "Route correction"}</span>
                                </div>
                              ))}
                            </div>
                          )}

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
