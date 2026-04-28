package com.zyra.trading.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.zyra.trading.model.Balance;
import lombok.Data;

import java.util.List;

/**
 * Wraps the Binance GET /api/v3/account response.
 * We don't expose every field — only what Zyra needs.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AccountResponse {

    @JsonProperty("makerCommission")
    private Integer makerCommission;

    @JsonProperty("takerCommission")
    private Integer takerCommission;

    @JsonProperty("buyerCommission")
    private Integer buyerCommission;

    @JsonProperty("sellerCommission")
    private Integer sellerCommission;

    @JsonProperty("canTrade")
    private Boolean canTrade;

    @JsonProperty("canWithdraw")
    private Boolean canWithdraw;

    @JsonProperty("canDeposit")
    private Boolean canDeposit;

    @JsonProperty("updateTime")
    private Long updateTime;

    @JsonProperty("accountType")
    private String accountType;

    @JsonProperty("balances")
    private List<Balance> balances;
}
