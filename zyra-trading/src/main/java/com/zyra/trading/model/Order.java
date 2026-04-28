package com.zyra.trading.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Domain model for an order returned from Binance.
 * Field names follow Binance's exact JSON keys so Jackson can deserialize
 * directly from the Binance response without a manual mapping step.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Order {

    @JsonProperty("symbol")
    private String symbol;

    @JsonProperty("orderId")
    private Long orderId;

    @JsonProperty("clientOrderId")
    private String clientOrderId;

    @JsonProperty("price")
    private BigDecimal price;

    @JsonProperty("origQty")
    private BigDecimal originalQuantity;

    @JsonProperty("executedQty")
    private BigDecimal executedQuantity;

    @JsonProperty("cummulativeQuoteQty")
    private BigDecimal cumulativeQuoteQuantity;

    @JsonProperty("status")
    private String status;          // NEW, PARTIALLY_FILLED, FILLED, CANCELED, etc.

    @JsonProperty("timeInForce")
    private String timeInForce;     // GTC, IOC, FOK

    @JsonProperty("type")
    private String type;            // MARKET, LIMIT, STOP_LOSS_LIMIT, etc.

    @JsonProperty("side")
    private String side;            // BUY or SELL

    @JsonProperty("stopPrice")
    private BigDecimal stopPrice;

    @JsonProperty("time")
    private Long time;              // epoch millis

    @JsonProperty("updateTime")
    private Long updateTime;

    @JsonProperty("isWorking")
    private Boolean isWorking;

    public Instant getOrderTime() {
        return time != null ? Instant.ofEpochMilli(time) : null;
    }
}
