import { useState } from "react";

import Icon from "../components/Icon.jsx";

function StrategiesPage({ toast }) {
  const [strategies, setStrategies] = useState([
    { id: 1, name: "Core Spot Trend", desc: "Momentum-based strategy for major assets using EMA crossover and RSI", tags: ["Core", "Momentum"], venues: "CEX", mode: "live", winRate: 68.1, totalPnl: 23450.8, active: true },
    { id: 2, name: "Alt Momentum", desc: "Alternative asset momentum strategy with sentiment modulation", tags: ["Alt", "Sentiment"], venues: "CEX, DEX", mode: "paper", winRate: 73.9, totalPnl: 8920.15, active: true },
    { id: 3, name: "DCA Bot ETH", desc: "Dollar-cost averaging strategy for ETH accumulation on dips", tags: ["DCA", "Accumulation"], venues: "CEX", mode: "paper", winRate: 91.2, totalPnl: 4210.5, active: false },
  ]);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", desc: "", venues: "CEX", mode: "paper", buyThreshold: "2", sellThreshold: "3", stopLoss: "5", takeProfit: "8" });

  const toggle = (id) => {
    setStrategies(p => p.map(s => s.id === id ? { ...s, active: !s.active } : s));
    const s = strategies.find(x => x.id === id);
    toast(s.active ? `${s.name} disabled` : `${s.name} activated`, s.active ? "info" : "success");
  };

  const createStrategy = () => {
    if (!newForm.name) return;
    setStrategies(p => [...p, { id: Date.now(), ...newForm, winRate: 0, totalPnl: 0, active: false, tags: [newForm.venues] }]);
    setShowNew(false);
    toast("Strategy created successfully", "success");
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Strategies</h1>
          <p className="page-sub">Configure and monitor your trading strategies</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icon name="plus" size={13} /> New Strategy</button>
      </div>

      {strategies.map(s => (
        <div key={s.id} className="strategy-card">
          <div className={`active-badge`} style={{ color: s.active ? "var(--green)" : "var(--text3)", background: s.active ? "rgba(0,209,122,.12)" : "var(--bg3)", border: `1px solid ${s.active ? "rgba(0,209,122,.2)" : "var(--border)"}` }}>
            {s.active ? "Active" : "Inactive"}
          </div>
          <div className="strategy-name">{s.name}</div>
          <div className="strategy-desc">{s.desc}</div>
          <div className="strategy-tags">{s.tags.map(t => <span key={t} className="strategy-tag">{t}</span>)}</div>
          <div className="strategy-stats">
            <div className="strategy-stat"><label>Venues</label><span>{s.venues}</span></div>
            <div className="strategy-stat"><label>Mode</label><span style={{ color: s.mode === "live" ? "var(--green)" : "var(--yellow)" }}>{s.mode}</span></div>
            <div className="strategy-stat"><label>Win Rate</label><span className="green">{s.winRate}%</span></div>
            <div className="strategy-stat"><label>Total P&L</label><span className="green">${s.totalPnl.toLocaleString()}</span></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`btn btn-sm ${s.active ? "btn-danger" : "btn-green"}`} onClick={() => toggle(s.id)}>
              {s.active ? "⏸ Disable" : "▶ Enable"}
            </button>
            <button className="btn btn-ghost btn-sm">✎ Edit</button>
          </div>
        </div>
      ))}

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowNew(false)}><Icon name="close" size={14} /></button>
            <div className="modal-title">Create Strategy</div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" placeholder="Strategy name" value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" placeholder="Brief description" value={newForm.desc} onChange={e => setNewForm(p => ({ ...p, desc: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Venues</label>
                <select className="form-select" value={newForm.venues} onChange={e => setNewForm(p => ({ ...p, venues: e.target.value }))}>
                  <option>CEX</option><option>DEX</option><option>CEX, DEX</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Mode</label>
                <select className="form-select" value={newForm.mode} onChange={e => setNewForm(p => ({ ...p, mode: e.target.value }))}>
                  <option>paper</option><option>live</option>
                </select>
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Buy Threshold (%)</label>
                <input className="form-input" type="number" value={newForm.buyThreshold} onChange={e => setNewForm(p => ({ ...p, buyThreshold: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Sell Threshold (%)</label>
                <input className="form-input" type="number" value={newForm.sellThreshold} onChange={e => setNewForm(p => ({ ...p, sellThreshold: e.target.value }))} />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Stop Loss (%)</label>
                <input className="form-input" type="number" value={newForm.stopLoss} onChange={e => setNewForm(p => ({ ...p, stopLoss: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Take Profit (%)</label>
                <input className="form-input" type="number" value={newForm.takeProfit} onChange={e => setNewForm(p => ({ ...p, takeProfit: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={createStrategy}>Create Strategy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WALLET PAGE ─────────────────────────────────────────────────────────────

export default StrategiesPage;
