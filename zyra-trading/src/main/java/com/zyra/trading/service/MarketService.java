package com.zyra.trading.service;

import com.zyra.trading.dto.response.OrderBookResponse;
import com.zyra.trading.dto.response.TickerPriceResponse;
import com.zyra.trading.model.Trade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketService {

    private static final String TICKER_PRICE_PATH = "/api/v3/ticker/price";
    private static final String DEPTH_PATH        = "/api/v3/depth";
    private static final String TRADES_PATH       = "/api/v3/trades";

    private final BinanceService binanceService;

    public Mono<TickerPriceResponse> getTickerPrice(String symbol) {
        log.info("Fetching ticker price for {}", symbol);
        return binanceService.getPublic(TICKER_PRICE_PATH, "symbol=" + symbol,
                TickerPriceResponse.class);
    }

    public Mono<OrderBookResponse> getOrderBook(String symbol, int limit) {
        log.info("Fetching order book for {} depth={}", symbol, limit);
        return binanceService.getPublic(DEPTH_PATH,
                "symbol=" + symbol + "&limit=" + limit,
                OrderBookResponse.class);
    }

    public Mono<List<Trade>> getRecentTrades(String symbol, int limit) {
        log.info("Fetching recent trades for {} limit={}", symbol, limit);
        return binanceService.getPublic(TRADES_PATH,
                "symbol=" + symbol + "&limit=" + limit,
                new ParameterizedTypeReference<>() {});
    }
}
