import { useState } from "react";

import { fmtMoney } from "../utils/formatters.js";

function WalletPage({ prices }) {
  const [tab, setTab] = useState("balances");
  const walletAssets = [
    { sym: "BTC", name: "Bitcoin", qty: 0.125, color: "#F7931A" },
    { sym: "ETH", name: "Ethereum", qty: 2.5, color: "#627EEA" },
    { sym: "SOL", name: "Solana", qty: 45, color: "#9945FF" },
    { sym: "BNB", name: "BNB", qty: 12, color: "#F3BA2F" },
    { sym: "ADA", name: "Cardano", qty: 3500, color: "#0033AD" },
  ];

  const total = walletAssets.reduce((s, a) => s + a.qty * (prices[`${a.sym}USDT`] || 0), 0);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Wallet</h1>
          <p className="page-sub">Manage your crypto assets and transactions</p>
        </div>
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 20px", textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 2 }}>TOTAL BALANCE</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, color: "var(--cyan)" }}>{fmtMoney(total)}</div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {["balances", "deposit", "withdraw", "history"].map(t => (
            <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</div>
          ))}
        </div>

        {tab === "balances" && (
          <div>
            {walletAssets.map(a => {
              const val = a.qty * (prices[`${a.sym}USDT`] || 0);
              const cur = prices[`${a.sym}USDT`] || 0;
              const pct = (val / total) * 100;
              return (
                <div key={a.sym} className="asset-row">
                  <div className="asset-icon" style={{ background: a.color + "22", color: a.color }}>{a.sym.slice(0, 2)}</div>
                  <div>
                    <div className="asset-name">{a.name}</div>
                    <div className="asset-sym">{a.sym}</div>
                  </div>
                  <div style={{ flex: 1, margin: "0 16px" }}>
                    <div style={{ height: 4, borderRadius: 2, background: "var(--bg3)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: a.color, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{pct.toFixed(1)}% of portfolio</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{fmtMoney(cur, cur < 1 ? 4 : 2)}</div>
                    <div style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>{a.qty} {a.sym}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>{fmtMoney(val)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(tab === "deposit" || tab === "withdraw") && (
          <div style={{ maxWidth: 400 }}>
            <div className="form-group">
              <label className="form-label">Asset</label>
              <select className="form-select">
                {walletAssets.map(a => <option key={a.sym}>{a.sym} — {a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input className="form-input" type="number" placeholder="0.00" />
            </div>
            {tab === "withdraw" && (
              <div className="form-group">
                <label className="form-label">Destination Address</label>
                <input className="form-input" placeholder="0x... or bc1..." />
              </div>
            )}
            <button className="btn btn-primary" style={{ width: "100%" }}>
              {tab === "deposit" ? "Simulate Deposit" : "Simulate Withdrawal"}
            </button>
          </div>
        )}

        {tab === "history" && (
          <div className="empty">No transactions yet.</div>
        )}
      </div>
    </div>
  );
}

// ─── AI AGENT PAGE ────────────────────────────────────────────────────────────

export default WalletPage;
