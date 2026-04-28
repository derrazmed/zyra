package com.zyra.trading.dto.request;

import lombok.Data;

@Data
public class BinanceConfigRequest {

    private String apiKey;
    private String secretKey;
    private String label;
    private boolean readOnly;
}
