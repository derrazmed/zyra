package com.zyra.trading.service;

import com.zyra.trading.dto.request.BinanceConfigRequest;
import com.zyra.trading.dto.response.BinanceConfigResponse;
import com.zyra.trading.model.BinanceConfig;
import com.zyra.trading.repository.BinanceConfigRepository;
import com.zyra.trading.util.CryptoUtil;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class IntegrationService {

    private final BinanceConfigRepository repository;
    private final BinanceService binanceService;

    public IntegrationService(BinanceConfigRepository repository, BinanceService binanceService) {
        this.repository = repository;
        this.binanceService = binanceService;
    }

    public void saveBinanceConfig(BinanceConfigRequest request) {
        try {
            BinanceConfig config = new BinanceConfig();

            config.setApiKey(request.getApiKey());
            config.setSecretKey(CryptoUtil.encrypt(request.getSecretKey()));
            config.setLabel(request.getLabel());
            config.setReadOnly(request.isReadOnly());

            repository.save(config);

        } catch (Exception e) {
            throw new RuntimeException("Encryption failed");
        }
    }

    public BinanceConfigResponse getBinanceConfig() {
        BinanceConfig config = repository.findTopByOrderByIdDesc();

        if (config == null) {
            return null;
        }

        return new BinanceConfigResponse(
                config.getApiKey(),
                config.getLabel(),
                config.isReadOnly()
        );
    }

    public boolean validateKeys(BinanceConfigRequest request) {
        try {
            Map<String, String> params = new HashMap<>();

            binanceService.getSignedWithKeys(
                    "/api/v3/account",
                    params,
                    request.getApiKey(),
                    request.getSecretKey(),
                    String.class
            ).block();

            return true; // if success

        } catch (Exception e) {
            return false;
        }
    }
}
