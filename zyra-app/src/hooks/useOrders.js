import { useEffect, useState } from "react";

import { SYMBOLS } from "../constants/symbols.js";
import { getOpenOrders } from "../services/accountService.js";
import {
  cancelOrder as cancelOrderRequest,
  getOrderStatus as getOrderStatusRequest,
  getTradeLog as getTradeLogRequest,
  placeLimitOrder as placeLimitOrderRequest,
  placeMarketOrder as placeMarketOrderRequest,
} from "../services/orderService.js";
import { limitItems, normalizeTimestamp, pickFirst, toArray, toNumber, toObject } from "../utils/apiTransforms.js";

function normalizeOpenOrders(payload, fallbackSymbol) {
  return toArray(payload, ["orders", "openOrders", "items"]).map((order, index) => ({
    id: String(pickFirst(order, ["orderId", "id"], `${fallbackSymbol}-${index}`)),
    orderId: String(pickFirst(order, ["orderId", "id"], `${fallbackSymbol}-${index}`)),
    symbol: pickFirst(order, ["symbol"], fallbackSymbol),
    side: pickFirst(order, ["side"], "BUY"),
    type: pickFirst(order, ["type"], "LIMIT"),
    status: pickFirst(order, ["status"], "OPEN"),
    price: toNumber(pickFirst(order, ["price", "avgPrice"]), 0),
    quantity: toNumber(pickFirst(order, ["origQty", "quantity", "qty"]), 0),
    executedQuantity: toNumber(pickFirst(order, ["executedQty", "filledQty"]), 0),
    time: normalizeTimestamp(pickFirst(order, ["time", "transactTime", "updateTime"])),
  }));
}

function normalizeTradeLog(payload) {
  return toArray(payload, ["trades", "history", "items"]).map((trade, index) => ({
    id: String(pickFirst(trade, ["orderId", "id", "tradeId"], `trade-${index}`)),
    symbol: pickFirst(trade, ["symbol"], "UNKNOWN"),
    side: pickFirst(trade, ["side"], "BUY"),
    type: pickFirst(trade, ["type"], "MARKET"),
    status: pickFirst(trade, ["status"], "FILLED"),
    price: toNumber(pickFirst(trade, ["price", "avgPrice"]), 0),
    quantity: toNumber(pickFirst(trade, ["origQty", "quantity", "qty"]), 0),
    executedQuantity: toNumber(pickFirst(trade, ["executedQty", "filledQty", "qty"]), 0),
    time: normalizeTimestamp(pickFirst(trade, ["time", "transactTime", "updateTime"])),
  }));
}

function normalizeOrderStatus(payload) {
  const order = toObject(payload);

  return {
    id: String(pickFirst(order, ["orderId", "id"], "")),
    symbol: pickFirst(order, ["symbol"], ""),
    side: pickFirst(order, ["side"], "BUY"),
    type: pickFirst(order, ["type"], "MARKET"),
    status: pickFirst(order, ["status"], "UNKNOWN"),
    price: toNumber(pickFirst(order, ["price", "avgPrice"]), 0),
    quantity: toNumber(pickFirst(order, ["origQty", "quantity", "qty"]), 0),
    executedQuantity: toNumber(pickFirst(order, ["executedQty", "filledQty"]), 0),
    time: normalizeTimestamp(pickFirst(order, ["time", "transactTime", "updateTime"])),
  };
}

function useOrders({
  symbols = SYMBOLS,
  openOrdersLimit = 20,
  tradeLogLimit = 20,
} = {}) {
  const [openOrders, setOpenOrders] = useState([]);
  const [tradeLog, setTradeLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const symbolsKey = symbols.join(",");

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setLoading(true);
      setError(null);

      try {
        const [openOrderResults, tradeLogResult] = await Promise.all([
          Promise.allSettled(symbols.map(async (symbol) => ({
            symbol,
            response: await getOpenOrders(symbol),
          }))),
          Promise.allSettled([getTradeLogRequest()]),
        ]);

        if (cancelled) {
          return;
        }

        const normalizedOrders = openOrderResults
          .flatMap((result) => {
            if (result.status !== "fulfilled") {
              return [];
            }

            return normalizeOpenOrders(result.value.response, result.value.symbol);
          })
          .sort((left, right) => new Date(right.time) - new Date(left.time));

        const tradeLogResponse = tradeLogResult[0]?.status === "fulfilled" ? tradeLogResult[0].value : [];
        const normalizedTradeLog = normalizeTradeLog(tradeLogResponse)
          .sort((left, right) => new Date(right.time) - new Date(left.time));

        setOpenOrders(limitItems(normalizedOrders, openOrdersLimit));
        setTradeLog(limitItems(normalizedTradeLog, tradeLogLimit));
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [openOrdersLimit, refreshKey, symbolsKey, tradeLogLimit, symbols]);

  async function placeMarketOrder(data) {
    setActionLoading(true);
    setError(null);

    try {
      const response = await placeMarketOrderRequest(data);
      setRefreshKey((current) => current + 1);
      return response;
    } catch (actionError) {
      setError(actionError.message);
      throw actionError;
    } finally {
      setActionLoading(false);
    }
  }

  async function placeLimitOrder(data) {
    setActionLoading(true);
    setError(null);

    try {
      const response = await placeLimitOrderRequest(data);
      setRefreshKey((current) => current + 1);
      return response;
    } catch (actionError) {
      setError(actionError.message);
      throw actionError;
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelOrder(orderId, symbol) {
    setActionLoading(true);
    setError(null);

    try {
      const response = await cancelOrderRequest(orderId, symbol);
      setRefreshKey((current) => current + 1);
      return response;
    } catch (actionError) {
      setError(actionError.message);
      throw actionError;
    } finally {
      setActionLoading(false);
    }
  }

  async function getOrderStatus(symbol, orderId) {
    setActionLoading(true);
    setError(null);

    try {
      const response = await getOrderStatusRequest(symbol, orderId);
      return normalizeOrderStatus(response);
    } catch (actionError) {
      setError(actionError.message);
      throw actionError;
    } finally {
      setActionLoading(false);
    }
  }

  return {
    openOrders,
    tradeLog,
    loading,
    actionLoading,
    error,
    refresh: () => setRefreshKey((current) => current + 1),
    placeMarketOrder,
    placeLimitOrder,
    cancelOrder,
    getOrderStatus,
  };
}

export default useOrders;
