package com.zyra.trading.dto.response;

import lombok.Data;

@Data
public class BinanceConfigResponse {

    private String apiKey;
    private String label;
    private boolean readOnly;

    public BinanceConfigResponse(String apiKey, String label, boolean readOnly) {
        this.apiKey = apiKey;
        this.label = label;
        this.readOnly = readOnly;
    }

    // getters
}
