package com.zyra.trading.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Configures a WebClient instance pointing at the Binance Testnet.
 *
 * Design decisions:
 * - ReactorClientHttpConnector wraps Netty's HttpClient for full timeout control.
 * - Two ExchangeFilterFunctions provide request/response logging without coupling
 *   business logic to log statements.
 * - API key header is NOT set here because public endpoints don't need it;
 *   BinanceService adds X-MBX-APIKEY only for authenticated calls.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class WebClientConfig {

    private final BinanceProperties properties;

    @Bean
    public WebClient binanceWebClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS,
                        properties.getApi().getTimeout().getConnect())
                .responseTimeout(Duration.ofMillis(
                        properties.getApi().getTimeout().getRead()))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(
                                properties.getApi().getTimeout().getRead(),
                                TimeUnit.MILLISECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(
                                properties.getApi().getTimeout().getConnect(),
                                TimeUnit.MILLISECONDS)));

        return WebClient.builder()
                .baseUrl(properties.getApi().getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE,
                        MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT,
                        MediaType.APPLICATION_JSON_VALUE)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .filter(logRequest())
                .filter(logResponse())
                .build();
    }

    /**
     * Logs method, URL, and all headers before sending the request.
     * In production you would strip sensitive headers (e.g. X-MBX-APIKEY).
     */
    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(req -> {
            log.debug("→ {} {}", req.method(), req.url());
            req.headers().forEach((name, values) ->
                    values.forEach(v -> log.debug("  Header: {}={}", name, v)));
            return Mono.just(req);
        });
    }

    /**
     * Logs HTTP status after each response arrives.
     */
    private ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(res -> {
            log.debug("← HTTP {}", res.statusCode());
            return Mono.just(res);
        });
    }
}
