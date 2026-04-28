# Zyra Trading Platform — Binance Spot Testnet Backend

A production-structured Spring Boot backend that integrates with the
[Binance Spot Testnet](https://testnet.binance.vision) to simulate trading operations.

---

## Project Structure

```
src/main/java/com/zyra/trading/
├── ZyraTradingApplication.java          Entry point
│
├── config/
│   ├── BinanceProperties.java           Typed config binding (binance.* in application.yml)
│   └── WebClientConfig.java             WebClient bean with timeouts + request/response logging
│
├── security/
│   └── BinanceSigner.java               HMAC-SHA256 signature generation
│
├── service/
│   ├── BinanceService.java              Core HTTP layer (public + signed GET/POST/DELETE)
│   ├── MarketService.java               Public market data
│   ├── AccountService.java              Signed account endpoints
│   └── OrderService.java                Signed trading + in-memory trade log
│
├── controller/
│   ├── MarketController.java            GET /market/*
│   ├── AccountController.java           GET /account/*
│   ├── OrderController.java             POST/DELETE /order/*
│   └── StreamController.java            POST/DELETE/GET /stream/*
│
├── model/
│   ├── Order.java
│   ├── Balance.java
│   └── Trade.java
│
├── dto/
│   ├── request/
│   │   ├── MarketOrderRequest.java
│   │   └── LimitOrderRequest.java
│   └── response/
│       ├── TickerPriceResponse.java
│       ├── OrderBookResponse.java
│       └── AccountResponse.java
│
├── exception/
│   ├── TradingException.java
│   ├── BinanceApiException.java
│   └── GlobalExceptionHandler.java
│
└── websocket/
    └── BinanceWebSocketClient.java      Live price streaming
```

---

## How Binance Authentication Works

This is the most important concept in the codebase. Read this carefully.

### The Two Credentials

| Credential | Where it goes | Purpose |
|---|---|---|
| `API Key` | HTTP header `X-MBX-APIKEY` | Identifies *who* you are |
| `Secret Key` | Used to generate signature (never sent!) | Proves the request wasn't tampered |

### Signing Step-by-Step

**Example: Get account info**

**Step 1 — Build base parameters**
```
(empty string — no parameters besides auth)
```

**Step 2 — BinanceSigner appends timestamp + recvWindow**
```
timestamp=1713960000000&recvWindow=5000
```

**Step 3 — Compute HMAC-SHA256 of step-2 string using your secret key**
```java
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(secretKey.getBytes(UTF_8), "HmacSHA256"));
byte[] raw = mac.doFinal(queryString.getBytes(UTF_8));
String signature = HexFormat.of().formatHex(raw);
// → "3b4f2a8c..."
```

**Step 4 — Append signature to query string**
```
timestamp=1713960000000&recvWindow=5000&signature=3b4f2a8c...
```

**Step 5 — Final HTTP request**
```
GET https://testnet.binance.vision/api/v3/account
    ?timestamp=1713960000000&recvWindow=5000&signature=3b4f2a8c...

Header: X-MBX-APIKEY: your-api-key
```

**Example: Place a market order**

```
base params:  symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.001
after signing: symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.001
               &timestamp=1713960000000&recvWindow=5000
               &signature=abc123...

POST /api/v3/order
Content-Type: application/x-www-form-urlencoded
X-MBX-APIKEY: your-api-key

Body: symbol=BTCUSDT&side=BUY&...&signature=abc123...
```

### Why `recvWindow`?

Binance rejects any request whose `timestamp` is more than `recvWindow` milliseconds
in the past. This prevents **replay attacks** — an attacker who captures your signed
request cannot replay it 10 minutes later. Default is 5000ms (5 seconds).

---

## Quick Start

### 1. Get Testnet Credentials

1. Visit [https://testnet.binance.vision](https://testnet.binance.vision)
2. Log in with GitHub
3. Click "Generate HMAC_SHA256 Key"
4. Copy the API Key and Secret Key

### 2. Configure `application.yml`

```yaml
binance:
  api:
    key: YOUR_TESTNET_API_KEY
    secret: YOUR_TESTNET_SECRET_KEY
```

### 3. Run

```bash
mvn spring-boot:run
# or
./mvnw spring-boot:run
```

The server starts on `http://localhost:8080/api`

---

## REST API Reference

### Market Data (Public — no auth needed)

```bash
# Get BTCUSDT price
curl http://localhost:8080/api/market/price?symbol=BTCUSDT

# Get order book (top 20 levels)
curl "http://localhost:8080/api/market/depth?symbol=BTCUSDT&limit=20"

# Get recent trades
curl "http://localhost:8080/api/market/trades?symbol=BTCUSDT&limit=10"
```

**Sample response — price:**
```json
{
  "symbol": "BTCUSDT",
  "price": 63750.00
}
```

**Sample response — depth:**
```json
{
  "lastUpdateId": 1234567,
  "bids": [["63749.99", "0.50"], ["63740.00", "1.20"]],
  "asks": [["63750.01", "0.30"], ["63760.00", "0.80"]],
  "bestBidPrice": 63749.99,
  "bestAskPrice": 63750.01,
  "midPrice": 63750.00,
  "spread": 0.02
}
```

---

### Account (Signed)

```bash
# Full account info
curl http://localhost:8080/api/account/info

# Non-zero balances only
curl http://localhost:8080/api/account/balance

# All open orders
curl http://localhost:8080/api/account/open-orders

# Open orders for one symbol
curl "http://localhost:8080/api/account/open-orders?symbol=BTCUSDT"
```

**Sample response — balance:**
```json
[
  { "asset": "BTC",  "free": "0.50000000", "locked": "0.00000000" },
  { "asset": "USDT", "free": "9850.00",    "locked": "150.00"     }
]
```

---

### Trading (Signed)

```bash
# Place a MARKET buy order
curl -X POST http://localhost:8080/api/order/market \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "side": "BUY",
    "quantity": 0.001
  }'

# Place a LIMIT sell order
curl -X POST http://localhost:8080/api/order/limit \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "side": "SELL",
    "quantity": 0.001,
    "price": 70000.00,
    "timeInForce": "GTC"
  }'

# Cancel an order
curl -X DELETE "http://localhost:8080/api/order/123456789?symbol=BTCUSDT"

# View in-memory trade log
curl http://localhost:8080/api/order/trade-log
```

---

### WebSocket Streams

```bash
# Subscribe to live BTCUSDT price updates (mini-ticker)
curl -X POST "http://localhost:8080/api/stream/subscribe?symbol=btcusdt&type=miniTicker"

# Subscribe to aggregate trades
curl -X POST "http://localhost:8080/api/stream/subscribe?symbol=btcusdt&type=aggTrade"

# Poll latest tick (if you don't want to hold a WebSocket yourself)
curl "http://localhost:8080/api/stream/latest?stream=btcusdt@miniTicker"

# Unsubscribe
curl -X DELETE "http://localhost:8080/api/stream/unsubscribe?stream=btcusdt@miniTicker"
```

**Sample miniTicker payload:**
```json
{
  "e": "24hrMiniTicker",
  "E": 1713960000000,
  "s": "BTCUSDT",
  "c": "63750.00",
  "o": "62000.00",
  "h": "64500.00",
  "l": "61800.00",
  "v": "1234.567",
  "q": "78901234.56"
}
```
Fields: `c`=close (current price), `o`=open, `h`=high, `l`=low, `v`=volume, `q`=quote volume

---

## Error Response Format

All errors use a consistent envelope:

```json
{
  "timestamp": "2024-04-24T10:00:00Z",
  "status": 400,
  "errorCode": "BINANCE_1121",
  "message": "Binance API error [-1121]: Invalid symbol."
}
```

Common Binance error codes:
- `-1100` Invalid characters in parameter
- `-1121` Invalid symbol
- `-1013` Filter failure (price/qty out of range)
- `-2010` New order rejected (insufficient balance)
- `-1022` Signature invalid (wrong secret key or clock skew)

---

## Architecture Decisions

### Why WebClient over RestTemplate?

WebClient is the modern reactive HTTP client. Even used in a blocking context
(`.block()` at the controller layer), it gives us:
- Non-blocking I/O at the connection level
- First-class reactive operators (`doOnNext`, `doOnError`, `map`, `flatMap`)
- Better composability for future async work

### Why `BinanceService` as a separate layer?

Every HTTP concern (headers, error parsing, signing) lives in one place.
`MarketService`, `AccountService`, and `OrderService` are pure business logic —
they describe *what* to fetch, not *how* to sign/send it.

### Why an in-memory trade log?

The `OrderService` maintains a circular buffer of the last 500 placed orders.
This is intentional: the Testnet prototype doesn't need a database for the trade
history feature. Replace with Redis or PostgreSQL for production.

---

## Production Hardening Checklist

- [ ] Move API keys to environment variables / Vault (never in source control)
- [ ] Add Spring Security to protect all signed endpoints
- [ ] Replace `.block()` with proper reactive chain (Spring WebFlux)
- [ ] Add rate-limit awareness (Binance limits: 1200 req/min on weight)
- [ ] Implement WebSocket auto-reconnect with exponential backoff
- [ ] Persist trade log to PostgreSQL / TimescaleDB
- [ ] Add Micrometer metrics + Prometheus scrape endpoint
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Handle partial fills and order state machine
