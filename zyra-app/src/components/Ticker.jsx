import { SYMBOLS } from "../constants/symbols.js";

function Ticker({ prices, changes }) {
  return (
    <div className="ticker">
      {SYMBOLS.map(pair => {
        const sym = pair.replace("USDT", "");
        const p = prices[pair];
        const cls = changes[pair] === "up" ? "green" : changes[pair] === "down" ? "red" : "";
        return (
          <div key={pair} className="tick-item">
            <span style={{ color: "var(--text3)" }}>{sym}</span>
            <span className={cls} style={{ fontWeight: 600 }}>
              {typeof p === "number" ? (p < 1 ? p.toFixed(4) : p.toFixed(2)) : "--"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default Ticker;
