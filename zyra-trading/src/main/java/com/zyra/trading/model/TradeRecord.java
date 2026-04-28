package com.zyra.trading.model;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TradeRecord {
    private Long orderId;
    private String symbol;
    private String side;        // BUY / SELL
    private String type;        // MARKET / LIMIT
    private BigDecimal quantity;
    private BigDecimal price;
    private String status;      // NEW / FILLED / CANCELED
    private BigDecimal executedQty;
    private BigDecimal quoteQty;
    private long timestamp;
}
