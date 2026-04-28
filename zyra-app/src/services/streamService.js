import api from "./api.js";
import { normalizeSymbolKey, toMarketSymbol } from "../utils/symbolMapping.js";

export async function subscribe(stream) {
  return await api.post("/stream/subscribe", { stream });
}

export async function unsubscribe(stream) {
  return await api.delete("/stream/unsubscribe", {
    params: { stream },
  });
}

export async function getLatest(stream) {
  return await api.get("/stream/latest", {
    params: { stream },
  });
}

export async function getHistory(stream) {
  return await api.get("/stream/history", {
    params: { stream },
  });
}

export function toMiniTickerStream(symbol) {
  const marketSymbol = toMarketSymbol(symbol);

  return marketSymbol ? `${marketSymbol.toLowerCase()}@miniTicker` : "";
}

export function toStreamSymbol(stream) {
  if (!stream) {
    return "";
  }

  return normalizeSymbolKey(String(stream).split("@")[0]);
}
