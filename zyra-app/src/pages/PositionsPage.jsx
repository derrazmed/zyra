import { useState } from "react";

import Icon from "../components/Icon.jsx";
import { fmtMoney } from "../utils/formatters.js";

function PositionsPage({ openOrders, tradeLog, prices, openModal, onCancelOrder, onRefresh, loading, error }) {
  const [tab, setTab] = useState("open");
  const rows = tab === "history" ? tradeLog : openOrders;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Positions</h1>
          <p className="page-sub">Open orders and trade activity from the connected backend</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}><Icon name="plus" size={13} /> New Order</button>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Order Management</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onRefresh}><Icon name="refresh" size={12} /> Refresh</button>
          </div>
        </div>

        <div className="tabs">
          <div className={`tab ${tab === "open" ? "active" : ""}`} onClick={() => setTab("open")}>
            Open Orders <span className="tab-num">{openOrders.length}</span>
          </div>
          <div className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
            Trade Log <span className="tab-num">{tradeLog.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="empty">Loading order data...</div>
        ) : error ? (
          <div className="empty" style={{ color: "var(--red)" }}>{error}</div>
        ) : rows.length === 0 ? (
          <div className="empty">
            {tab === "open" ? <>No open orders. <span className="cyan" style={{ cursor: "pointer" }} onClick={openModal}>Place one {"->"}</span></> : "No trades recorded yet."}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Pair</th>
                <th>Side</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Order Price</th>
                <th>Market Price</th>
                <th>Time</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const currentPrice = prices[row.symbol] || row.price || 0;
                return (
                  <tr key={row.id}>
                    <td><span className={`badge ${tab === "open" ? "badge-open" : "badge-closed"}`}>{row.status}</span></td>
                    <td className="pos-symbol">{row.symbol}</td>
                    <td><span className={`badge badge-${row.side.toLowerCase()}`}>{row.side}</span></td>
                    <td>{row.type}</td>
                    <td className="pos-size">{row.quantity}</td>
                    <td className="pos-price">{fmtMoney(row.price || currentPrice, 3)}</td>
                    <td className="pos-price" style={{ color: "var(--cyan)" }}>{fmtMoney(currentPrice, 3)}</td>
                    <td style={{ fontSize: 12, color: "var(--text3)" }}>{new Date(row.time).toLocaleString()}</td>
                    <td>
                      {tab === "open" && (
                        <button className="btn btn-danger btn-sm" onClick={() => onCancelOrder(row)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PositionsPage;
