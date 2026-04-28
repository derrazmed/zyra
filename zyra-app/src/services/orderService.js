import api from "./api.js";

export async function placeMarketOrder(data) {
  return await api.post("/order/market", data);
}

export async function placeLimitOrder(data) {
  return await api.post("/order/limit", data);
}

export async function cancelOrder(orderId, symbol) {
  return await api.delete(`/order/${orderId}`, {
    params: { symbol },
  });
}

export async function getTradeLog() {
  return await api.get("/order/trade-log");
}

export async function getOrderStatus(symbol, orderId) {
  return await api.get("/order/status", {
    params: { symbol, orderId },
  });
}
