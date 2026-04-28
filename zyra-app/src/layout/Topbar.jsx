import Icon from "../components/Icon.jsx";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="tb-search">
        <Icon name="search" size={12} />
        <input placeholder="Search assets, strategies, positions..." />
      </div>
      <div className="tb-mode">TESTNET</div>
      <div className="tb-trading">
        Trading:
        <div className="toggle" />
        <strong style={{ color: "var(--green)" }}>Active</strong>
      </div>
      <div className="tb-exchange">
        <div className="exch"><div className="exch-dot" style={{ background: "var(--green)" }} /><span>Binance</span></div>
        <div className="exch"><div className="exch-dot" style={{ background: "var(--cyan)" }} /><span>Uniswap</span></div>
      </div>
      <div className="avatar">AC</div>
    </header>
  );
}
