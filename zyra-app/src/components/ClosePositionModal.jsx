import { fmtMoney } from "../utils/formatters.js";
import Icon from "./Icon.jsx";

function ClosePositionModal({ position, currentPrice, onClose, onConfirm }) {
  const pnl = position.side === "BUY"
    ? (currentPrice - position.entryPrice) * position.sizeNum
    : (position.entryPrice - currentPrice) * position.sizeNum;
  const pnlPct = ((pnl / (position.entryPrice * position.sizeNum)) * 100).toFixed(2);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <button className="modal-close" onClick={onClose}><Icon name="close" size={14} /></button>
        <div className="modal-title">Close Position</div>
        <div style={{ background: "var(--bg3)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span className="muted" style={{ fontSize: 12 }}>Pair</span>
            <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{position.pair}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span className="muted" style={{ fontSize: 12 }}>Entry Price</span>
            <span style={{ fontFamily: "var(--mono)" }}>{fmtMoney(position.entryPrice, 3)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span className="muted" style={{ fontSize: 12 }}>Exit Price</span>
            <span style={{ fontFamily: "var(--mono)", color: "var(--cyan)" }}>{fmtMoney(currentPrice, 3)}</span>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted" style={{ fontSize: 12 }}>Realized P&L</span>
            <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 16, color: pnl >= 0 ? "var(--green)" : "var(--red)" }}>
              {pnl >= 0 ? "+" : ""}{fmtMoney(pnl)} ({pnlPct}%)
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn" style={{ flex: 1, background: pnl >= 0 ? "var(--green)" : "var(--red)", color: "var(--bg)", fontWeight: 700 }} onClick={() => onConfirm(pnl, currentPrice)}>
            Confirm Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ──────────────────────────────────────────────────────────

export default ClosePositionModal;
