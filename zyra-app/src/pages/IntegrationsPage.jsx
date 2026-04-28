import { useEffect, useState } from "react";

import {
  getBinanceConfig,
  saveBinanceConfig,
  validateBinanceConfig,
} from "../services/integrationService.js";

function getErrorMessage(error, fallbackMessage) {
  return error?.message || fallbackMessage;
}

function normalizeBinanceConfig(payload) {
  const source = payload?.data && typeof payload.data === "object"
    ? payload.data
    : payload && typeof payload === "object"
      ? payload
      : {};

  return {
    apiKey: typeof source.apiKey === "string" ? source.apiKey : "",
    label: typeof source.label === "string" && source.label.trim() ? source.label : "Production",
    readOnly: Boolean(source.readOnly),
    configured: Boolean(source.configured ?? source.apiKey),
  };
}

function IntegrationsPage() {
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [label, setLabel] = useState("Production");
  const [readOnly, setReadOnly] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationResult, setValidationResult] = useState("");
  const [activeAction, setActiveAction] = useState("");

  const cexExchanges = [
    { name: "Binance Spot", id: "binance", color: "#F3BA2F", main: true },
    { name: "Bybit", id: "bybit", color: "#FFBF00" },
    { name: "Kraken", id: "kraken", color: "#5741D9" },
    { name: "OKX", id: "okx", color: "#FF6C0A" },
    { name: "Crypto.com", id: "cdc", color: "#002D74" },
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      setLoading(true);
      setActiveAction("load");
      setError("");

      try {
        const response = await getBinanceConfig();

        if (cancelled) {
          return;
        }

        const config = normalizeBinanceConfig(response);
        setApiKey(config.apiKey);
        setLabel(config.label);
        setReadOnly(config.readOnly);
        setConfigured(config.configured);
      } catch (loadError) {
        if (cancelled || loadError?.status === 404) {
          return;
        }

        setError(getErrorMessage(loadError, "Unable to load Binance configuration."));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setActiveAction("");
        }
      }
    }

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  function buildPayload() {
    return {
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
      label: label.trim() || "Production",
      readOnly,
    };
  }

  async function handleValidate() {
    const payload = buildPayload();

    if (!payload.apiKey || !payload.secretKey) {
      setValidationResult("Invalid API Key");
      setSuccess("");
      setError("API key and secret key are required for validation.");
      return;
    }

    setLoading(true);
    setActiveAction("validate");
    setError("");
    setSuccess("");
    setValidationResult("");

    try {
      await validateBinanceConfig(payload);
      setValidationResult("Valid API Key");
    } catch (validationError) {
      setValidationResult("Invalid API Key");
      setError(getErrorMessage(validationError, "Unable to validate Binance API key."));
    } finally {
      setLoading(false);
      setActiveAction("");
    }
  }

  async function handleSave() {
    const payload = buildPayload();

    if (!payload.apiKey || !payload.secretKey) {
      setSuccess("");
      setValidationResult("");
      setError("API key and secret key are required.");
      return;
    }

    setLoading(true);
    setActiveAction("save");
    setError("");
    setSuccess("");
    setValidationResult("");

    try {
      await saveBinanceConfig(payload);
      setConfigured(true);
      setSecretKey("");
      setSuccess("Configuration saved successfully.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Unable to save Binance configuration."));
    } finally {
      setLoading(false);
      setActiveAction("");
    }
  }

  const feedbackMessage = validationResult
    ? `${validationResult}${error && validationResult === "Invalid API Key" ? ` - ${error}` : ""}`
    : success || error;
  const feedbackColor = error || validationResult === "Invalid API Key"
    ? "var(--red)"
    : "var(--text2)";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Integrations</h1>
        <p className="page-sub">Connect exchanges and manage API credentials</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 16 }}>🔗</span>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Centralized Exchanges (CEX)</h2>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: "#F3BA2F22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>B</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Binance Spot</div>
            <div style={{ fontSize: 12, color: configured ? "var(--green)" : "var(--text3)" }}>
              {configured ? "✓ Configured (TESTNET)" : "⊙ Non configuré"}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">API Key</label>
          <input className="form-input" placeholder="Enter your Binance API key" value={apiKey} onChange={(event) => setApiKey(event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Secret Key</label>
          <div style={{ position: "relative" }}>
            <input className="form-input" type={showSecret ? "text" : "password"} placeholder="Enter your Binance secret key" value={secretKey} onChange={(event) => setSecretKey(event.target.value)} />
            <button onClick={() => setShowSecret((previous) => !previous)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 12 }}>
              {showSecret ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Label</label>
          <input className="form-input" value={label} onChange={(event) => setLabel(event.target.value)} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <input type="checkbox" id="readonly" checked={readOnly} onChange={(event) => setReadOnly(event.target.checked)} />
          <label htmlFor="readonly" style={{ fontSize: 13, color: "var(--text2)", cursor: "pointer" }}>Read & Trade only (no withdrawal permissions)</label>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={handleValidate} disabled={loading}>
            {activeAction === "validate" ? "Validating..." : "⊙ Validate"}
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {activeAction === "save" ? "Saving..." : "Save Configuration"}
          </button>
        </div>
        {feedbackMessage ? (
          <div style={{ marginTop: 10, fontSize: 12, color: feedbackColor }}>
            {feedbackMessage}
          </div>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {cexExchanges.slice(1).map((exchange) => (
          <div key={exchange.id} className="card" style={{ textAlign: "center", cursor: "pointer", transition: "border .15s" }} onMouseOver={(event) => { event.currentTarget.style.borderColor = "var(--border2)"; }} onMouseOut={(event) => { event.currentTarget.style.borderColor = "var(--border)"; }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: exchange.color + "22", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: exchange.color, fontWeight: 700 }}>
              {exchange.name.slice(0, 1)}
            </div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{exchange.name}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Not configured</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IntegrationsPage;
