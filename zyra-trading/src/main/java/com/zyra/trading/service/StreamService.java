package com.zyra.trading.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.zyra.trading.websocket.BinanceWebSocketClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
public class StreamService {

    private final BinanceWebSocketClient webSocketClient;

    private final Map<String, JsonNode> latestTicks = new ConcurrentHashMap<>();
    private final Map<String, Deque<JsonNode>> history = new ConcurrentHashMap<>();

    private final Set<String> activeStreams = ConcurrentHashMap.newKeySet();

    private static final int MAX_HISTORY = 100;
    private static final long MAX_AGE_MS = 5000;

    public String subscribe(String symbol, String type) {
        String stream = symbol.toLowerCase() + "@" + type;

        if (activeStreams.contains(stream)) {
            return stream; // already subscribed, don't crash
        }

        activeStreams.add(stream);

        Consumer<JsonNode> handler = tick -> {
            long eventTime = tick.has("E") ? tick.get("E").asLong() : System.currentTimeMillis();

            if (System.currentTimeMillis() - eventTime > MAX_AGE_MS) return;

            latestTicks.put(stream, tick);

            history.computeIfAbsent(stream, k -> new ArrayDeque<>());
            Deque<JsonNode> deque = history.get(stream);

            if (deque.size() >= MAX_HISTORY) {
                deque.pollFirst();
            }

            deque.addLast(tick);
        };

        if ("miniTicker".equalsIgnoreCase(type)) {
            webSocketClient.subscribeMiniTicker(symbol, handler);
        } else if ("aggTrade".equalsIgnoreCase(type)) {
            webSocketClient.subscribeAggTrade(symbol, handler);
        } else {
            throw new RuntimeException("Unsupported stream type: " + type);
        }

        // 🔥 important fix
        latestTicks.putIfAbsent(stream, null);

        return stream;
    }

    public void unsubscribe(String stream) {
        webSocketClient.unsubscribe(stream);
        activeStreams.remove(stream);
        latestTicks.remove(stream);
        history.remove(stream);
    }

    public JsonNode getLatest(String stream) {
        return latestTicks.get(stream); // can be null → handled by controller
    }

    public List<JsonNode> getHistory(String stream) {
        Deque<JsonNode> deque = history.get(stream);
        if (deque == null) return null;
        return new ArrayList<>(deque);
    }
}
