package com.zyra.trading.controller;

import com.zyra.trading.dto.request.LimitOrderRequest;
import com.zyra.trading.dto.request.MarketOrderRequest;
import com.zyra.trading.model.Order;
import com.zyra.trading.model.Trade;
import com.zyra.trading.model.TradeRecord;
import com.zyra.trading.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * SIGNED trading endpoints.
 *
 * POST   /order/market          — place a market order
 * POST   /order/limit           — place a limit order
 * DELETE /order/{orderId}       — cancel an open order
 * GET    /order/trade-log       — in-memory log of this session's orders
 */
@Slf4j
@RestController
@RequestMapping("/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/market")
    public ResponseEntity<Order> placeMarketOrder(
            @Valid @RequestBody MarketOrderRequest request) {

        Order order = orderService.placeMarketOrder(request).block();
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @PostMapping("/limit")
    public ResponseEntity<Order> placeLimitOrder(
            @Valid @RequestBody LimitOrderRequest request) {

        Order order = orderService.placeLimitOrder(request).block();
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<Order> cancelOrder(
            @PathVariable Long orderId,
            @RequestParam String symbol) {

        Order order = orderService.cancelOrder(symbol, orderId).block();
        return ResponseEntity.ok(order);
    }

    @GetMapping("/trade-log")
    public ResponseEntity<List<TradeRecord>> getTradeLog() {
        return ResponseEntity.ok(orderService.getTradeLog());
    }

    @GetMapping("/status")
    public ResponseEntity<Mono<Order>> getOrderStatus(
            @RequestParam String symbol,
            @RequestParam Long orderId) {

        return ResponseEntity.ok(
                orderService.getOrderStatus(symbol, orderId)
        );
    }
}
