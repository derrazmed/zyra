package com.zyra.trading.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class BinanceConfig {

    @Id
    @GeneratedValue
    private Long id;

    private String apiKey;

    private String secretKey; // encrypted

    private String label;

    private boolean readOnly;
}
