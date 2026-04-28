import { useState } from "react";

function SettingsPage({ toast }) {
  const [tab, setTab] = useState("account");
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Manage your account and preferences</p>
      </div>
      <div className="tabs" style={{ maxWidth: 400 }}>
        {["account", "security", "preferences"].map(t => (
          <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</div>
        ))}
      </div>
      <div className="card" style={{ maxWidth: 480 }}>
        {tab === "account" && (
          <>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" defaultValue="user@zyra.app" />
            </div>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" placeholder="••••••••" />
            </div>
            <button className="btn btn-primary" onClick={() => toast("Settings saved", "success")}>Save Changes</button>
          </>
        )}
        {tab === "security" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Two-Factor Authentication</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Add an extra layer of security</div>
              </div>
              <button className="btn btn-green btn-sm" onClick={() => toast("2FA setup initiated — check your authenticator app", "info")}>Enable 2FA</button>
            </div>
            <div style={{ padding: "12px 0" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Active Sessions</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>Chrome · macOS · Casablanca, MA · Active now</div>
            </div>
          </>
        )}
        {tab === "preferences" && (
          <>
            <div className="form-group">
              <label className="form-label">Display Currency</label>
              <select className="form-select" defaultValue="USD">
                <option>USD</option><option>EUR</option><option>MAD</option><option>GBP</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Theme</label>
              <select className="form-select" defaultValue="DARK">
                <option>DARK</option><option>LIGHT</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <select className="form-select" defaultValue="en">
                <option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-select" defaultValue="Africa/Casablanca">
                <option>Africa/Casablanca</option><option>Europe/Paris</option><option>America/New_York</option><option>Asia/Dubai</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => toast("Preferences saved", "success")}>Save Preferences</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default SettingsPage;
