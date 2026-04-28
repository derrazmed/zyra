package com.zyra.trading.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Request body for placing a MARKET order.
 * Market orders execute immediately at the best available price.
 */
@Data
public class MarketOrderRequest {

    @NotBlank(message = "Symbol is required (e.g. BTCUSDT)")
    private String symbol;

    @NotBlank(message = "Side must be BUY or SELL")
    @Pattern(regexp = "BUY|SELL", message = "Side must be BUY or SELL")
    private String side;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.00001", message = "Quantity must be greater than 0.00001")
    private BigDecimal quantity;

    /**
     * Optional client-assigned order ID for idempotency / reconciliation.
     * If null, Binance will generate one.
     */
    private String newClientOrderId;
}
