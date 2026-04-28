package com.zyra.trading.controller;

import com.zyra.trading.dto.response.AccountResponse;
import com.zyra.trading.model.Balance;
import com.zyra.trading.model.Order;
import com.zyra.trading.service.AccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SIGNED account endpoints.
 *
 * GET /account/info
 * GET /account/balance
 * GET /account/open-orders?symbol=BTCUSDT
 */
@Slf4j
@RestController
@RequestMapping("/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    /** Full account info including all balances and permission flags. */
    @GetMapping("/info")
    public ResponseEntity<AccountResponse> getAccountInfo() {
        return ResponseEntity.ok(accountService.getAccountInfo().block());
    }

    /** Non-zero balances only — useful for portfolio view. */
    @GetMapping("/balance")
    public ResponseEntity<List<Balance>> getBalances() {
        return ResponseEntity.ok(accountService.getNonZeroBalances().block());
    }

    /**
     * Open orders. Pass ?symbol=BTCUSDT to filter to one trading pair,
     * or omit the parameter to get all open orders across every symbol.
     */
    @GetMapping("/open-orders")
    public ResponseEntity<List<Order>> getOpenOrders(
            @RequestParam(required = false) String symbol) {
        return ResponseEntity.ok(accountService.getOpenOrders(symbol).block());
    }
}
