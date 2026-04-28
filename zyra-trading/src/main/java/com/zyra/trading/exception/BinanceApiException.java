package com.zyra.trading.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when Binance returns a non-2xx response or a JSON error body.
 * The Binance error body looks like: {"code":-1121,"msg":"Invalid symbol."}
 */
public class BinanceApiException extends TradingException {

    public BinanceApiException(String message) {
        super(message, HttpStatus.BAD_GATEWAY, "BINANCE_API_ERROR");
    }

    public BinanceApiException(String message, Throwable cause) {
        super(message, HttpStatus.BAD_GATEWAY, "BINANCE_API_ERROR", cause);
    }

    public BinanceApiException(int binanceCode, String binanceMsg) {
        super("Binance API error [" + binanceCode + "]: " + binanceMsg,
                HttpStatus.BAD_GATEWAY, "BINANCE_" + Math.abs(binanceCode));
    }
}
