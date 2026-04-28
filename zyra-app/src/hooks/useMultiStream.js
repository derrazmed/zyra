import { useEffect, useRef, useState } from "react";

import { getPrice } from "../services/marketService.js";
import {
  getLatest,
  subscribe as subscribeToStream,
  toStreamSymbol,
  unsubscribe as unsubscribeFromStream,
} from "../services/streamService.js";
import { pickFirst, toNumber, toObject } from "../utils/apiTransforms.js";

const MAX_STREAMS = 20;

function normalizeStreams(streams = []) {
  return [...new Set(
    streams
      .map((stream) => String(stream || "").trim())
      .filter(Boolean),
  )].slice(0, MAX_STREAMS);
}

function extractStreamPrice(payload) {
  const source = toObject(payload);
  const value = pickFirst(source, ["value", "payload", "data"], source);
  const nestedValue = toObject(value);

  return toNumber(
    pickFirst(
      nestedValue,
      ["price", "c", "close", "lastPrice"],
      pickFirst(source, ["price", "c", "close", "lastPrice"], 0),
    ),
    0,
  );
}

function logStreamError(message, details) {
  console.error(`[useMultiStream] ${message}`, details);
}

function useMultiStream({ streams = [], refreshMs = 1000 } = {}) {
  const normalizedStreams = normalizeStreams(streams);
  const streamsKey = normalizedStreams.join(",");
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(normalizedStreams.length > 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const subscribedStreamsRef = useRef(new Set());
  const desiredStreamsRef = useRef(normalizedStreams);
  const intervalRef = useRef(null);
  const pollInFlightRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const syncVersionRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      syncVersionRef.current += 1;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const streamsToUnsubscribe = [...subscribedStreamsRef.current];
      subscribedStreamsRef.current.clear();

      if (streamsToUnsubscribe.length === 0) {
        return;
      }

      Promise.allSettled(streamsToUnsubscribe.map((stream) => unsubscribeFromStream(stream)))
        .then((results) => {
          results.forEach((result, index) => {
            if (result.status === "rejected") {
              logStreamError("Failed to unsubscribe during cleanup.", {
                stream: streamsToUnsubscribe[index],
                error: result.reason,
              });
            }
          });
        })
        .catch(() => {});
    };
  }, []);

  useEffect(() => {
    desiredStreamsRef.current = normalizedStreams;
    syncVersionRef.current += 1;
    const syncVersion = syncVersionRef.current;

    async function loadFallbackPrices(streamsToLoad) {
      if (streamsToLoad.length === 0) {
        return {};
      }

      const fallbackResults = await Promise.allSettled(
        streamsToLoad.map((stream) => getPrice(toStreamSymbol(stream), { forceRefresh: true })),
      );
      const nextPrices = {};

      fallbackResults.forEach((result, index) => {
        const stream = streamsToLoad[index];
        const symbol = toStreamSymbol(stream);

        if (result.status === "fulfilled" && typeof result.value?.price === "number" && result.value.price > 0) {
          nextPrices[symbol] = result.value.price;
          return;
        }

        if (result.status === "rejected") {
          logStreamError("Fallback price request failed.", {
            stream,
            error: result.reason,
          });
        }
      });

      return nextPrices;
    }

    async function pollStreams(activeStreams, { initial = false } = {}) {
      if (activeStreams.length === 0 || pollInFlightRef.current) {
        return;
      }

      pollInFlightRef.current = true;

      if (isMountedRef.current) {
        if (!hasLoadedRef.current || initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
      }

      try {
        const settledResults = await Promise.allSettled(
          activeStreams.map((stream) => getLatest(stream)),
        );

        if (!isMountedRef.current || syncVersionRef.current !== syncVersion) {
          return;
        }

        const nextPrices = {};
        const fallbackStreams = [];

        settledResults.forEach((result, index) => {
          const stream = activeStreams[index];
          const symbol = toStreamSymbol(stream);

          if (result.status === "fulfilled") {
            const price = extractStreamPrice(result.value);

            if (price > 0) {
              nextPrices[symbol] = price;
              return;
            }
          } else {
            logStreamError("Stream latest request failed.", {
              stream,
              error: result.reason,
            });
          }

          fallbackStreams.push(stream);
        });

        const fallbackPrices = await loadFallbackPrices(fallbackStreams);

        if (!isMountedRef.current || syncVersionRef.current !== syncVersion) {
          return;
        }

        const mergedPrices = {
          ...nextPrices,
          ...fallbackPrices,
        };

        if (Object.keys(mergedPrices).length > 0) {
          setPrices((currentPrices) => ({
            ...currentPrices,
            ...mergedPrices,
          }));
          hasLoadedRef.current = true;
          setError(null);
          return;
        }

        if (!hasLoadedRef.current) {
          setError("Unable to load market stream prices.");
        }
      } finally {
        pollInFlightRef.current = false;

        if (isMountedRef.current && syncVersionRef.current === syncVersion) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    async function syncStreams() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setError(null);

      if (normalizedStreams.length === 0) {
        const streamsToUnsubscribe = [...subscribedStreamsRef.current];

        if (streamsToUnsubscribe.length > 0) {
          const unsubscribeResults = await Promise.allSettled(
            streamsToUnsubscribe.map((stream) => unsubscribeFromStream(stream)),
          );

          if (!isMountedRef.current || syncVersionRef.current !== syncVersion) {
            return;
          }

          unsubscribeResults.forEach((result, index) => {
            if (result.status === "rejected") {
              logStreamError("Failed to unsubscribe stream.", {
                stream: streamsToUnsubscribe[index],
                error: result.reason,
              });
            }
          });
        }

        subscribedStreamsRef.current.clear();
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setLoading(true);

      const desiredStreamSet = new Set(normalizedStreams);
      const subscribedStreams = subscribedStreamsRef.current;
      const streamsToUnsubscribe = [...subscribedStreams].filter((stream) => !desiredStreamSet.has(stream));

      if (streamsToUnsubscribe.length > 0) {
        const unsubscribeResults = await Promise.allSettled(
          streamsToUnsubscribe.map((stream) => unsubscribeFromStream(stream)),
        );

        if (!isMountedRef.current || syncVersionRef.current !== syncVersion) {
          return;
        }

        unsubscribeResults.forEach((result, index) => {
          const stream = streamsToUnsubscribe[index];

          if (result.status === "rejected") {
            logStreamError("Failed to unsubscribe stream.", {
              stream,
              error: result.reason,
            });
          }

          subscribedStreams.delete(stream);
        });
      }

      const streamsToSubscribe = normalizedStreams.filter((stream) => !subscribedStreams.has(stream));

      if (streamsToSubscribe.length > 0) {
        const subscribeResults = await Promise.allSettled(
          streamsToSubscribe.map((stream) => subscribeToStream(stream)),
        );

        if (!isMountedRef.current || syncVersionRef.current !== syncVersion) {
          return;
        }

        subscribeResults.forEach((result, index) => {
          const stream = streamsToSubscribe[index];

          if (result.status === "fulfilled") {
            subscribedStreams.add(stream);
            return;
          }

          logStreamError("Failed to subscribe stream.", {
            stream,
            error: result.reason,
          });
        });
      }

      const activeStreams = normalizedStreams.filter((stream) => subscribedStreams.has(stream));

      if (activeStreams.length === 0) {
        if (!hasLoadedRef.current) {
          setError("Unable to subscribe to market streams.");
        }

        setLoading(false);
        setRefreshing(false);
        return;
      }

      await pollStreams(activeStreams, { initial: true });

      if (!isMountedRef.current || syncVersionRef.current !== syncVersion) {
        return;
      }

      if (refreshMs > 0) {
        intervalRef.current = setInterval(() => {
          const currentStreams = desiredStreamsRef.current
            .filter((stream) => subscribedStreamsRef.current.has(stream));

          void pollStreams(currentStreams);
        }, refreshMs);
      }
    }

    void syncStreams();
  }, [refreshKey, refreshMs, streamsKey]);

  return {
    prices,
    loading,
    refreshing,
    error,
    refresh: () => setRefreshKey((current) => current + 1),
  };
}

export default useMultiStream;
