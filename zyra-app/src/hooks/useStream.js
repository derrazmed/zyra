import { useEffect, useRef, useState } from "react";

import { getPrice } from "../services/marketService.js";
import {
  getLatest,
  subscribe as subscribeToStream,
  unsubscribe as unsubscribeFromStream,
} from "../services/streamService.js";
import { normalizeTimestamp, pickFirst, toNumber, toObject } from "../utils/apiTransforms.js";

function normalizeLatest(payload, stream) {
  const source = toObject(payload);
  const value = pickFirst(source, ["value", "payload", "data"], source);
  const nestedValue = toObject(value);

  return {
    stream: pickFirst(source, ["stream"], stream),
    value,
    price: toNumber(
      pickFirst(nestedValue, ["c", "close", "price", "lastPrice"], pickFirst(source, ["c", "close", "price", "lastPrice"], 0)),
      0,
    ),
    time: normalizeTimestamp(
      pickFirst(nestedValue, ["E", "eventTime", "time", "timestamp"], pickFirst(source, ["E", "eventTime", "time", "timestamp"])),
    ),
    source: "stream",
  };
}

function normalizeFallbackPrice(payload, stream) {
  return {
    stream,
    value: payload,
    price: toNumber(payload?.price, 0),
    time: new Date().toISOString(),
    source: "rest",
  };
}

function useStream({ stream = "", fallbackSymbol = "", refreshMs = 1000 } = {}) {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(Boolean(stream));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(stream ? "subscribing" : "idle");
  const hasLoadedRef = useRef(false);
  const subscribedStreamRef = useRef("");
  const subscriptionAttemptRef = useRef("");
  const subscriptionPromiseRef = useRef(null);
  const subscriptionStatusRef = useRef(stream ? "subscribing" : "idle");
  const subscriptionStatusStreamRef = useRef(stream);

  useEffect(() => {
    hasLoadedRef.current = false;
    setLatest(null);
    setError(null);
    setRefreshing(false);
    setLoading(Boolean(stream || fallbackSymbol));
  }, [stream, fallbackSymbol]);

  useEffect(() => {
    let cancelled = false;

    async function setupSubscription() {
      if (!stream) {
        subscriptionStatusRef.current = "idle";
        subscriptionStatusStreamRef.current = "";
        setIsSubscribed(false);
        setSubscriptionStatus("idle");
        return;
      }

      if (subscribedStreamRef.current === stream) {
        subscriptionStatusRef.current = "subscribed";
        subscriptionStatusStreamRef.current = stream;
        setIsSubscribed(true);
        setSubscriptionStatus("subscribed");
        return;
      }

      setIsSubscribed(false);
      subscriptionStatusRef.current = "subscribing";
      subscriptionStatusStreamRef.current = stream;
      setSubscriptionStatus("subscribing");

      try {
        if (subscriptionAttemptRef.current !== stream || !subscriptionPromiseRef.current) {
          subscriptionAttemptRef.current = stream;
          subscriptionPromiseRef.current = subscribeToStream(stream);
        }

        await subscriptionPromiseRef.current;

        if (cancelled) {
          return;
        }

        subscribedStreamRef.current = stream;
        subscriptionStatusRef.current = "subscribed";
        setIsSubscribed(true);
        setSubscriptionStatus("subscribed");
      } catch (subscriptionError) {
        if (!cancelled) {
          setError(subscriptionError.message);
          setIsSubscribed(false);
          subscriptionStatusRef.current = "failed";
          setSubscriptionStatus("failed");
        }
      } finally {
        if (subscriptionAttemptRef.current === stream) {
          subscriptionAttemptRef.current = "";
          subscriptionPromiseRef.current = null;
        }
      }
    }

    setupSubscription();

    return () => {
      cancelled = true;

      if (subscribedStreamRef.current === stream) {
        unsubscribeFromStream(stream).catch(() => {});
        subscribedStreamRef.current = "";
      }

      if (subscriptionAttemptRef.current === stream) {
        subscriptionAttemptRef.current = "";
        subscriptionPromiseRef.current = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    async function loadFallback() {
      if (!fallbackSymbol) {
        return;
      }

      try {
        const fallbackResponse = await getPrice(fallbackSymbol, { forceRefresh: true });

        if (cancelled || !fallbackResponse?.price) {
          return;
        }

        setLatest(normalizeFallbackPrice(fallbackResponse, stream));
        hasLoadedRef.current = true;
      } catch (fallbackError) {
        if (!cancelled) {
          setError(fallbackError.message);
        }
      }
    }

    async function loadStream() {
      if (!stream || !isSubscribed) {
        return;
      }

      try {
        const response = await getLatest(stream);

        if (cancelled) {
          return;
        }

        const normalized = normalizeLatest(response, stream);
        if (normalized.price > 0) {
          setLatest(normalized);
          hasLoadedRef.current = true;
          return;
        }

        throw new Error("Stream response did not include a valid price");
      } catch (streamError) {
        if (!cancelled) {
          setError(streamError.message);
        }

        await loadFallback();
      }
    }

    async function loadData() {
      const currentSubscriptionStatus = subscriptionStatusStreamRef.current === stream
        ? subscriptionStatusRef.current
        : stream ? "subscribing" : "idle";
      const isCurrentStreamSubscribed = isSubscribed && subscribedStreamRef.current === stream;

      if (!stream) {
        if (!fallbackSymbol) {
          setLatest(null);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      } else if (currentSubscriptionStatus === "subscribing") {
        return;
      }

      if (!hasLoadedRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        if (stream && isCurrentStreamSubscribed) {
          await loadStream();
          return;
        }

        await loadFallback();
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    const currentSubscriptionStatus = subscriptionStatusStreamRef.current === stream
      ? subscriptionStatusRef.current
      : stream ? "subscribing" : "idle";
    const shouldPollStream = Boolean(stream) && isSubscribed && subscribedStreamRef.current === stream;
    const shouldPollFallback = Boolean(fallbackSymbol) && (!stream || currentSubscriptionStatus === "failed");

    if (!shouldPollStream && !shouldPollFallback) {
      return () => {};
    }

    loadData();

    if (refreshMs > 0) {
      intervalId = setInterval(loadData, refreshMs);
    }

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fallbackSymbol, isSubscribed, refreshKey, refreshMs, stream, subscriptionStatus]);

  return {
    latest,
    price: latest?.price ?? null,
    loading,
    refreshing,
    error,
    refresh: () => setRefreshKey((current) => current + 1),
  };
}

export default useStream;
