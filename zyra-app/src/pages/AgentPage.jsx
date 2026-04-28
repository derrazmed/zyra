import { useEffect, useRef, useState } from "react";

import { INITIAL_PRICES, SYMBOLS } from "../constants/symbols.js";
import { generateId } from "../utils/formatters.js";
import Icon from "../components/Icon.jsx";

function AgentPage({ positions, prices, onOpenPosition, toast }) {
  const [agentActive, setAgentActive] = useState(false);
  const [agentTrades, setAgentTrades] = useState([]);
  const [config, setConfig] = useState({ asset: "BTCUSDT", buyThreshold: 1.5, sellThreshold: 2.0, stopLoss: 3.0, takeProfit: 5.0, size: 0.01 });
  const intervalRef = useRef(null);
  const prevPricesRef = useRef({ ...INITIAL_PRICES });

  const toggleAgent = () => {
    if (agentActive) {
      clearInterval(intervalRef.current);
      setAgentActive(false);
      toast("AI Agent paused", "info");
    } else {
      setAgentActive(true);
      toast("AI Agent activated — monitoring markets", "success");
    }
  };

  useEffect(() => {
    if (agentActive) {
      intervalRef.current = setInterval(() => {
        const pair = config.asset;
        const currentPrice = prices[pair];
        const prevPrice = prevPricesRef.current[pair];
        if (!currentPrice || !prevPrice) return;
        const pctChange = ((currentPrice - prevPrice) / prevPrice) * 100;
        let action = null;
        if (pctChange <= -config.buyThreshold) action = "BUY";
        else if (pctChange >= config.sellThreshold) action = "SELL";
        if (action) {
          const trade = {
            id: generateId(), asset: pair.replace("USDT", ""), action, price: currentPrice,
            size: config.size, pnl: 0, time: new Date().toISOString(), trigger: `${pctChange.toFixed(2)}% move`
          };
          setAgentTrades(p => [trade, ...p].slice(0, 20));
          onOpenPosition({ pair, side: action, sizeNum: config.size, entryPrice: currentPrice, id: generateId(), openedAt: new Date().toISOString(), leverage: "1" });
          toast(`Agent ${action} ${config.size} ${pair.replace("USDT","")} @ $${currentPrice}`, action === "BUY" ? "success" : "info");
        }
        prevPricesRef.current = { ...prices };
      }, 3000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [agentActive, prices, config]);

  const totalAgentTrades = agentTrades.length;
  const wins = agentTrades.filter(t => t.pnl >= 0).length;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">AI Agent</h1>
          <p className="page-sub">Automated trading strategies powered by AI</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {agentActive && <span className="live-dot" />}
          <span style={{ background: agentActive ? "rgba(0,209,122,.12)" : "var(--bg3)", color: agentActive ? "var(--green)" : "var(--text3)", border: `1px solid ${agentActive ? "rgba(0,209,122,.2)" : "var(--border)"}`, padding: "4px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
            {agentActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Overview */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 1 }}>⊕ Overview</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div className="agent-stat"><div className="val">{totalAgentTrades}</div><label>Total Trades</label></div>
            <div className="agent-stat"><div className="val">{totalAgentTrades > 0 ? ((wins/totalAgentTrades)*100).toFixed(1) : "0.0"}%</div><label>Win Rate</label></div>
            <div className="agent-stat"><div className="val" style={{ color: "var(--green)" }}>+$0</div><label>Profit</label></div>
            <div className="agent-stat"><div className="val">{positions.length}</div><label>Active Trades</label></div>
          </div>
          <div className="agent-controls">
            <button className="btn btn-green btn-sm" onClick={toggleAgent} disabled={agentActive} style={{ flex: 1 }}>
              <Icon name="play" size={12} /> Start
            </button>
            <button className="btn btn-ghost btn-sm" onClick={toggleAgent} disabled={!agentActive} style={{ flex: 1 }}>
              <Icon name="pause" size={12} /> Pause
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => { setAgentActive(false); toast("Agent stopped", "info"); }} style={{ flex: 1 }}>
              <Icon name="stop" size={12} /> Stop
            </button>
          </div>
        </div>

        {/* Strategy Config */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>⚙ Strategy</div>
          <div className="form-group">
            <label className="form-label">Target Asset</label>
            <select className="form-select" value={config.asset} onChange={e => setConfig(p => ({ ...p, asset: e.target.value }))}>
              {SYMBOLS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div>
              <label className="form-label">Buy Threshold (%)</label>
              <input className="form-input" type="number" step=".1" value={config.buyThreshold} onChange={e => setConfig(p => ({ ...p, buyThreshold: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label className="form-label">Sell Threshold (%)</label>
              <input className="form-input" type="number" step=".1" value={config.sellThreshold} onChange={e => setConfig(p => ({ ...p, sellThreshold: parseFloat(e.target.value) }))} />
            </div>
          </div>
          <div className="form-row" style={{ marginTop: 8 }}>
            <div>
              <label className="form-label">Stop Loss (%)</label>
              <input className="form-input" type="number" step=".1" value={config.stopLoss} onChange={e => setConfig(p => ({ ...p, stopLoss: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label className="form-label">Take Profit (%)</label>
              <input className="form-input" type="number" step=".1" value={config.takeProfit} onChange={e => setConfig(p => ({ ...p, takeProfit: parseFloat(e.target.value) }))} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <label className="form-label">Trade Size (qty)</label>
            <input className="form-input" type="number" step="any" value={config.size} onChange={e => setConfig(p => ({ ...p, size: parseFloat(e.target.value) }))} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 12 }}>Save Strategy</button>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>⊕ Activity Log</div>
        {agentTrades.length === 0 ? (
          <div className="empty">Agent not started yet. Configure and start the agent above.</div>
        ) : (
          agentTrades.map(t => (
            <div key={t.id} className="activity-item">
              <div className="activity-icon" style={{ background: t.action === "BUY" ? "rgba(0,229,212,.1)" : "rgba(255,71,87,.1)", color: t.action === "BUY" ? "var(--cyan)" : "var(--red)", borderRadius: 8 }}>
                {t.action}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{t.action} {t.size} {t.asset} @ ${t.price.toLocaleString()}</span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{new Date(t.time).toLocaleTimeString()}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>Trigger: {t.trigger}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS PAGE ──────────────────────────────────────────────────────

export default AgentPage;
