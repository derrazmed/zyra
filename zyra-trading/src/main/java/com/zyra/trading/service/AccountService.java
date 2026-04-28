package com.zyra.trading.service;

import com.zyra.trading.dto.response.AccountResponse;
import com.zyra.trading.model.Balance;
import com.zyra.trading.model.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private static final String ACCOUNT_PATH     = "/api/v3/account";
    private static final String OPEN_ORDERS_PATH = "/api/v3/openOrders";

    private final BinanceService binanceService;

    public Mono<AccountResponse> getAccountInfo() {
        log.info("Fetching account info");
        Map<String, String> params = new HashMap<>();
        return binanceService.getSigned(ACCOUNT_PATH, params, AccountResponse.class);
    }

    public Mono<List<Balance>> getNonZeroBalances() {
        return getAccountInfo()
                .map(account -> account.getBalances().stream()
                        .filter(Balance::hasBalance)
                        .toList());
    }

    public Mono<List<Order>> getOpenOrders(String symbol) {
        String params = (symbol != null && !symbol.isBlank()) ? "symbol=" + symbol : "";
        log.info("Fetching open orders {}", symbol != null ? "for " + symbol : "(all symbols)");
        return binanceService.getSigned(
                OPEN_ORDERS_PATH,
                params,
                new ParameterizedTypeReference<>() {});
    }
}
