package com.zyra.trading.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zyra.trading.config.BinanceProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

/**
 * WebSocket client that subscribes to Binance stream endpoints for live data.
 *
 * Supported streams:
 *   - Individual symbol mini-ticker:  <symbol>@miniTicker
 *   - Aggregate trade stream:         <symbol>@aggTrade
 *
 * Usage:
 *   binanceWebSocketClient.subscribeMiniTicker("btcusdt", tick -> {
 *       System.out.println("BTC price: " + tick.get("c"));
 *   });
 *
 * Design notes:
 * - Each subscription opens its own WebSocket connection (Binance allows ~1024 concurrent streams).
 * - Sessions are stored in a ConcurrentHashMap keyed by stream name.
 * - On disconnect, you should call subscribe again (auto-reconnect is left as a production enhancement).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BinanceWebSocketClient {

    private final BinanceProperties properties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Active WebSocket sessions keyed by stream name (e.g. "btcusdt@miniTicker") */
    private final Map<String, WebSocketSession> activeSessions = new ConcurrentHashMap<>();

    // ── Public subscribe methods ─────────────────────────────────────────────

    /**
     * Subscribes to the mini-ticker stream for a symbol.
     * Delivers real-time price updates approximately once per second.
     *
     * @param symbol   lowercase symbol, e.g. "btcusdt"
     * @param onUpdate callback receiving the raw JSON node from Binance
     */
    public void subscribeMiniTicker(String symbol, Consumer<JsonNode> onUpdate) {
        String stream = symbol.toLowerCase() + "@miniTicker";
        subscribe(stream, onUpdate);
    }

    /**
     * Subscribes to the aggregate trade stream for a symbol.
     * Delivers real-time trade events as they happen.
     *
     * @param symbol   lowercase symbol, e.g. "btcusdt"
     * @param onUpdate callback receiving the raw JSON node from Binance
     */
    public void subscribeAggTrade(String symbol, Consumer<JsonNode> onUpdate) {
        String stream = symbol.toLowerCase() + "@aggTrade";
        subscribe(stream, onUpdate);
    }

    /**
     * Closes the WebSocket connection for a stream.
     */
    public void unsubscribe(String streamName) {
        WebSocketSession session = activeSessions.remove(streamName);
        if (session != null && session.isOpen()) {
            try {
                session.close();
                log.info("Closed WebSocket stream: {}", streamName);
            } catch (Exception e) {
                log.warn("Error closing stream {}: {}", streamName, e.getMessage());
            }
        }
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    private void subscribe(String stream, Consumer<JsonNode> onUpdate) {
        // Close existing session for this stream if one exists
        unsubscribe(stream);

        String url = properties.getWebsocket().getBaseUrl() + "/" + stream;
        log.info("Subscribing to Binance stream: {}", url);

        WebSocketClient wsClient = new StandardWebSocketClient();
        AtomicReference<WebSocketSession> sessionRef = new AtomicReference<>();

        try {
            WebSocketSession session = wsClient.execute(
                    new BinanceStreamHandler(stream, onUpdate),
                    url
            ).get();

            activeSessions.put(stream, session);
            log.info("WebSocket connected for stream: {}", stream);

        } catch (Exception e) {
            log.error("Failed to connect to stream {}: {}", stream, e.getMessage());
        }
    }

    // ── Inner handler ────────────────────────────────────────────────────────

    private class BinanceStreamHandler extends TextWebSocketHandler {

        private final String streamName;
        private final Consumer<JsonNode> onUpdate;

        BinanceStreamHandler(String streamName, Consumer<JsonNode> onUpdate) {
            this.streamName = streamName;
            this.onUpdate   = onUpdate;
        }

        @Override
        public void afterConnectionEstablished(WebSocketSession session) {
            log.debug("WS connection established: {}", streamName);
        }

        @Override
        protected void handleTextMessage(WebSocketSession session, TextMessage message) {
            try {
                JsonNode node = objectMapper.readTree(message.getPayload());
                log.debug("WS message [{}]: {}", streamName, message.getPayload());
                onUpdate.accept(node);
            } catch (Exception e) {
                log.error("Error parsing WS message for stream {}: {}", streamName, e.getMessage());
            }
        }

        @Override
        public void handleTransportError(WebSocketSession session, Throwable exception) {
            log.error("WS transport error on stream {}: {}", streamName, exception.getMessage());
        }

        @Override
        public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
            log.info("WS connection closed for stream {} with status {}", streamName, status);
            activeSessions.remove(streamName);
        }
    }
}
