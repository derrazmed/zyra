import Icon from "../components/Icon.jsx";
import { NavLink } from "react-router-dom";

export default function Sidebar({ navItems }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--cyan)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "var(--bg)", fontSize: 16 }}>Z</div>
          <div>
            <div className="logo-title">Zyra</div>
            <div className="logo-sub">Smart trading</div>
          </div>
        </div>
      </div>

      {navItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          <span className="nav-icon"><Icon name={item.icon} size={14} /></span>
          <span>{item.label}</span>
          {item.beta && <span style={{ background: "rgba(59,130,246,.2)", color: "var(--blue)", fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.5 }}>BETA</span>}
          {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <div className="env-badge">
          <div className="env-dot" />
          Environment <strong style={{ marginLeft: "auto" }}>TESTNET</strong>
        </div>
      </div>
    </aside>
  );
}
