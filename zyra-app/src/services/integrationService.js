import api from "./api.js";

export async function saveBinanceConfig(data) {
  return await api.post("/integrations/binance", data);
}

export async function validateBinanceConfig(data) {
  return await api.post("/integrations/binance/validate", data);
}

export async function getBinanceConfig() {
  return await api.get("/integrations/binance");
}
