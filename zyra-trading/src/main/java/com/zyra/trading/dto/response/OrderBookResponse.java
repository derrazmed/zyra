package com.zyra.trading.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response from GET /api/v3/depth
 *
 * Each entry in bids/asks is a two-element array: [price, quantity].
 * Binance returns these as JSON arrays, e.g.: [["30000.00", "0.5"], ...]
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderBookResponse {

    @JsonProperty("lastUpdateId")
    private Long lastUpdateId;

    /** List of [price, quantity] pairs — best bids first (descending price) */
    @JsonProperty("bids")
    private List<List<BigDecimal>> bids;

    /** List of [price, quantity] pairs — best asks first (ascending price) */
    @JsonProperty("asks")
    private List<List<BigDecimal>> asks;

    // ── Convenience accessors ────────────────────────────────────────────────

    public BigDecimal getBestBidPrice() {
        return (bids != null && !bids.isEmpty()) ? bids.get(0).get(0) : BigDecimal.ZERO;
    }

    public BigDecimal getBestAskPrice() {
        return (asks != null && !asks.isEmpty()) ? asks.get(0).get(0) : BigDecimal.ZERO;
    }

    public BigDecimal getMidPrice() {
        BigDecimal bid = getBestBidPrice();
        BigDecimal ask = getBestAskPrice();
        if (bid.compareTo(BigDecimal.ZERO) == 0 || ask.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return bid.add(ask).divide(BigDecimal.valueOf(2));
    }

    public BigDecimal getSpread() {
        return getBestAskPrice().subtract(getBestBidPrice());
    }
}
