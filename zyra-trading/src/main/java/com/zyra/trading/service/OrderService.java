package com.zyra.trading.service;

import com.zyra.trading.dto.request.LimitOrderRequest;
import com.zyra.trading.dto.request.MarketOrderRequest;
import com.zyra.trading.model.Order;
import com.zyra.trading.model.Trade;
import com.zyra.trading.model.TradeRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Handles SIGNED trading endpoints:
 *   POST   /api/v3/order  — place market or limit order
 *   DELETE /api/v3/order  — cancel an open order
 *
 * Also maintains a simple in-memory trade log (circular buffer, max 500 entries)
 * so the platform can show recent platform-initiated trades without a database.
 * In production this would be replaced by a persistent store (PostgreSQL, Redis, etc.)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private static final String ORDER_PATH = "/api/v3/order";
    private static final int    TRADE_LOG_CAPACITY = 500;

    private final BinanceService binanceService;

    /** Thread-safe in-memory trade log. Newest entries at the front.
    private final LinkedList<Trade> tradeLog = new LinkedList<>();*/

    private final List<TradeRecord> tradeLog = new CopyOnWriteArrayList<>();

    private TradeRecord mapToTradeRecord(Order order) {

        TradeRecord trade = new TradeRecord();

        trade.setOrderId(order.getOrderId());
        trade.setSymbol(order.getSymbol());
        trade.setSide(order.getSide());
        trade.setType(order.getType());

        trade.setQuantity(order.getOriginalQuantity());
        trade.setExecutedQty(order.getExecutedQuantity());
        if (order.getPrice().compareTo(BigDecimal.ZERO) == 0 &&
                order.getExecutedQuantity().compareTo(BigDecimal.ZERO) > 0) {

            trade.setPrice(
                    order.getCumulativeQuoteQuantity()
                            .divide(order.getExecutedQuantity(), 8, RoundingMode.HALF_UP)
            );
        } else {
            trade.setPrice(order.getPrice());
        }
        trade.setQuoteQty(order.getCumulativeQuoteQuantity());

        trade.setStatus(order.getStatus());
        trade.setTimestamp(System.currentTimeMillis());

        return trade;
    }

    @Scheduled(fixedDelay = 3000)
    public void syncOpenOrders() {
        log.debug("Syncing open orders...");

        for (TradeRecord trade : tradeLog) {

            if ("NEW".equals(trade.getStatus()) ||
                    "PARTIALLY_FILLED".equals(trade.getStatus())) {

                getOrderStatus(trade.getSymbol(), trade.getOrderId())
                        .subscribe(); // triggers updateTradeRecord
            }
        }
    }

    // ── Place MARKET order ───────────────────────────────────────────────────

    /**
     * Places a MARKET order — executes immediately at the best available price.
     *
     * Query params sent to Binance:
     *   symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.001
     *   [+timestamp, recvWindow, signature added automatically]
     */
    public Mono<Order> placeMarketOrder(MarketOrderRequest req) {
        log.info("Placing MARKET {} {} qty={}", req.getSide(), req.getSymbol(), req.getQuantity());

        StringBuilder params = new StringBuilder()
                .append("symbol=").append(req.getSymbol())
                .append("&side=").append(req.getSide())
                .append("&type=MARKET")
                .append("&quantity=").append(req.getQuantity());

        if (req.getNewClientOrderId() != null) {
            params.append("&newClientOrderId=").append(req.getNewClientOrderId());
        }

        return binanceService.postSigned(ORDER_PATH, params.toString(), Order.class)
                .doOnNext(order -> {
                    log.info("MARKET order placed orderId={} status={}",
                            order.getOrderId(), order.getStatus());
                    recordToTradeLog(order);
                });
    }

    // ── Place LIMIT order ────────────────────────────────────────────────────

    /**
     * Places a LIMIT order — executes at the specified price or better.
     *
     * Query params sent to Binance:
     *   symbol=BTCUSDT&side=BUY&type=LIMIT&timeInForce=GTC
     *   &quantity=0.001&price=25000.00
     *   [+timestamp, recvWindow, signature]
     */
    public Mono<Order> placeLimitOrder(LimitOrderRequest req) {
        log.info("Placing LIMIT {} {} qty={} price={}",
                req.getSide(), req.getSymbol(), req.getQuantity(), req.getPrice());

        StringBuilder params = new StringBuilder()
                .append("symbol=").append(req.getSymbol())
                .append("&side=").append(req.getSide())
                .append("&type=LIMIT")
                .append("&timeInForce=").append(req.getTimeInForce())
                .append("&quantity=").append(req.getQuantity())
                .append("&price=").append(req.getPrice());

        if (req.getNewClientOrderId() != null) {
            params.append("&newClientOrderId=").append(req.getNewClientOrderId());
        }

        return binanceService.postSigned(ORDER_PATH, params.toString(), Order.class)
                .doOnNext(order -> {
                    log.info("LIMIT order placed orderId={} status={}",
                            order.getOrderId(), order.getStatus());
                    recordToTradeLog(order);
                });
    }

    // ── Cancel order ─────────────────────────────────────────────────────────

    /**
     * Cancels an open order by symbol + orderId.
     *
     * @param symbol  e.g. "BTCUSDT"
     * @param orderId the Binance-assigned order ID
     */
    public Mono<Order> cancelOrder(String symbol, Long orderId) {
        log.info("Cancelling order orderId={} symbol={}", orderId, symbol);
        String params = "symbol=" + symbol + "&orderId=" + orderId;
        return binanceService.deleteSigned(ORDER_PATH, params, Order.class)
                .doOnNext(order -> log.info("Order {} cancelled, status={}", orderId, order.getStatus()));
    }

    public Mono<Order> getOrderStatus(String symbol, Long orderId) {

        Map<String, String> params = new HashMap<>();
        params.put("symbol", symbol);
        params.put("orderId", String.valueOf(orderId));

        return binanceService.getSigned(
                ORDER_PATH,
                params,
                Order.class
        ).doOnNext(order -> {
            log.info("Order status fetched: orderId={} status={}",
                    order.getOrderId(),
                    order.getStatus());

            updateTradeRecord(order); // 🔥 important
        });
    }

    // ── In-memory trade log ──────────────────────────────────────────────────

    /**
     * Returns the most recent trades placed through this service instance.
     * The list is newest-first and capped at TRADE_LOG_CAPACITY entries.
     */
    public List<TradeRecord> getTradeLog() {
        return List.copyOf(tradeLog);
    }

    private void recordToTradeLog(Order order) {
        TradeRecord trade = mapToTradeRecord(order);

        if (tradeLog.size() >= TRADE_LOG_CAPACITY) {
            tradeLog.remove(0); // remove oldest
        }

        tradeLog.add(trade);

        log.info("Trade recorded: {} {} {} status={}",
                trade.getSide(),
                trade.getSymbol(),
                trade.getQuantity(),
                trade.getStatus());
    }

    private void updateTradeRecord(Order updatedOrder) {

        for (TradeRecord trade : tradeLog) {

            if (trade.getOrderId().equals(updatedOrder.getOrderId())) {

                trade.setStatus(updatedOrder.getStatus());
                trade.setExecutedQty(updatedOrder.getExecutedQuantity());
                trade.setQuoteQty(updatedOrder.getCumulativeQuoteQuantity());

                // 🔥 update price if it was MARKET
                if (updatedOrder.getExecutedQuantity().compareTo(BigDecimal.ZERO) > 0) {
                    trade.setPrice(
                            updatedOrder.getCumulativeQuoteQuantity()
                                    .divide(updatedOrder.getExecutedQuantity(), 8, RoundingMode.HALF_UP)
                    );
                }

                log.info("Trade updated: orderId={} newStatus={}",
                        trade.getOrderId(),
                        trade.getStatus());

                break;
            }
        }
    }
}
