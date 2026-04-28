package com.zyra.trading.controller;

import com.zyra.trading.dto.response.OrderBookResponse;
import com.zyra.trading.dto.response.TickerPriceResponse;
import com.zyra.trading.model.Trade;
import com.zyra.trading.service.MarketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public market data endpoints — no authentication required.
 *
 * GET /market/price?symbol=BTCUSDT
 * GET /market/depth?symbol=BTCUSDT&limit=20
 * GET /market/trades?symbol=BTCUSDT&limit=50
 */
@Slf4j
@RestController
@RequestMapping("/market")
@RequiredArgsConstructor
public class MarketController {

    private final MarketService marketService;

    @GetMapping("/price")
    public ResponseEntity<TickerPriceResponse> getTickerPrice(
            @RequestParam(defaultValue = "BTCUSDT") String symbol) {

        TickerPriceResponse response = marketService.getTickerPrice(symbol).block();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/depth")
    public ResponseEntity<OrderBookResponse> getOrderBook(
            @RequestParam(defaultValue = "BTCUSDT") String symbol,
            @RequestParam(defaultValue = "20") int limit) {

        OrderBookResponse response = marketService.getOrderBook(symbol, limit).block();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trades")
    public ResponseEntity<List<Trade>> getRecentTrades(
            @RequestParam(defaultValue = "BTCUSDT") String symbol,
            @RequestParam(defaultValue = "50") int limit) {

        List<Trade> trades = marketService.getRecentTrades(symbol, limit).block();
        return ResponseEntity.ok(trades);
    }
}
