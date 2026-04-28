package com.zyra.trading.controller;

import com.zyra.trading.dto.request.BinanceConfigRequest;
import com.zyra.trading.service.IntegrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/integrations")
public class IntegrationController {

    private final IntegrationService integrationService;

    public IntegrationController(IntegrationService integrationService) {
        this.integrationService = integrationService;
    }

    @PostMapping("/binance")
    public ResponseEntity<?> saveBinance(@RequestBody BinanceConfigRequest request) {
        integrationService.saveBinanceConfig(request);
        return ResponseEntity.ok("Saved successfully");
    }

    @PostMapping("/binance/validate")
    public ResponseEntity<?> validate(@RequestBody BinanceConfigRequest request) {
        boolean valid = integrationService.validateKeys(request);
        return ResponseEntity.ok(valid ? "Valid" : "Invalid");
    }

    @GetMapping("/binance")
    public ResponseEntity<?> getBinanceConfig() {
        return ResponseEntity.ok(integrationService.getBinanceConfig());
    }
}
