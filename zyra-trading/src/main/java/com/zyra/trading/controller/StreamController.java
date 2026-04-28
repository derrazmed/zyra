package com.zyra.trading.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.zyra.trading.service.StreamService;
import com.zyra.trading.websocket.BinanceWebSocketClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/**
 * REST endpoints to manage WebSocket stream subscriptions.
 *
 * POST   /stream/subscribe?symbol=btcusdt&type=miniTicker
 * DELETE /stream/unsubscribe?stream=btcusdt@miniTicker
 * GET    /stream/latest?stream=btcusdt@miniTicker
 *
 * The latest tick for each subscribed stream is held in memory and returned
 * via GET /stream/latest — a lightweight polling alternative if the consumer
 * does not want to hold its own WebSocket connection.
 */
@Slf4j
@RestController
@RequestMapping("/stream")
@RequiredArgsConstructor
public class StreamController {

    private final StreamService streamService;

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(
            @RequestParam(defaultValue = "btcusdt") String symbol,
            @RequestParam(defaultValue = "miniTicker") String type) {

        try {
            log.info("Subscribing: {} {}", symbol, type);

            String stream = streamService.subscribe(symbol, type);

            return ResponseEntity.ok(Map.of(
                    "stream", stream,
                    "status", "subscribed"
            ));

        } catch (Exception e) {
            log.error("SUBSCRIBE ERROR", e);

            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(@RequestParam String stream) {
        streamService.unsubscribe(stream);
        return ResponseEntity.ok(Map.of("stream", stream, "status", "unsubscribed"));
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatest(@RequestParam String stream) {

        JsonNode tick = streamService.getLatest(stream);

        if (tick == null) {
            return ResponseEntity.ok().build(); // 🔥 no more 404
        }

        return ResponseEntity.ok(tick);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@RequestParam String stream) {

        List<JsonNode> data = streamService.getHistory(stream);

        if (data == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(data);
    }
}
