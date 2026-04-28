package com.zyra.trading.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Represents a recent trade from GET /api/v3/trades.
 * Also used internally to log our own executed trades in memory.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Trade {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("price")
    private BigDecimal price;

    @JsonProperty("qty")
    private BigDecimal quantity;

    @JsonProperty("quoteQty")
    private BigDecimal quoteQuantity;

    @JsonProperty("time")
    private Long time;              // epoch millis

    @JsonProperty("isBuyerMaker")
    private Boolean isBuyerMaker;

    @JsonProperty("isBestMatch")
    private Boolean isBestMatch;

    // ── Fields added for our internal trade log ─────────────────────────────

    private String symbol;          // populated by TradeLogService
    private String side;            // BUY / SELL — populated by TradeLogService
}
