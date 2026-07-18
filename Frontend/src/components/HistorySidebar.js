import React, { useState, useEffect } from "react";
import "./HistorySidebar.css";

// Group by date only
function groupByDate(items) {
  const groups = {};

  const sorted = [...items].sort((a, b) => {
    const timeA = a.time ? new Date(a.time) : new Date(0);
    const timeB = b.time ? new Date(b.time) : new Date(0);
    return timeB - timeA;
  });

  sorted.forEach((h) => {
    let d = new Date(h.time);
    if (isNaN(d.getTime())) {
      d = new Date(0); // fallback to unix epoch if invalid
    }
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label;
    if (d.toDateString() === today.toDateString()) label = "Today";
    else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else {
      label = d.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(h);
  });

  return groups;
}

export default function HistorySidebar({ items = [], onSelect, onDelete, onClear, onCountChange }) {
  const [collapsed, setCollapsed] = useState({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    if (onCountChange) {
      onCountChange(items.length);
    }
  }, [items]);
  const grouped = groupByDate(items);

  return (
    <aside className="history">
      {/* Single Item Delete Modal */}
      {itemToDelete && (
        <div className="modal-overlay">
          <div className="confirm-modal terminal-modal">
            <div className="modal-title">⚠️ DELETE REQUEST</div>
            <div className="modal-body-text">
              Do you want to delete this request from history?
            </div>
            <div className="modal-actions">
              <button className="btn-no" onClick={() => setItemToDelete(null)}>[ NO, CANCEL ]</button>
              <button className="btn-yes" onClick={() => {
                onDelete(itemToDelete);
                setItemToDelete(null);
              }}>[ YES, DELETE ]</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal terminal-modal">
            <div className="modal-title">⚠️ CLEAR HISTORY</div>
            <div className="modal-body-text">
              Do you really want to delete all requests in history?
            </div>
            <div className="modal-actions">
              <button className="btn-no" onClick={() => setShowClearConfirm(false)}>[ NO, CANCEL ]</button>
              <button className="btn-yes" onClick={() => {
                setShowClearConfirm(false);
                onClear();
              }}>[ YES, DELETE ALL ]</button>
            </div>
          </div>
        </div>
      )}

      <div className="history-header">
        <h3>History</h3>
        <button className="clear-btn" onClick={() => setShowClearConfirm(true)}>Clear</button>
      </div>

      <div className="history-list">
        {items.length === 0 && (
          <div className="history-empty">No requests yet</div>
        )}

        {Object.entries(grouped).map(([date, list]) => (
          <div key={date} className="history-group">
            <button
              className="group-header"
              onClick={() =>
                setCollapsed({ ...collapsed, [date]: !collapsed[date] })
              }
            >
              {date}
              <span className="chevron">{collapsed[date] ? "▶" : "▼"}</span>
            </button>

            {!collapsed[date] && (
              <ul>
                {list.map((h) => (
                  <li key={h._id} className="history-item">
                    <button className="history-main" onClick={() => onSelect(h)}>
                      <span className={`method pill method-${h.method?.toLowerCase()}`}>
                        {h.method}
                      </span>
                      <span className="url" title={h.url}>{h.url}</span>
                    </button>

                    <div className="history-meta">
                      <span className={`status ${String(h.status).startsWith("ERR") ? "err" : ""}`}>
                        {h.status}
                      </span>
                      <span className="dot">•</span>
                      <span className="duration">{h.duration || 0} ms</span>
                      <span className="dot">•</span>
                      <span className="time">
                        {(() => {
                          const t = new Date(h.time);
                          return isNaN(t.getTime()) ? "00:00:00" : t.toLocaleTimeString();
                        })()}
                      </span>
                      <button className="del" onClick={() => setItemToDelete(h._id)}>
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
