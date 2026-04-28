export default function LogsPage({ positions, closedTrades }) {
  const logs = [
    ...positions.map((position) => ({
      type: "OPEN",
      text: `Order ${position.orderId} ${position.side} ${position.quantity} ${position.symbol} @ ${position.price || "MARKET"}`,
      time: position.time,
    })),
    ...closedTrades.map((trade) => ({
      type: "CLOSE",
      text: `Trade ${trade.side} ${trade.quantity} ${trade.symbol} @ ${trade.price}`,
      time: trade.time,
    })),
  ]
    .sort((left, right) => new Date(right.time) - new Date(left.time))
    .slice(0, 20);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Logs & Audit</h1>
        <p className="page-sub">Full audit trail of backend order activity</p>
      </div>
      <div className="card">
        {logs.map((log, index) => (
          <div key={index} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
            <span style={{ color: "var(--text3)", fontFamily: "var(--mono)", minWidth: 160 }}>{new Date(log.time).toLocaleString()}</span>
            <span className={`badge ${log.type === "OPEN" ? "badge-buy" : "badge-closed"}`}>{log.type}</span>
            <span style={{ color: "var(--text2)" }}>{log.text}</span>
          </div>
        ))}
        {positions.length === 0 && closedTrades.length === 0 && <div className="empty">No activity yet.</div>}
      </div>
    </div>
  );
}
