import { useState } from "react";

import { SYMBOLS } from "../constants/symbols.js";
import { fmtMoney } from "../utils/formatters.js";
import Icon from "./Icon.jsx";

function OpenTradeModal({ prices, onClose, onSubmitOrder, submitting }) {
  const [form, setForm] = useState({
    pair: "BTCUSDT",
    side: "BUY",
    orderType: "MARKET",
    size: "",
    limitPrice: "",
  });
  const [submitError, setSubmitError] = useState("");
  const marketPrice = prices[form.pair] || 0;
  const sizeNum = Number.parseFloat(form.size) || 0;
  const limitPriceNum = Number.parseFloat(form.limitPrice) || 0;
  const effectivePrice = form.orderType === "LIMIT" ? limitPriceNum : marketPrice;
  const notional = sizeNum * effectivePrice;

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function submit() {
    if (!sizeNum || sizeNum <= 0) {
      setSubmitError("Quantity must be greater than zero.");
      return;
    }

    if (form.orderType === "LIMIT" && (!limitPriceNum || limitPriceNum <= 0)) {
      setSubmitError("Limit price must be greater than zero.");
      return;
    }

    setSubmitError("");

    try {
      await onSubmitOrder({
        orderType: form.orderType,
        payload: {
          symbol: form.pair,
          side: form.side,
          quantity: sizeNum,
          ...(form.orderType === "LIMIT" ? { price: limitPriceNum } : {}),
        },
      });
    } catch (error) {
      setSubmitError(error.message);
    }
  }

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}><Icon name="close" size={14} /></button>
        <div className="modal-title">
          <span style={{ color: "var(--cyan)" }}>+</span> Place Order
        </div>

        <div className="tabs" style={{ marginBottom: 14 }}>
          {["MARKET", "LIMIT"].map((type) => (
            <div key={type} className={`tab ${form.orderType === type ? "active" : ""}`} onClick={() => setField("orderType", type)}>
              {type}
            </div>
          ))}
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Pair</label>
            <select className="form-select" value={form.pair} onChange={(event) => setField("pair", event.target.value)}>
              {SYMBOLS.map((pair) => <option key={pair}>{pair}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Side</label>
            <select className="form-select" value={form.side} onChange={(event) => setField("side", event.target.value)}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
        </div>

        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text2)" }}>Current Market Price</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: "var(--cyan)" }}>
            {fmtMoney(marketPrice || 0, marketPrice > 1 ? 2 : 4)}
          </span>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Quantity</label>
            <input className="form-input" type="number" step="any" placeholder="0.00" value={form.size} onChange={(event) => setField("size", event.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{form.orderType === "LIMIT" ? "Limit Price" : "Estimated Price"}</label>
            <input
              className="form-input"
              type="number"
              step="any"
              placeholder={form.orderType === "LIMIT" ? "Enter limit price" : "Uses market price"}
              value={form.orderType === "LIMIT" ? form.limitPrice : marketPrice || ""}
              onChange={(event) => setField("limitPrice", event.target.value)}
              disabled={form.orderType !== "LIMIT"}
            />
          </div>
        </div>

        {sizeNum > 0 && (
          <div style={{ background: "rgba(0,229,212,.06)", border: "1px solid rgba(0,229,212,.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span className="muted">Estimated Notional</span>
              <span style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>{fmtMoney(notional || 0)}</span>
            </div>
          </div>
        )}

        {submitError && (
          <div style={{ marginBottom: 14, color: "var(--red)", fontSize: 12 }}>
            {submitError}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex: 1, background: form.side === "BUY" ? "var(--cyan)" : "var(--red)", color: "var(--bg)" }}
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : `${form.orderType} ${form.side}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OpenTradeModal;
