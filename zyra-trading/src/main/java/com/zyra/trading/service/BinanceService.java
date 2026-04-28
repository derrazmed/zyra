package com.zyra.trading.service;

import com.zyra.trading.config.BinanceProperties;
import com.zyra.trading.exception.BinanceApiException;
import com.zyra.trading.model.BinanceConfig;
import com.zyra.trading.repository.BinanceConfigRepository;
import com.zyra.trading.security.BinanceSigner;
import com.zyra.trading.util.CryptoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Core HTTP communication layer for the Binance API.
 *
 * Every outbound HTTP call flows through this class.  Higher-level services
 * (MarketService, AccountService, OrderService) call the helper methods below
 * rather than touching WebClient directly.
 *
 * Two overloads exist per HTTP verb:
 *   - Class<T> responseType              — simple types  (e.g. Order.class)
 *   - ParameterizedTypeReference<T>      — generic types (e.g. List<Order>)
 *
 * ── How signing works (mandatory for SIGNED endpoints) ──────────────────────
 *
 *  Step 1  Caller builds baseParams:
 *            "symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.001"
 *
 *  Step 2  BinanceSigner appends timestamp + recvWindow:
 *            "...&timestamp=1713960000000&recvWindow=5000"
 *
 *  Step 3  BinanceSigner computes HMAC-SHA256 of step-2 string using the
 *          secret key, encodes result as lowercase hex.
 *
 *  Step 4  "&signature=<hex>" is appended to the query string.
 *
 *  Step 5  "X-MBX-APIKEY: <api-key>" is added as an HTTP header.
 *          The API key identifies who you are; the signature proves you own
 *          the secret and the payload was not tampered with.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BinanceService {

    /** Package-private so MarketService can use it for ParameterizedTypeReference calls. */
    final WebClient binanceWebClient;

    private final BinanceConfigRepository repository;

    // ── Public (unsigned) GET ────────────────────────────────────────────────

    public <T> Mono<T> getPublic(String path, String queryString, Class<T> responseType) {
        String uri = queryString.isBlank() ? path : path + "?" + queryString;
        log.debug("PUBLIC GET {}", uri);
        return binanceWebClient.get()
                .uri(uri)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        this::handleClientError)
                .bodyToMono(responseType);
    }

    public <T> Mono<T> getPublic(String path, String queryString,
                                  ParameterizedTypeReference<T> ref) {
        String uri = queryString.isBlank() ? path : path + "?" + queryString;
        log.debug("PUBLIC GET {}", uri);
        return binanceWebClient.get()
                .uri(uri)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        this::handleClientError)
                .bodyToMono(ref);
    }

    // ── Signed GET ───────────────────────────────────────────────────────────

    public <T> Mono<T> getSigned(String path, Map<String, String> params, Class<T> responseType) {

        BinanceConfig config = repository.findTopByOrderByIdDesc();
        if (config == null) throw new RuntimeException("Binance not configured");

        String apiKey = config.getApiKey();
        String secretKey = CryptoUtil.decrypt(config.getSecretKey());

        params.put("timestamp", String.valueOf(System.currentTimeMillis()));
        params.put("recvWindow", "5000");

        String queryString = params.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&"));

        String signature = signWithSecret(queryString, secretKey);

        return binanceWebClient.get()
                .uri(uriBuilder -> {
                    uriBuilder.path(path);
                    params.forEach(uriBuilder::queryParam);
                    uriBuilder.queryParam("signature", signature);
                    return uriBuilder.build();
                })
                .header("X-MBX-APIKEY", apiKey)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        this::handleClientError)
                .bodyToMono(responseType);
    }

    public <T> Mono<T> getSigned(String path, String baseParams,
                                 ParameterizedTypeReference<T> ref) {

        BinanceConfig config = repository.findTopByOrderByIdDesc();
        if (config == null) throw new RuntimeException("Binance not configured");

        String apiKey = config.getApiKey();
        String secretKey = CryptoUtil.decrypt(config.getSecretKey());

        String paramsWithTime = (baseParams == null || baseParams.isBlank())
                ? "timestamp=" + System.currentTimeMillis() + "&recvWindow=5000"
                : baseParams + "&timestamp=" + System.currentTimeMillis() + "&recvWindow=5000";

        String signature = signWithSecret(paramsWithTime, secretKey);

        String finalQuery = paramsWithTime + "&signature=" + signature;

        return binanceWebClient.get()
                .uri(path + "?" + finalQuery)
                .header("X-MBX-APIKEY", apiKey)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        this::handleClientError)
                .bodyToMono(ref);
    }

    // ── Signed POST ──────────────────────────────────────────────────────────

    public <T> Mono<T> postSigned(String path, String baseParams, Class<T> responseType) {

        BinanceConfig config = repository.findTopByOrderByIdDesc();
        if (config == null) throw new RuntimeException("Binance not configured");

        String apiKey = config.getApiKey();
        String secretKey = CryptoUtil.decrypt(config.getSecretKey());

        String paramsWithTime = (baseParams == null || baseParams.isBlank())
                ? "timestamp=" + System.currentTimeMillis() + "&recvWindow=5000"
                : baseParams + "&timestamp=" + System.currentTimeMillis() + "&recvWindow=5000";

        String signature = signWithSecret(paramsWithTime, secretKey);

        String signedBody = paramsWithTime + "&signature=" + signature;

        return binanceWebClient.post()
                .uri(path)
                .header("X-MBX-APIKEY", apiKey)
                .bodyValue(signedBody)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        this::handleClientError)
                .bodyToMono(responseType);
    }

    // ── Signed DELETE ────────────────────────────────────────────────────────

    public <T> Mono<T> deleteSigned(String path, String baseParams, Class<T> responseType) {

        BinanceConfig config = repository.findTopByOrderByIdDesc();
        if (config == null) throw new RuntimeException("Binance not configured");

        String apiKey = config.getApiKey();
        String secretKey = CryptoUtil.decrypt(config.getSecretKey());

        String paramsWithTime = (baseParams == null || baseParams.isBlank())
                ? "timestamp=" + System.currentTimeMillis() + "&recvWindow=5000"
                : baseParams + "&timestamp=" + System.currentTimeMillis() + "&recvWindow=5000";

        String signature = signWithSecret(paramsWithTime, secretKey);

        String finalQuery = paramsWithTime + "&signature=" + signature;

        return binanceWebClient.delete()
                .uri(path + "?" + finalQuery)
                .header("X-MBX-APIKEY", apiKey)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        this::handleClientError)
                .bodyToMono(responseType);
    }

    // ── Error handling ───────────────────────────────────────────────────────

    private Mono<Throwable> handleClientError(ClientResponse response) {
        return response.bodyToMono(BinanceErrorBody.class)
                .defaultIfEmpty(new BinanceErrorBody(0, "Unknown Binance error"))
                .map(err -> {
                    log.error("Binance HTTP {} → code={} msg={}",
                            response.statusCode(), err.code(), err.msg());
                    return (Throwable) new BinanceApiException(err.code(), err.msg());
                });
    }

    private record BinanceErrorBody(int code, String msg) {}

    public <T> Mono<T> getSignedWithKeys(
            String path,
            Map<String, String> params,
            String apiKey,
            String secretKey,
            Class<T> responseType
    ) {

        params.put("timestamp", String.valueOf(System.currentTimeMillis()));
        params.put("recvWindow", "5000");

        String queryString = params.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&"));

        String signature = signWithSecret(queryString, secretKey);

        return binanceWebClient.get()
                .uri(uriBuilder -> {
                    uriBuilder.path(path);
                    params.forEach(uriBuilder::queryParam);
                    uriBuilder.queryParam("signature", signature);
                    return uriBuilder.build();
                })
                .header("X-MBX-APIKEY", apiKey)
                .retrieve()
                .bodyToMono(responseType);
    }

    private String signWithSecret(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
            mac.init(secretKey);

            byte[] raw = mac.doFinal(data.getBytes());
            return bytesToHex(raw);

        } catch (Exception e) {
            throw new RuntimeException("Signing failed");
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }

    private BinanceConfig loadConfig() {
        BinanceConfig config = repository.findTopByOrderByIdDesc();

        if (config == null) {
            throw new RuntimeException("Binance not configured");
        }

        return config;
    }
}
