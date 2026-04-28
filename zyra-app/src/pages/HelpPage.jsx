const HELP_ITEMS = [
  ["Getting Started", "Set up your Binance API keys and open your first simulated trade."],
  ["AI Agent Guide", "Configure thresholds for automated buy/sell signals."],
  ["Risk Management", "Understand stop-loss, take-profit and leverage settings."],
  ["Testnet vs Live", "Practice safely on testnet before switching to live trading."],
];

export default function HelpPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Help & Documentation</h1>
      </div>
      <div className="grid-2">
        {HELP_ITEMS.map(([title, description]) => (
          <div key={title} className="card" style={{ cursor: "pointer" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 13, color: "var(--text3)" }}>{description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
