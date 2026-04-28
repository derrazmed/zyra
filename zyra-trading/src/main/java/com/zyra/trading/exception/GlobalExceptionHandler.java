package com.zyra.trading.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Centralised error handler.
 * Every exception thrown from any controller or service lands here.
 * Produces a consistent JSON envelope so the frontend always knows what to expect.
 *
 * Response shape:
 * {
 *   "timestamp": "2024-04-24T10:00:00Z",
 *   "status": 400,
 *   "errorCode": "VALIDATION_ERROR",
 *   "message": "...",
 *   "details": { ... }   // optional
 * }
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Domain exceptions ───────────────────────────────────────────────────

    @ExceptionHandler(TradingException.class)
    public ResponseEntity<ErrorResponse> handleTradingException(TradingException ex) {
        log.warn("Trading exception [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return buildResponse(ex.getStatus(), ex.getErrorCode(), ex.getMessage(), null);
    }

    @ExceptionHandler(BinanceApiException.class)
    public ResponseEntity<ErrorResponse> handleBinanceApiException(BinanceApiException ex) {
        log.error("Binance API error [{}]: {}", ex.getErrorCode(), ex.getMessage());
        return buildResponse(ex.getStatus(), ex.getErrorCode(), ex.getMessage(), null);
    }

    // ── Validation exceptions ───────────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(err -> {
            String field = (err instanceof FieldError fe) ? fe.getField() : err.getObjectName();
            fieldErrors.put(field, err.getDefaultMessage());
        });
        return buildResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "Request validation failed", fieldErrors);
    }

    @ExceptionHandler(WebExchangeBindException.class)
    public ResponseEntity<ErrorResponse> handleWebFluxValidation(WebExchangeBindException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(err -> {
            String field = (err instanceof FieldError fe) ? fe.getField() : err.getObjectName();
            fieldErrors.put(field, err.getDefaultMessage());
        });
        return buildResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "Request validation failed", fieldErrors);
    }

    // ── Catch-all ───────────────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "An unexpected error occurred", null);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private ResponseEntity<ErrorResponse> buildResponse(
            HttpStatus status, String errorCode, String message, Object details) {

        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                status.value(),
                errorCode,
                message,
                details);
        return ResponseEntity.status(status).body(body);
    }

    public record ErrorResponse(
            String timestamp,
            int status,
            String errorCode,
            String message,
            Object details) {}
}
