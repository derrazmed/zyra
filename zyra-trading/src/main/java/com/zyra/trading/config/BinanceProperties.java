package com.zyra.trading.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Strongly-typed binding for all binance.* properties in application.yml.
 * Using @ConfigurationProperties over @Value for cleaner, testable config.
 */
@Data
@ConfigurationProperties(prefix = "binance")
public class BinanceProperties {

    private Api api = new Api();
    private Websocket websocket = new Websocket();

    @Data
    public static class Api {
        private String baseUrl;
        private String key;
        private String secret;
        private long recvWindow = 5000;
        private Timeout timeout = new Timeout();

        @Data
        public static class Timeout {
            private int connect = 5000;
            private int read = 10000;
        }
    }

    @Data
    public static class Websocket {
        private String baseUrl;
    }
}
