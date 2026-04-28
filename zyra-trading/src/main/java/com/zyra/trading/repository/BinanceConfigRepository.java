package com.zyra.trading.repository;

import com.zyra.trading.model.BinanceConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BinanceConfigRepository extends JpaRepository<BinanceConfig, Long> {
    BinanceConfig findTopByOrderByIdDesc();
}
