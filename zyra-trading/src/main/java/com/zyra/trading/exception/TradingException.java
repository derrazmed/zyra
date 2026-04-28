package com.zyra.trading.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base application exception that carries an HTTP status code.
 * All domain-specific exceptions should extend this class.
 */
@Getter
public class TradingException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public TradingException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public TradingException(String message, HttpStatus status, String errorCode, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.errorCode = errorCode;
    }
}
