import { useState } from "react";

function NotificationsPage({ notifications, onRead }) {
  const [filter, setFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const types = ["All", "Trades", "Alerts", "System"];
  const statuses = ["All", "Unread", "Read"];
  const filtered = notifications.filter(n => {
    if (typeFilter !== "All" && n.type !== typeFilter.toUpperCase().replace("S", "").slice(0, -1) && typeFilter !== "Trades") {
      if (typeFilter === "Trades" && n.type !== "TRADE") return false;
      if (typeFilter === "Alerts" && n.type !== "ALERT") return false;
      if (typeFilter === "System" && n.type !== "SYSTEM") return false;
    }
    if (filter === "Unread" && n.isRead) return false;
    if (filter === "Read" && !n.isRead) return false;
    return true;
  });
  const typeIcons = { TRADE: "📊", ALERT: "🔔", SYSTEM: "⚙" };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        <p className="page-sub">Stay informed about your trading activity</p>
      </div>
      <div className="card">
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {types.map(t => (
            <button key={t} className={`tab ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)} style={{ background: typeFilter === t ? "var(--bg4)" : "transparent" }}>{t}</button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {statuses.map(s => (
              <button key={s} className={`tab ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)} style={{ background: filter === s ? "var(--bg4)" : "transparent" }}>{s}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? <div className="empty">No notifications.</div> : filtered.map(n => (
          <div key={n.id} className={`notif-item ${!n.isRead ? "unread" : ""}`} onClick={() => onRead(n.id)}>
            <div className="notif-icon" style={{ background: n.type === "TRADE" ? "rgba(0,229,212,.1)" : n.type === "ALERT" ? "rgba(255,211,42,.1)" : "rgba(74,85,104,.15)", fontSize: 14 }}>
              {typeIcons[n.type] || "📢"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 13 }}>{n.title}</span>
                <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 12 }}>{n.time}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{n.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── INTEGRATIONS PAGE ───────────────────────────────────────────────────────

export default NotificationsPage;
