import { useState, useRef, useEffect, useContext } from "react";
import "./BotSidebar.css";
import { SwiftAPIContext } from "../context/SwiftAPIContext";
import { showToast } from "../utils/toast";

export default function BotSidebar({
  onClose,
  currentApiContext = null,
  setHeadersObj = null,
  setAuth = null,
  setRawBody = null,
  setParamsObj = null,
  setMethod = null,
  setUrl = null,
  setActiveTab = null,
  setShowBot,
  onRerunRequest = null,
}) {
  const [input, setInput] = useState("");
  const botBodyRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [fixTokenInput, setFixTokenInput] = useState({});
  const [appliedFixes, setAppliedFixes] = useState({});

  const { messages, setMessages, setAppliedFixInfo } = useContext(SwiftAPIContext);

  const handleClearBot = () => {
    setMessages([
      {
        from: "bot",
        text: "Hi 👋 I’m your J.A.R.V.I.S. API assistant! You can ask me questions about API testing, HTTP protocols, headers, status codes, or request structures. ⚠️ Please note that I only answer questions related to API testing and development."
      }
    ]);
    setShowClearConfirm(false);
    showToast("🤖 Chat bot cleared!");
  };

  /* =============================================================
     🔹 V2: CONFIRMED AUTO-FIX DISPATCHER (APPLY FIX TO WORKSPACE)
     ============================================================= */
  const handleApplyFix = (msgIndex, autoFix) => {
    if (!autoFix) return;

    try {
      const payload = autoFix.actionPayload || {};
      const fixType = autoFix.fixType || payload.type || "";
      const customInput = fixTokenInput[msgIndex]?.trim();

      let appliedDescription = autoFix.title || "Auto-Fix";

      // 1. URL / ROUTE FIX (e.g. Correcting typos like /commentss -> /comments)
      if (
        fixType === "url" ||
        payload.type === "set_url" ||
        payload.type === "change_url" ||
        payload.type === "update_url" ||
        payload.key === "url" ||
        payload.key === "endpoint" ||
        autoFix.title?.toLowerCase().includes("url") ||
        autoFix.title?.toLowerCase().includes("route") ||
        autoFix.title?.toLowerCase().includes("path") ||
        autoFix.title?.toLowerCase().includes("endpoint") ||
        (typeof payload.value === "string" && (payload.value.startsWith("http://") || payload.value.startsWith("https://"))) ||
        (typeof autoFix.diff === "string" && autoFix.diff.includes("http"))
      ) {
        let newUrl = payload.value || payload.url || "";
        if (!newUrl && autoFix.diff) {
          const match = autoFix.diff.match(/\+\s*(https?:\/\/[^\s\n\r]+)/);
          if (match) newUrl = match[1];
        }

        // If newUrl is relative path (e.g. "/comments"), combine with current origin
        if (newUrl && !newUrl.startsWith("http") && currentApiContext?.url) {
          try {
            const parsed = new URL(currentApiContext.url);
            newUrl = `${parsed.origin}${newUrl.startsWith("/") ? "" : "/"}${newUrl}`;
          } catch {}
        }

        if (newUrl && setUrl) {
          setUrl(newUrl);

          if (setParamsObj) {
            if (newUrl.includes("?")) {
              const queryPart = newUrl.substring(newUrl.indexOf("?") + 1);
              try {
                const searchParams = new URLSearchParams(queryPart);
                const parsed = [];
                searchParams.forEach((val, key) => {
                  parsed.push({ key, value: val, description: "" });
                });
                parsed.push({ key: "", value: "", description: "" });
                setParamsObj(parsed);
              } catch {}
            } else {
              setParamsObj([{ key: "", value: "", description: "" }]);
            }
          }

          appliedDescription = `Corrected URL to ${newUrl}`;
        }
      }

      // 2. AUTHENTICATION FIX (Bearer / Basic Token)
      else if (
        fixType === "auth" ||
        payload.type === "set_auth" ||
        payload.key === "Authorization" ||
        autoFix.title?.toLowerCase().includes("auth")
      ) {
        const tokenVal = customInput || payload.value || "sample_jwt_token";
        const cleanToken = tokenVal.replace(/^Bearer\s+/i, "");

        if (setAuth) {
          setAuth({ type: "bearer", token: cleanToken });
        }
        if (setHeadersObj) {
          setHeadersObj((prev) => {
            const others = prev.filter((h) => h.key !== "Authorization" && h.key !== "");
            return [
              { key: "Authorization", value: `Bearer ${cleanToken}`, description: "AI Auto-Fix" },
              ...others,
              { key: "", value: "", description: "" }
            ];
          });
        }
        if (setActiveTab) setActiveTab("Authorization");
        appliedDescription = `Configured Authorization Bearer Token`;
      }

      // 3. HEADER FIX (Content-Type, Custom Headers)
      else if (
        fixType === "header" ||
        payload.type === "add_header" ||
        payload.type === "update_header"
      ) {
        const headerKey = payload.key || "Content-Type";
        const headerVal = customInput || payload.value || "application/json";

        if (setHeadersObj) {
          setHeadersObj((prev) => {
            const others = prev.filter((h) => h.key !== headerKey && h.key !== "");
            return [
              { key: headerKey, value: headerVal, description: "AI Auto-Fix" },
              ...others,
              { key: "", value: "", description: "" }
            ];
          });
        }
        if (setActiveTab) setActiveTab("Headers");
        appliedDescription = `Added Header ${headerKey}: ${headerVal}`;
      }

      // 4. BODY / JSON PAYLOAD FIX
      else if (
        fixType === "body" ||
        payload.type === "fix_body" ||
        autoFix.title?.toLowerCase().includes("body") ||
        autoFix.title?.toLowerCase().includes("json")
      ) {
        let bodyVal = payload.value || payload.newBody || autoFix.diff || "{}";
        if (typeof bodyVal === "object") {
          bodyVal = JSON.stringify(bodyVal, null, 2);
        } else if (typeof bodyVal === "string" && bodyVal.startsWith("+")) {
          bodyVal = bodyVal.replace(/^\+\s*/gm, "").trim();
        }

        if (setRawBody) setRawBody(bodyVal);
        if (setActiveTab) setActiveTab("Body");
        appliedDescription = `Updated JSON request body`;
      }

      // 5. QUERY PARAMETER FIX (Only for non-URL keys)
      else if (
        payload.key !== "url" &&
        (fixType === "param" || payload.type === "set_param" || autoFix.title?.toLowerCase().includes("param"))
      ) {
        const paramKey = payload.key || "id";
        const paramVal = customInput || payload.value || "1";

        if (setParamsObj) {
          setParamsObj((prev) => {
            const others = prev.filter((p) => p.key !== paramKey && p.key !== "");
            return [
              { key: paramKey, value: paramVal, description: "AI Auto-Fix" },
              ...others,
              { key: "", value: "", description: "" }
            ];
          });
        }
        if (setActiveTab) setActiveTab("Params");
        appliedDescription = `Set Query Parameter ${paramKey}=${paramVal}`;
      }

      // 6. HTTP METHOD FIX
      else if (
        fixType === "method" ||
        payload.type === "change_method" ||
        autoFix.title?.toLowerCase().includes("method")
      ) {
        const newMethod = (payload.value || payload.method || "GET").toUpperCase();
        if (setMethod) setMethod(newMethod);
        appliedDescription = `Changed method to ${newMethod}`;
      }

      // Save applied fix in context for RAG episode indexing upon success
      if (setAppliedFixInfo) {
        setAppliedFixInfo({
          ...autoFix,
          appliedDescription,
          appliedAt: new Date().toISOString(),
          originalStatus: currentApiContext?.status || 500,
          userInputUsed: customInput || null
        });
      }

      // Mark this fix as applied in local UI state
      setAppliedFixes((prev) => ({ ...prev, [msgIndex]: true }));
      showToast(`✨ Auto-Fix Applied: ${appliedDescription}! Ready to re-run.`);
    } catch (err) {
      console.error("Failed to apply auto-fix:", err);
      showToast("❌ Failed to apply auto-fix: " + err.message);
    }
  };

  useEffect(() => {
    if (botBodyRef.current) {
      botBodyRef.current.scrollTo({
        top: botBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  /* ===============================
     🔹 SEND CONVERSATIONAL PROMPT
     =============================== */
  const handleSend = async () => {
    const userQuery = input.trim();
    if (!userQuery) return;

    const userMessage = { from: "user", text: userQuery };
    setMessages((prev) => [
      ...prev,
      userMessage,
      { from: "bot", text: "Thinking...", isTemp: true }
    ]);
    setInput("");

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem("authToken");

      const response = await fetch(`${backendUrl}/api/ai/bot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          userId: "user123",
          message: userQuery,
          currentApiContext: currentApiContext,
          requestHistory: messages
        })
      });

      const data = await response.json();
      let botMessage = "";

      if (!response.ok) {
        botMessage = `⚠️ Error ${response.status}: ${data.error || data.message || data.detail || JSON.stringify(data)}`;
      } else {
        botMessage = data.text || "Got it!";
      }

      setMessages((prev) => [
        ...prev.filter((msg) => !msg.isTemp),
        { from: "bot", text: botMessage }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((msg) => !msg.isTemp),
        { from: "bot", text: "❌ Failed to reach AI bot. Try again." }
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const parseBotMessage = (text) => {
    if (typeof text !== "string") return null;

    const parts = text.split(/(?=###)/g);

    return parts.map((part, index) => {
      const trimmed = part.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith("###")) {
        const lines = trimmed.split("\n");
        const heading = lines[0].replace(/###/g, "").trim();
        const body = lines.slice(1).join("\n").trim();

        const lowerHeading = heading.toLowerCase();
        const isSpecialHeading =
          lowerHeading.includes("diagnosis") ||
          lowerHeading.includes("summary") ||
          lowerHeading.includes("suggestion") ||
          lowerHeading.includes("fix") ||
          heading.includes("🧠") ||
          heading.includes("📌") ||
          heading.includes("🚀") ||
          heading.includes("💡");

        if (isSpecialHeading) {
          return (
            <div key={index} className="bot-special-section" style={{ marginTop: 10 }}>
              <div className="bot-heading-box">{heading}</div>
              <div className="bot-text-line" style={{ marginTop: 6 }}>
                {body.split("\n").map((line, idx) => (
                  <div key={idx} style={{ marginTop: idx > 0 ? 4 : 0 }}>
                    {line.replace(/\*\*/g, "")}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={index} className="bot-general-section" style={{ marginTop: 10 }}>
            <div className="bot-section-title">{heading}</div>
            <div className="bot-text-line" style={{ marginTop: 4 }}>
              {body.split("\n").map((line, idx) => (
                <div key={idx} style={{ marginTop: idx > 0 ? 4 : 0 }}>
                  {line.replace(/\*\*/g, "")}
                </div>
              ))}
            </div>
          </div>
        );
      } else {
        return (
          <div key={index} className="bot-text-plain">
            {trimmed.split("\n").map((line, idx) => (
              <div key={idx} className="bot-text-line" style={{ marginTop: idx > 0 ? 4 : 0 }}>
                {line.replace(/\*\*/g, "")}
              </div>
            ))}
          </div>
        );
      }
    });
  };

  const token = localStorage.getItem("authToken");

  if (!token) {
    return (
      <div className="bot-sidebar">
        <div className="bot-header">
          <div className="bot-header-left">
            <h3 style={{ color: "#ff8810", fontWeight: "bold", margin: 0, whiteSpace: "nowrap" }} className="bot-title">
              JARVIS AI Assistant
            </h3>
          </div>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>
        <div className="bot-auth-prompt" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "calc(100% - 60px)",
          padding: "20px",
          textAlign: "center",
          color: "#aaa"
        }}>
          <div style={{ fontSize: "40px", marginBottom: "15px" }}>🔒</div>
          <h4 style={{ color: "#fff", marginBottom: "10px", fontSize: "18px" }}>Authentication Required</h4>
          <p style={{ fontSize: "14px", marginBottom: "20px", lineHeight: "1.5" }}>
            Please log in to chat with J.A.R.V.I.S. and utilize RAG auto-fix diagnostics.
          </p>
          <a
            href="/login"
            className="login-prompt-btn"
            onClick={() => setShowBot(false)}
            style={{
              display: "inline-block",
              background: "#ff7f00",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "14px"
            }}
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bot-sidebar">
      {/* HEADER */}
      <div className="bot-header">
        <div className="bot-header-left">
          <h3 style={{ color: "#ff8810", fontWeight: "bold", margin: 0, whiteSpace: "nowrap" }} className="bot-title">
            ⚡ JARVIS Auto-Fix & Diagnostics
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="refresh-btn"
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
            title="Refresh/Clear Chat"
          >
            🔄
          </button>
          <button className="close-btn" onClick={onClose} style={{ padding: 0, display: "flex", alignItems: "center" }}>✖</button>
        </div>
      </div>

      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal terminal-modal">
            <div className="modal-title">⚠️ ALERT: REFRESH ASSISTANT</div>
            <div className="modal-body-text">
              Are you sure you want to refresh the assistant? This will clear all current session messages.
            </div>
            <div className="modal-actions">
              <button className="btn-no" onClick={() => setShowClearConfirm(false)}>[ NO, CANCEL ]</button>
              <button className="btn-yes" onClick={handleClearBot}>[ YES, CLEAR ]</button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT BODY */}
      <div className="bot-body" ref={botBodyRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`bot-message ${msg.from}`}>
            {/* USER MESSAGE */}
            {msg.from === "user" && <div>{String(msg.text)}</div>}

            {/* V2 STRUCTURED FAILURE ASSISTANT MESSAGE */}
            {msg.from === "bot" && msg.type === "failure_assist" && msg.diagnosis && (
              <div className="failure-assist-container">
                <div className="failure-alert-banner">
                  <span className="alert-bolt">⚡</span>
                  <div>
                    <h4 className="failure-heading">Failure Detected ({msg.status || 500})</h4>
                    <p className="failure-subtext">Automatic AI Diagnostics Triggered</p>
                  </div>
                </div>

                {/* What Happened & Why */}
                <div className="diag-section-box">
                  <div className="diag-box-title">🕵️ What Happened</div>
                  <div className="diag-box-text">{msg.diagnosis.whatHappened}</div>

                  <div className="diag-box-title" style={{ marginTop: 8 }}>🤔 Why It Happened</div>
                  <div className="diag-box-text">{msg.diagnosis.why}</div>

                  {msg.diagnosis.evidence && msg.diagnosis.evidence.length > 0 && (
                    <div className="evidence-list-box">
                      <span className="evidence-title">🔍 Diagnostic Evidence:</span>
                      {msg.diagnosis.evidence.map((ev, evIdx) => (
                        <div key={evIdx} className="evidence-item">• {ev}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Root Cause Prediction Box */}
                {msg.diagnosis.rootCause && (
                  <div className="root-cause-prediction-box">
                    <div className="rc-header">
                      <span className="rc-icon">🧠</span>
                      <span className="rc-title">Backend Root-Cause Prediction</span>
                      <span className="rc-simulated-tag">[ PREDICTION ]</span>
                    </div>

                    <div className="rc-layer-row">
                      <span className="rc-layer-badge">
                        Layer: {msg.diagnosis.rootCause.predictedLayer || "Server / Business Logic"}
                      </span>
                      <span className="rc-confidence-meter">
                        {msg.diagnosis.rootCause.confidence || 85}% Confidence
                      </span>
                    </div>

                    <div className="rc-probable-cause">
                      {msg.diagnosis.rootCause.probableCause}
                    </div>

                    {msg.diagnosis.rootCause.nextAction && (
                      <div className="rc-next-action">
                        <strong>Recommended Next Action:</strong> {msg.diagnosis.rootCause.nextAction}
                      </div>
                    )}
                  </div>
                )}

                {/* 🏛️ RAG GROUNDED HISTORICAL EVIDENCE */}
                {msg.retrievedEpisodes && msg.retrievedEpisodes.length > 0 && (
                  <div className="rag-evidence-box">
                    <div className="rag-evidence-header">
                      <span className="rag-icon">🏛️</span>
                      <span className="rag-title">Retrieved Historical Evidence (RAG)</span>
                      <span className="rag-badge">{msg.retrievedEpisodes.length} Precedent(s) Found</span>
                    </div>

                    {msg.retrievedEpisodes.map((ep, epIdx) => (
                      <div key={epIdx} className="rag-episode-card">
                        <div className="rag-episode-top">
                          <span className="rag-sim-pill">🎯 {ep.matchPercentage || 90}% Match</span>
                          <span className="rag-timestamp">🕒 {new Date(ep.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="rag-endpoint-name">📌 {ep.endpoint}</div>
                        <div className="rag-row">
                          <strong className="rag-label">Previous Error:</strong>
                          <span className="rag-val-err">Status {ep.failedStatus} ({ep.previousError || 'Error observed'})</span>
                        </div>
                        {ep.successfulFixUsed && Object.keys(ep.successfulFixUsed).length > 0 && (
                          <div className="rag-row">
                            <strong className="rag-label">Historical Fix Used:</strong>
                            <span className="rag-val-fix">
                              {ep.successfulFixUsed.description || ep.successfulFixUsed.title || ep.successfulFixUsed.diff || JSON.stringify(ep.successfulFixUsed)}
                            </span>
                          </div>
                        )}
                        <div className="rag-outcome-row">
                          <span className="rag-outcome-tag">✅ Outcome: Succeeded (Status {ep.resultStatus || 200}) in {ep.resultDuration || 0}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Confirmed Auto-Fix Box */}
                {msg.diagnosis.autoFix && msg.diagnosis.autoFix.fixable ? (
                  <div className="auto-fix-confirmed-box">
                    <div className="fix-box-header">
                      <span className="fix-icon">🛠️</span>
                      <div>
                        <h5 className="fix-title">Confirmed AI Auto-Fix</h5>
                        <p className="fix-subtitle">{msg.diagnosis.autoFix.confirmationPrompt || "Should I fix this for you?"}</p>
                      </div>
                    </div>

                    {msg.diagnosis.autoFix.diff && (
                      <div className="fix-diff-preview">
                        <span className="diff-label">Proposed Changes:</span>
                        <pre className="diff-code">{msg.diagnosis.autoFix.diff}</pre>
                      </div>
                    )}

                    {/* Optional Token input field if auth needed */}
                    {msg.diagnosis.autoFix.actionPayload?.requiresUserInput && (
                      <div className="user-input-prompt-box">
                        <label className="input-prompt-label">
                          {msg.diagnosis.autoFix.actionPayload.userInputPrompt || "Enter Token"}:
                        </label>
                        <input
                          type="text"
                          className="fix-input-field"
                          placeholder="Paste token or credentials here..."
                          value={fixTokenInput[i] || ""}
                          onChange={(e) => setFixTokenInput({ ...fixTokenInput, [i]: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="fix-actions-row">
                      {!appliedFixes[i] ? (
                        <>
                          <button
                            className="btn-apply-fix"
                            onClick={() => handleApplyFix(i, msg.diagnosis.autoFix)}
                          >
                            ✅ Apply Fix to Workspace
                          </button>
                          <button
                            className="btn-dismiss-fix"
                            onClick={() => setAppliedFixes({ ...appliedFixes, [i]: "dismissed" })}
                          >
                            ❌ Dismiss
                          </button>
                        </>
                      ) : appliedFixes[i] === true ? (
                        <div className="fix-applied-success">
                          <span>✅ Fix Applied to Request Workspace!</span>
                          {onRerunRequest && (
                            <button className="btn-rerun-now" onClick={onRerunRequest}>
                              🚀 Re-run Request Now
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="fix-dismissed-msg">Fix dismissed.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  msg.diagnosis.whatToDo && msg.diagnosis.whatToDo.length > 0 && (
                    <div className="what-to-do-box">
                      <span className="what-to-do-title">📋 What You Should Do:</span>
                      {msg.diagnosis.whatToDo.map((step, sIdx) => (
                        <div key={sIdx} className="what-step">• {step}</div>
                      ))}
                    </div>
                  )
                )}

                {/* History Evolution Insight */}
                {msg.diagnosis.historyEvolutionInsight && (
                  <div className="history-insight-badge">
                    <span>🕒 History Evolution: {msg.diagnosis.historyEvolutionInsight}</span>
                  </div>
                )}
              </div>
            )}

            {/* BOT MESSAGE (STRING OR FALLBACK OBJECT) */}
            {msg.from === "bot" && msg.type !== "failure_assist" && (
              typeof msg.text === "string" ? (
                parseBotMessage(msg.text)
              ) : (
                <>
                  {msg.text?.diagnosis && (
                    <div className="bot-diagnosis-box">
                      <div className="bot-diagnosis-title">🧠 Diagnosis</div>
                      <div className="bot-diagnosis-text">{msg.text.diagnosis}</div>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="bot-footer">
        <input
          type="text"
          placeholder="Ask J.A.R.V.I.S. about API testing, headers, debugging..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
