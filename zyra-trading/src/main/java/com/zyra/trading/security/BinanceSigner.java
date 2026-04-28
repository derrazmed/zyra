package com.zyra.trading.security;

import com.zyra.trading.config.BinanceProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

/**
 * HMAC-SHA256 Signer for Binance signed endpoints.
 *
 * ══════════════════════════════════════════════════════════
 * How Binance Authentication Works (IMPORTANT)
 * ══════════════════════════════════════════════════════════
 *
 * 1. Build the query string from ALL parameters, including:
 *      symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.001
 *      &timestamp=1713960000000&recvWindow=5000
 *
 * 2. Sign the ENTIRE query string using HMAC-SHA256 with
 *    your secret key. The result is a hex-encoded string.
 *
 * 3. Append &signature=<hex> to the query string.
 *
 * 4. Add the API key as an HTTP header:
 *      X-MBX-APIKEY: <your-api-key>
 *
 * The signature IS NOT the API key. The API key identifies WHO you are;
 * the signature proves you have the secret and the request wasn't tampered with.
 *
 * ══════════════════════════════════════════════════════════
 * Security Notes
 * ══════════════════════════════════════════════════════════
 * - The Mac instance is NOT thread-safe; we create a new one per call.
 * - The secret key is never logged; we only log the resulting signature.
 * - recvWindow limits the age of a request (default 5 seconds). Any
 *   request whose timestamp is more than recvWindow ms old is rejected
 *   by Binance to prevent replay attacks.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BinanceSigner {

    private static final String ALGORITHM = "HmacSHA256";

    private final BinanceProperties properties;

    /**
     * Generates an HMAC-SHA256 hex signature for the given query string.
     *
     * @param queryString the raw query string (without leading '?')
     *                    e.g. "symbol=BTCUSDT&timestamp=1713960000000"
     * @return lowercase hex-encoded HMAC-SHA256 digest
     */
    public String sign(String queryString) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(
                    properties.getApi().getSecret().getBytes(StandardCharsets.UTF_8),
                    ALGORITHM);
            mac.init(keySpec);

            byte[] rawHmac = mac.doFinal(
                    queryString.getBytes(StandardCharsets.UTF_8));

            String signature = HexFormat.of().formatHex(rawHmac);
            log.debug("Signed query '{}' → signature={}", queryString, signature);
            return signature;

        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate HMAC-SHA256 signature", e);
        }
    }

    /**
     * Returns the current epoch milliseconds to be used as the 'timestamp' parameter.
     * This timestamp is included in the query string BEFORE signing.
     */
    public long currentTimestamp() {
        return System.currentTimeMillis();
    }

    /**
     * Convenience: builds the final signed query string by appending
     * timestamp, recvWindow, and the resulting signature.
     *
     * @param baseParams existing key=value pairs joined with '&', without timestamp
     * @return complete signed query string ready to be appended after '?'
     *
     * Example input:  "symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.001"
     * Example output: "symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.001
     *                  &timestamp=1713960000000&recvWindow=5000
     *                  &signature=3b4f2..."
     */
    public String buildSignedQueryString(String baseParams) {
        String withTimestamp = baseParams
                + "&timestamp=" + currentTimestamp()
                + "&recvWindow=" + properties.getApi().getRecvWindow();

        String signature = sign(withTimestamp);
        return withTimestamp + "&signature=" + signature;
    }
}
