import api from "./api.js";
import { isSupportedAsset, normalizeSymbolKey, toMarketSymbol } from "../utils/symbolMapping.js";

const PRICE_CACHE_TTL_MS = 8000;
const priceCache = new Map();
const inFlightPriceRequests = new Map();
const invalidSymbols = new Set();

function extractPrice(payload) {
  const price = payload?.price ?? payload?.lastPrice ?? payload?.close ?? payload?.data?.price;
  const parsedPrice = Number.parseFloat(price);

  return Number.isFinite(parsedPrice) ? parsedPrice : 0;
}

function isInvalidSymbolError(error) {
  return error?.code === -1121 || error?.status === 400 && String(error?.message || "").includes("-1121");
}

async function fetchPriceValue(marketSymbol, { forceRefresh = false } = {}) {
  if (!marketSymbol || invalidSymbols.has(marketSymbol)) {
    return null;
  }

  const cachedEntry = priceCache.get(marketSymbol);
  if (!forceRefresh && cachedEntry && Date.now() - cachedEntry.timestamp < PRICE_CACHE_TTL_MS) {
    return cachedEntry.price;
  }

  if (inFlightPriceRequests.has(marketSymbol)) {
    return inFlightPriceRequests.get(marketSymbol);
  }

  const request = api
    .get("/market/price", {
      params: { symbol: marketSymbol },
    })
    .then((payload) => {
      const price = extractPrice(payload);
      priceCache.set(marketSymbol, {
        price,
        timestamp: Date.now(),
      });

      return price;
    })
    .catch((error) => {
      if (isInvalidSymbolError(error)) {
        invalidSymbols.add(marketSymbol);
        return null;
      }

      throw error;
    })
    .finally(() => {
      inFlightPriceRequests.delete(marketSymbol);
    });

  inFlightPriceRequests.set(marketSymbol, request);

  return request;
}

async function getPrice(symbol, options = {}) {
  const requestedSymbol = normalizeSymbolKey(symbol);
  const marketSymbol = toMarketSymbol(requestedSymbol);
  const price = await fetchPriceValue(marketSymbol, options);

  if (price === null) {
    return null;
  }

  return {
    symbol: requestedSymbol,
    marketSymbol,
    price,
  };
}

async function getPrices(symbols, options = {}) {
  const uniqueSymbols = [...new Set(symbols.map(normalizeSymbolKey).filter(Boolean))]
    .filter((symbol) => isSupportedAsset(symbol));
  const settledResults = await Promise.allSettled(
    uniqueSymbols.map(async (symbol) => ({
      symbol,
      result: await getPrice(symbol, options),
    })),
  );

  return settledResults.reduce((priceMap, settledResult) => {
    if (settledResult.status === "rejected") {
      return priceMap;
    }

    const { symbol, result } = settledResult.value;
    if (result && typeof result.price === "number") {
      priceMap[symbol] = result.price;
    }

    return priceMap;
  }, {});
}

async function getDepth(symbol, limit = 10) {
  return await api.get("/market/depth", {
    params: {
      symbol: toMarketSymbol(symbol),
      limit,
    },
  });
}

async function getTrades(limit = 10) {
  return await api.get("/market/trades", {
    params: { limit },
  });
}

export { getDepth, getPrice, getPrices, getTrades };
