import React from "react";
import "./ApiHealthScoreModal.css";

export default function ApiHealthScoreModal({ scoreData, onClose, onRefresh }) {
  if (!scoreData) return null;

  const { totalScore = 0, grade = "N/A", categories = {}, deductions = [], recommendations = [] } = scoreData;

  const getScoreColor = (score) => {
    if (score >= 85) return "#22c55e"; // green
    if (score >= 70) return "#3b82f6"; // blue
    if (score >= 50) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const getGradeBadgeClass = (g) => {
    switch (g.toLowerCase()) {
      case "excellent": return "badge-excellent";
      case "good": return "badge-good";
      case "fair": return "badge-fair";
      default: return "badge-critical";
    }
  };

  const categoryIcons = {
    security: "🛡️",
    performance: "⚡",
    documentation: "📄",
    errorHandling: "⚠️",
    bestPractices: "✨"
  };

  const categoryTitles = {
    security: "Security",
    performance: "Performance",
    documentation: "Documentation & Specs",
    errorHandling: "Error Handling",
    bestPractices: "Best Practices"
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="health-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="health-modal-header">
          <div className="health-header-left">
            <span className="health-icon-pulse">📊</span>
            <div>
              <h3 className="health-title">API Health Score Inspector</h3>
              <p className="health-subtitle">Measurable quality, security & performance analysis</p>
            </div>
          </div>
          <div className="health-header-actions">
            {onRefresh && (
              <button className="health-refresh-btn" onClick={onRefresh} title="Recalculate Score">
                🔄 Recalculate
              </button>
            )}
            <button className="health-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="health-modal-body">
          {/* Top Score Banner */}
          <div className="health-score-hero">
            <div className="health-gauge-box">
              <div 
                className="health-gauge-circle" 
                style={{ 
                  background: `conic-gradient(${getScoreColor(totalScore)} ${totalScore * 3.6}deg, #18181b 0deg)`
                }}
              >
                <div className="health-gauge-inner">
                  <span className="health-big-score" style={{ color: getScoreColor(totalScore) }}>
                    {totalScore}
                  </span>
                  <span className="health-score-out-of">/ 100</span>
                </div>
              </div>
            </div>

            <div className="health-hero-details">
              <div className="health-grade-row">
                <span className="health-status-label">Overall Rating:</span>
                <span className={`health-grade-badge ${getGradeBadgeClass(grade)}`}>
                  {grade.toUpperCase()}
                </span>
              </div>
              <p className="health-verdict-text">
                {totalScore >= 85 
                  ? "Outstanding API design! High security, strong performance, and strict standard adherence."
                  : totalScore >= 70
                  ? "Good API configuration. Minor optimizations recommended for optimal reliability."
                  : totalScore >= 50
                  ? "Fair quality. Important security, latency, or spec improvements are required."
                  : "Critical health state. Multiple vulnerabilities or performance bottlenecks detected."}
              </p>
            </div>
          </div>

          {/* 5 Measurable Dimensions */}
          <h4 className="section-heading">Dimension Breakdown (20 pts each)</h4>
          <div className="health-categories-grid">
            {Object.entries(categories).map(([key, cat]) => {
              const icon = categoryIcons[key] || "📌";
              const title = categoryTitles[key] || key;
              const catScore = cat.score ?? 0;
              const catMax = cat.max ?? 20;
              const percent = Math.round((catScore / catMax) * 100);

              return (
                <div key={key} className="health-category-card">
                  <div className="cat-card-header">
                    <span className="cat-icon">{icon}</span>
                    <span className="cat-title">{title}</span>
                    <span className="cat-score-text" style={{ color: getScoreColor(percent) }}>
                      {catScore}/{catMax}
                    </span>
                  </div>
                  <div className="cat-progress-track">
                    <div 
                      className="cat-progress-fill" 
                      style={{ 
                        width: `${percent}%`,
                        backgroundColor: getScoreColor(percent)
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deductions Section */}
          <h4 className="section-heading">Itemized Deductions</h4>
          <div className="health-deductions-box">
            {deductions && deductions.length > 0 ? (
              deductions.map((d, i) => (
                <div key={i} className="deduction-row">
                  <span className="deduction-badge">{d.category}</span>
                  <span className="deduction-points">{d.points} pts</span>
                  <span className="deduction-reason">{d.reason}</span>
                </div>
              ))
            ) : (
              <div className="no-deductions-msg">
                🎉 No deductions applied! Full compliance achieved.
              </div>
            )}
          </div>

          {/* Actionable Recommendations */}
          <h4 className="section-heading">Actionable Recommendations</h4>
          <div className="health-recommendations-list">
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <div key={i} className="recommendation-item">
                  <span className="rec-bullet">💡</span>
                  <span className="rec-text">{rec}</span>
                </div>
              ))
            ) : (
              <div className="recommendation-item">
                <span className="rec-bullet">✅</span>
                <span className="rec-text">API meets all standard testing criteria.</span>
              </div>
            )}
          </div>
        </div>

        <div className="health-modal-footer">
          <button className="health-dismiss-btn" onClick={onClose}>
            [ CLOSE INSPECTOR ]
          </button>
        </div>
      </div>
    </div>
  );
}
