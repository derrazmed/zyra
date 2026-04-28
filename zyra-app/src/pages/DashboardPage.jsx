import { fmtMoney } from "../utils/formatters.js";

function DashboardPage({
  balances,
  fiatBalances,
  portfolioValue,
  openOrders,
  tradeLog,
  prices,
  openModal,
  accountLoading,
  accountError,
  marketLoading,
  marketError,
  ordersLoading,
  ordersError,
}) {
  const featuredAssets = balances.slice(0, 5);
  const featuredFiatBalances = fiatBalances.slice(0, 4);
  const featuredPairs = ["BTCUSDT", "ETHUSDT"];
  const totalOpenNotional = openOrders.reduce((total, order) => total + (order.price * order.quantity), 0);
  const hasMarketPrices = featuredPairs.some((pair) => typeof prices[pair] === "number");

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Live account summary connected to your backend services</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text3)" }}>
          <span className="live-dot" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Portfolio Value</div>
          {accountLoading ? (
            <div className="empty" style={{ padding: 24 }}>Loading balances...</div>
          ) : accountError && balances.length === 0 ? (
            <div className="empty" style={{ padding: 24, color: "var(--red)" }}>{accountError}</div>
          ) : (
            <>
              <div className="stat-val">{fmtMoney(portfolioValue || 0)}</div>
              <div className="stat-sub" style={{ marginTop: 14 }}>
                <div className="stat-sub-item">
                  <label>CRYPTO</label>
                  <span>{balances.length}</span>
                </div>
                <div className="stat-sub-item">
                  <label>TOP HOLDING</label>
                  <span>{featuredAssets[0]?.asset || "--"}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-title">BTC / ETH Mini Ticker</div>
          {marketLoading && featuredPairs.some((pair) => typeof prices[pair] !== "number") ? (
            <div className="empty" style={{ padding: 24 }}>Loading prices...</div>
          ) : marketError && !hasMarketPrices ? (
            <div className="empty" style={{ padding: 24, color: "var(--red)" }}>{marketError}</div>
          ) : (
            featuredPairs.map((pair) => (
              <div key={pair} className="status-row" style={{ marginBottom: 14 }}>
                <span className="status-label">{pair.replace("USDT", "")}</span>
                <span className="status-val" style={{ color: "var(--cyan)", fontSize: 16 }}>
                  {typeof prices[pair] === "number" ? fmtMoney(prices[pair], 2) : "--"}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-title">Top Crypto Balances</div>
          {accountLoading ? (
            <div className="empty" style={{ padding: 24 }}>Loading assets...</div>
          ) : featuredAssets.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>No supported crypto balances found.</div>
          ) : (
            featuredAssets.map((balance) => (
              <div key={balance.asset} className="asset-row">
                <div className="asset-icon">{balance.asset.slice(0, 2)}</div>
                <div>
                  <div className="asset-name">{balance.asset}</div>
                  <div className="asset-sym">Free: {balance.free}</div>
                </div>
                <div className="asset-bal">
                  <div className="qty">{balance.total}</div>
                  <div className="val">{fmtMoney(balance.usdValue || 0)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {featuredFiatBalances.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Fiat / Stable Balances</div>
          {featuredFiatBalances.map((balance) => (
            <div key={balance.asset} className="asset-row">
              <div className="asset-icon">{balance.asset.slice(0, 2)}</div>
              <div>
                <div className="asset-name">{balance.asset}</div>
                <div className="asset-sym">Free: {balance.free}</div>
              </div>
              <div className="asset-bal">
                <div className="qty">{balance.total}</div>
                <div className="val">{fmtMoney(balance.total)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="card-title" style={{ margin: 0 }}>Open Orders</div>
            <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
              <div><span style={{ color: "var(--text3)" }}>COUNT </span><strong>{openOrders.length}</strong></div>
              <div><span style={{ color: "var(--text3)" }}>NOTIONAL </span><strong>{fmtMoney(totalOpenNotional)}</strong></div>
            </div>
          </div>
          {ordersLoading ? (
            <div className="empty">Loading open orders...</div>
          ) : ordersError ? (
            <div className="empty" style={{ color: "var(--red)" }}>{ordersError}</div>
          ) : openOrders.length === 0 ? (
            <div className="empty">No open orders. <span className="cyan" style={{ cursor: "pointer" }} onClick={openModal}>Place one {"->"}</span></div>
          ) : (
            openOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="activity-item">
                <div className="activity-icon" style={{ background: order.side === "BUY" ? "rgba(0,229,212,.1)" : "rgba(255,71,87,.1)", color: order.side === "BUY" ? "var(--cyan)" : "var(--red)" }}>
                  {order.symbol.replace("USDT", "").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{order.symbol.replace("USDT", "")} <span className={`badge badge-${order.side.toLowerCase()}`}>{order.side}</span></span>
                    <span className="muted" style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 13 }}>
                      {order.type}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>{order.quantity} @ {fmtMoney(order.price || prices[order.symbol] || 0, 3)}</span>
                    <span style={{ fontSize: 11 }} className="yellow">{order.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-title">Recent Trades</div>
          {ordersLoading ? (
            <div className="empty">Loading trade log...</div>
          ) : tradeLog.length === 0 ? (
            <div className="empty">No recent trades yet.</div>
          ) : (
            tradeLog.slice(0, 6).map((trade) => (
              <div key={trade.id} className="recent-trade">
                <div className="activity-icon" style={{ background: trade.side === "BUY" ? "rgba(0,229,212,.1)" : "rgba(255,71,87,.1)", color: trade.side === "BUY" ? "var(--cyan)" : "var(--red)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                  {trade.side}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{trade.quantity} · {trade.symbol.replace("USDT", "")}</span>
                    <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 13 }}>{fmtMoney(trade.price * trade.quantity)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>{new Date(trade.time).toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>{trade.type} · {trade.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
