package com.zyra.trading.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Request body for placing a LIMIT order.
 * Limit orders execute only at the specified price or better.
 *
 * timeInForce values:
 *   GTC – Good Till Cancelled (default, order stays open until filled or cancelled)
 *   IOC – Immediate Or Cancel (fill what you can right now, cancel remainder)
 *   FOK – Fill Or Kill (fill everything immediately or cancel the whole order)
 */
@Data
public class LimitOrderRequest {

    @NotBlank(message = "Symbol is required (e.g. BTCUSDT)")
    private String symbol;

    @NotBlank(message = "Side must be BUY or SELL")
    @Pattern(regexp = "BUY|SELL", message = "Side must be BUY or SELL")
    private String side;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.00001", message = "Quantity must be greater than 0.00001")
    private BigDecimal quantity;

    @NotNull(message = "Price is required for LIMIT orders")
    @DecimalMin(value = "0.01", message = "Price must be positive")
    private BigDecimal price;

    /**
     * Defaults to GTC if not provided.
     */
    @Pattern(regexp = "GTC|IOC|FOK", message = "timeInForce must be GTC, IOC, or FOK")
    private String timeInForce = "GTC";

    private String newClientOrderId;
}
