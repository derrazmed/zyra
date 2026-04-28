import { useEffect, useRef, useState } from "react";

import { getDepth, getTrades } from "../services/marketService.js";
import { toMiniTickerStream } from "../services/streamService.js";
import useMultiStream from "./useMultiStream.js";
import { limitItems, normalizeTimestamp, pickFirst, toArray, toNumber, toObject } from "../utils/apiTransforms.js";
import { filterSupportedAssets, normalizeSymbolKey } from "../utils/symbolMapping.js";

const MAX_MARKET_STREAMS = 20;

function normalizeDepth(payload, limit) {
  const source = toObject(payload);
  const bids = Array.isArray(source.bids) ? source.bids : [];
  const asks = Array.isArray(source.asks) ? source.asks : [];

  return {
    bids: limitItems(
      bids.map((entry) => ({
        price: toNumber(Array.isArray(entry) ? entry[0] : entry?.price, 0),
        quantity: toNumber(Array.isArray(entry) ? entry[1] : entry?.quantity, 0),
      })),
      limit,
    ),
    asks: limitItems(
      asks.map((entry) => ({
        price: toNumber(Array.isArray(entry) ? entry[0] : entry?.price, 0),
        quantity: toNumber(Array.isArray(entry) ? entry[1] : entry?.quantity, 0),
      })),
      limit,
    ),
  };
}

function normalizeTrades(payload, limit) {
  return limitItems(
    toArray(payload, ["trades", "items", "history"]).map((trade, index) => ({
      id: String(pickFirst(trade, ["id", "tradeId"], `trade-${pickFirst(trade, ["symbol"], "market")}-${index}`)),
      symbol: pickFirst(trade, ["symbol"], "MARKET"),
      side: pickFirst(trade, ["side"], "BUY"),
      price: toNumber(pickFirst(trade, ["price"]), 0),
      quantity: toNumber(pickFirst(trade, ["qty", "quantity"]), 0),
      time: normalizeTimestamp(pickFirst(trade, ["time", "transactTime"])),
    })),
    limit,
  );
}

function buildChanges(previousPrices, nextPrices) {
  const nextChanges = {};

  Object.entries(nextPrices).forEach(([symbol, price]) => {
    if (previousPrices[symbol] === undefined) {
      nextChanges[symbol] = "";
      return;
    }

    if (price > previousPrices[symbol]) {
      nextChanges[symbol] = "up";
    } else if (price < previousPrices[symbol]) {
      nextChanges[symbol] = "down";
    } else {
      nextChanges[symbol] = "";
    }
  });

  return nextChanges;
}

function useMarket({
  symbols = ["BTCUSDT", "ETHUSDT"],
  depthSymbol = "BTCUSDT",
  depthLimit = 10,
  tradesLimit = 10,
  autoRefreshMs = 1000,
} = {}) {
  const [prices, setPrices] = useState({});
  const [changes, setChanges] = useState({});
  const [depth, setDepth] = useState({ bids: [], asks: [] });
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedRef = useRef(false);
  const normalizedSymbols = [...new Set(filterSupportedAssets(symbols.map(normalizeSymbolKey).filter(Boolean)))]
    .slice(0, MAX_MARKET_STREAMS);
  const streamList = normalizedSymbols
    .map((symbol) => toMiniTickerStream(symbol))
    .filter(Boolean);
  const symbolsKey = normalizedSymbols.join(",");

  useEffect(() => {
    console.log("SYMBOLS USED:", normalizedSymbols);
  }, [symbolsKey]);

  const streamData = useMultiStream({
    streams: streamList,
    refreshMs: autoRefreshMs,
  });

  useEffect(() => {
    const trackedSymbols = new Set(normalizedSymbols);
    const streamPrices = Object.entries(streamData.prices)
      .filter(([symbol, price]) => trackedSymbols.has(symbol) && typeof price === "number" && price > 0)
      .reduce((priceMap, [symbol, price]) => {
        priceMap[symbol] = price;
        return priceMap;
      }, {});

    if (Object.keys(streamPrices).length === 0) {
      return;
    }

    setPrices((previousPrices) => {
      setChanges((previousChanges) => ({
        ...previousChanges,
        ...buildChanges(previousPrices, streamPrices),
      }));

      return {
        ...previousPrices,
        ...streamPrices,
      };
    });
  }, [streamData.prices, symbolsKey]);

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    async function loadMarket() {
      if (!hasLoadedRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        const [depthResult, tradesResult] = await Promise.allSettled([
          depthSymbol ? getDepth(depthSymbol, depthLimit) : Promise.resolve(null),
          getTrades(Math.min(tradesLimit, 20)),
        ]);

        if (cancelled) {
          return;
        }

        if (depthResult.status === "fulfilled") {
          setDepth(depthResult.value ? normalizeDepth(depthResult.value, depthLimit) : { bids: [], asks: [] });
        }

        if (tradesResult.status === "fulfilled") {
          setTrades(normalizeTrades(tradesResult.value, Math.min(tradesLimit, 20)));
        }

        const failedMessages = [depthResult, tradesResult]
          .filter((result) => result.status === "rejected")
          .map((result) => result.reason?.message)
          .filter(Boolean);

        if (failedMessages.length > 0) {
          setError(failedMessages[0]);
        }

        hasLoadedRef.current = true;
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadMarket();

    if (autoRefreshMs > 0) {
      intervalId = setInterval(() => {
        loadMarket();
      }, autoRefreshMs);
    }

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefreshMs, depthLimit, depthSymbol, refreshKey, symbolsKey, tradesLimit]);

  return {
    prices,
    changes,
    depth,
    trades,
    loading: loading || streamData.loading,
    refreshing: refreshing || streamData.refreshing,
    error: error || streamData.error,
    refresh: () => {
      setRefreshKey((current) => current + 1);
      streamData.refresh();
    },
  };
}

export default useMarket;
