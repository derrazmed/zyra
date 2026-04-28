package com.zyra.trading.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Represents a single asset balance in the account.
 * Part of the GET /api/v3/account response under the "balances" array.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Balance {

    @JsonProperty("asset")
    private String asset;           // e.g. "BTC", "USDT", "ETH"

    @JsonProperty("free")
    private BigDecimal free;        // Available for trading

    @JsonProperty("locked")
    private BigDecimal locked;      // Held in open orders

    /**
     * Returns the total balance (free + locked).
     */
    public BigDecimal getTotal() {
        return free.add(locked);
    }

    /**
     * Returns true if this balance is non-zero (useful for filtering dust).
     */
    public boolean hasBalance() {
        return free.compareTo(BigDecimal.ZERO) > 0
                || locked.compareTo(BigDecimal.ZERO) > 0;
    }
}
