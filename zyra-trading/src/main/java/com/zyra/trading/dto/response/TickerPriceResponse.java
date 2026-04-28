package com.zyra.trading.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response from GET /api/v3/ticker/price
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TickerPriceResponse {

    @JsonProperty("symbol")
    private String symbol;

    @JsonProperty("price")
    private BigDecimal price;
}
