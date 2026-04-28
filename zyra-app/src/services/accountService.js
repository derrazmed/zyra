import api from "./api.js";

export async function getAccountInfo() {
  return await api.get("/account/info");
}

export async function getBalance() {
  return await api.get("/account/balance");
}

export async function getOpenOrders(symbol) {
  return await api.get("/account/open-orders", {
    params: { symbol },
  });
}
