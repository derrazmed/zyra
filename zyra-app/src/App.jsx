import { useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import OpenTradeModal from "./components/OpenTradeModal.jsx";
import Ticker from "./components/Ticker.jsx";
import ToastContainer from "./components/ToastContainer.jsx";
import { SYMBOLS } from "./constants/symbols.js";
import useAccount from "./hooks/useAccount.js";
import useMarket from "./hooks/useMarket.js";
import useOrders from "./hooks/useOrders.js";
import useToast from "./hooks/useToast.js";
import Sidebar from "./layout/Sidebar.jsx";
import Topbar from "./layout/Topbar.jsx";

const INITIAL_NOTIFICATIONS = [
  { id: 1, type: "SYSTEM", title: "Backend Connected", message: "API base URL configured for http://localhost:8080/api.", time: "Just now", isRead: false },
];

const PAGE_MODULES = import.meta.glob("./pages/*Page.jsx", { eager: true });

const PAGE_METADATA = {
  agent: { icon: "agent", label: "Agent", nav: false, navOrder: 90 },
  dashboard: { icon: "dashboard", label: "Dashboard", nav: true, navOrder: 10 },
  dex: { beta: true, icon: "dex", label: "DEX Trading", nav: true, navOrder: 50 },
  help: { icon: "help", label: "Help", nav: true, navOrder: 90 },
  integrations: { icon: "integrations", label: "Integrations", nav: true, navOrder: 40 },
  logs: { icon: "logs", label: "Logs & Audit", nav: true, navOrder: 70 },
  notifications: { icon: "notifications", label: "Notifications", nav: true, navOrder: 60 },
  positions: { icon: "positions", label: "Positions", nav: true, navOrder: 20 },
  settings: { icon: "settings", label: "Settings", nav: true, navOrder: 80 },
  strategies: { icon: "strategies", label: "Strategies", nav: true, navOrder: 30 },
  wallet: { icon: "wallet", label: "Wallet", nav: false, navOrder: 85 },
};

function formatPageLabel(pageName) {
  return pageName.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function getPageName(filePath) {
  return filePath.split("/").pop()?.replace(".jsx", "") || "";
}

function toRouteKey(pageName) {
  return pageName.replace(/Page$/, "").toLowerCase();
}

const PAGE_DEFINITIONS = Object.entries(PAGE_MODULES)
  .map(([filePath, module]) => {
    const pageName = getPageName(filePath);
    const routeKey = toRouteKey(pageName);
    const displayName = pageName.replace(/Page$/, "");
    const metadata = PAGE_METADATA[routeKey] || {};

    return {
      badge: metadata.badge || null,
      beta: Boolean(metadata.beta),
      Component: module.default,
      icon: metadata.icon || routeKey,
      label: metadata.label || formatPageLabel(displayName),
      nav: Boolean(metadata.nav),
      navOrder: metadata.navOrder ?? Number.MAX_SAFE_INTEGER,
      routeKey,
      routePath: `/${routeKey}`,
    };
  })
  .sort((left, right) => (
    left.navOrder - right.navOrder ||
    left.routeKey.localeCompare(right.routeKey)
  ));

const PAGE_PROP_FACTORIES = {
  agent: ({ handleAgentOrder, openOrders, prices, toast }) => ({
    onOpenPosition: handleAgentOrder,
    positions: openOrders,
    prices,
    toast,
  }),
  dashboard: ({
    accountError,
    accountLoading,
    balances,
    fiatBalances,
    marketError,
    marketLoading,
    openOrders,
    openTradeModal,
    ordersError,
    ordersLoading,
    portfolioValue,
    prices,
    tradeLog,
  }) => ({
    accountError,
    accountLoading,
    balances,
    fiatBalances,
    marketError,
    marketLoading,
    openModal: openTradeModal,
    openOrders,
    ordersError,
    ordersLoading,
    portfolioValue,
    prices,
    tradeLog,
  }),
  integrations: () => ({}),
  logs: ({ openOrders, tradeLog }) => ({
    closedTrades: tradeLog,
    positions: openOrders,
  }),
  notifications: ({ markNotificationRead, notifications }) => ({
    notifications,
    onRead: markNotificationRead,
  }),
  positions: ({
    handleCancelOrder,
    openOrders,
    openTradeModal,
    ordersError,
    ordersLoading,
    prices,
    refreshOrders,
    tradeLog,
  }) => ({
    error: ordersError,
    loading: ordersLoading,
    onCancelOrder: handleCancelOrder,
    onRefresh: refreshOrders,
    openModal: openTradeModal,
    openOrders,
    prices,
    tradeLog,
  }),
  settings: ({ toast }) => ({ toast }),
  strategies: ({ toast }) => ({ toast }),
  wallet: ({ prices }) => ({ prices }),
};

function getPageProps(routeKey, context) {
  return PAGE_PROP_FACTORIES[routeKey]?.(context) || {};
}

function AppLayout({ changes, navItems, prices }) {
  return (
    <div className="app">
      <Sidebar navItems={navItems} />

      <main className="main">
        <Topbar />
        <Ticker prices={prices} changes={changes} />

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const {
    balances,
    fiatBalances,
    portfolioValue,
    loading: accountLoading,
    error: accountError,
    refresh: refreshAccount,
  } = useAccount({ maxBalances: 10 });
  const { prices, changes, loading: marketLoading, error: marketError, refresh: refreshMarket } = useMarket({
    symbols: SYMBOLS,
    depthSymbol: "BTCUSDT",
    depthLimit: 10,
    tradesLimit: 10,
    autoRefreshMs: 8000,
  });
  const {
    openOrders,
    tradeLog,
    loading: ordersLoading,
    actionLoading,
    error: ordersError,
    refresh: refreshOrders,
    placeMarketOrder,
    placeLimitOrder,
    cancelOrder,
  } = useOrders({
    symbols: SYMBOLS,
    openOrdersLimit: 20,
    tradeLogLimit: 20,
  });
  const { toasts, add: toast } = useToast();

  async function handleSubmitOrder({ orderType, payload }) {
    const response = orderType === "LIMIT"
      ? await placeLimitOrder(payload)
      : await placeMarketOrder(payload);

    toast(`${payload.side} ${payload.symbol} ${orderType.toLowerCase()} order submitted`, "success");
    setNotifications((current) => [{
      id: Date.now(),
      type: "TRADE",
      title: `${orderType} Order Submitted`,
      message: `${payload.side} ${payload.quantity} ${payload.symbol.replace("USDT", "")} order sent successfully.`,
      time: "Just now",
      isRead: false,
    }, ...current]);
    refreshAccount();
    refreshMarket();

    return response;
  }

  async function handleCancelOrder(order) {
    await cancelOrder(order.orderId, order.symbol);
    toast(`Order ${order.orderId} cancelled`, "info");
    setNotifications((current) => [{
      id: Date.now(),
      type: "TRADE",
      title: "Order Cancelled",
      message: `${order.symbol} order ${order.orderId} cancelled.`,
      time: "Just now",
      isRead: false,
    }, ...current]);
  }

  async function handleAgentOrder(position) {
    await handleSubmitOrder({
      orderType: "MARKET",
      payload: {
        symbol: position.pair,
        side: position.side,
        quantity: position.sizeNum,
      },
    });
  }

  const markNotificationRead = (id) => {
    setNotifications((current) => current.map((notification) => (
      notification.id === id ? { ...notification, isRead: true } : notification
    )));
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const routeContext = {
    accountError,
    accountLoading,
    balances,
    fiatBalances,
    handleAgentOrder,
    handleCancelOrder,
    marketError,
    marketLoading,
    markNotificationRead,
    notifications,
    openOrders,
    openTradeModal: () => setShowOpenModal(true),
    ordersError,
    ordersLoading,
    portfolioValue,
    prices,
    refreshOrders,
    toast,
    tradeLog,
  };
  const navItems = PAGE_DEFINITIONS
    .filter((page) => page.nav)
    .map((page) => ({
      badge: page.routeKey === "notifications"
        ? unreadCount || null
        : page.routeKey === "positions"
          ? openOrders.length || null
          : null,
      beta: page.beta,
      icon: page.icon,
      id: page.routeKey,
      label: page.label,
      path: page.routePath,
    }));

  return (
    <>
      <Routes>
        <Route element={<AppLayout changes={changes} navItems={navItems} prices={prices} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          {PAGE_DEFINITIONS.map(({ Component, routeKey }) => (
            <Route
              key={routeKey}
              path={routeKey}
              element={<Component {...getPageProps(routeKey, routeContext)} />}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {showOpenModal && (
        <OpenTradeModal
          prices={prices}
          onClose={() => setShowOpenModal(false)}
          onSubmitOrder={async (orderRequest) => {
            await handleSubmitOrder(orderRequest);
            setShowOpenModal(false);
          }}
          submitting={actionLoading}
        />
      )}

      <ToastContainer toasts={toasts} />
    </>
  );
}
