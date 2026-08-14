# TarshishDEX API Reference

Base URL: `https://tarshishdex.vercel.app/api`

All responses are JSON. Rate limit: 100 requests per 60 seconds per IP.
Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Health

### `GET /api/health`

Returns service health status.

**Response 200**:
```json
{
  "status": "ok",
  "service": "tarshishdex",
  "timestamp": 1700000000000,
  "uptime": 3600
}
```

---

## Swap

### `GET /api/swap/quote`

Get a swap quote comparing direct orderbook, multi-hop bridge, and path-finding routes.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `input` | string | ✅ | Asset: `XLM` or `CODE:ISSUER` |
| `output` | string | ✅ | Asset: `XLM` or `CODE:ISSUER` |
| `amount` | string | ✅ | Positive decimal amount of input asset |
| `slippage` | number | ❌ | Slippage percentage (default 1, max 50) |

**Response 200**:
```json
{
  "path": [{"code": "XLM", "isNative": true}, {"code": "USDC", "issuer": "GA5Z..."}],
  "sourceAmount": "100",
  "outputAmount": "12.3456789",
  "executionPrice": 0.123456789,
  "priceImpactPct": 0.05,
  "minReceived": "12.2222221",
  "feeEstimateXlm": "0.00001",
  "slippagePct": 1,
  "method": "direct",
  "warnings": []
}
```

> **Formatting**: `priceImpactPct` is rounded to 2 decimal places. `minReceived` and `feeEstimateXlm` are decimal strings normalized to at most 7 decimal places (Stellar's standard), with trailing zeros trimmed.

**Response 400**: Invalid or missing parameters.
**Response 502**: Horizon/Soroban RPC unreachable.

---

## Markets

### `GET /api/market/orderbook`

Fetch orderbook depth for a trading pair.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `selling` | string | ✅ | Asset being sold |
| `buying` | string | ✅ | Asset being bought |
| `limit` | number | ❌ | Number of levels (default 20, max 200) |

**Response 200**:
```json
{
  "base": {"code": "XLM", "isNative": true},
  "counter": {"code": "USDC", "issuer": "GA5Z..."},
  "bids": [{"price": 0.125, "amount": 1000, "value": 125}],
  "asks": [{"price": 0.126, "amount": 500, "value": 63}],
  "bestBid": 0.125,
  "bestAsk": 0.126,
  "midPrice": 0.1255,
  "spreadPct": 0.8
}
```

### `GET /api/market/stats`

Get market statistics for top assets.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `limit` | number | ❌ | Number of assets (default 20, max 200) |

**Response 200**:
```json
{
  "count": 10,
  "stats": [
    {
      "token": {"code": "XLM", "isNative": true},
      "price": 0.125,
      "volume24h": 500000,
      "change24h": 2.5
    }
  ]
}
```

### `GET /api/market/candles`

Fetch OHLCV candle data for charts.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `base` | string | ✅ | Base asset |
| `counter` | string | ✅ | Counter asset |
| `resolution` | number | ❌ | Candle width in ms (default 3600000 = 1h) |
| `range` | number | ❌ | Lookback in ms (default 86400000 = 1d) |

Valid resolutions: `60000` (1m), `300000` (5m), `900000` (15m), `3600000` (1h),
`14400000` (4h), `86400000` (1d).

**Response 200**:
```json
{
  "candles": [
    {
      "timestamp": 1700000000000,
      "open": 0.125,
      "high": 0.130,
      "low": 0.124,
      "close": 0.128,
      "volume": 15000
    }
  ]
}
```

### `GET /api/market/pools`

Fetch liquidity pools for a pair.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `base` | string | ✅ | Base asset |
| `counter` | string | ✅ | Counter asset |

---

## Assets

### `GET /api/assets`

Browse assets on the network.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `limit` | number | ❌ | Number of assets (default 24, max 200) |
| `code` | string | ❌ | Filter by asset code |
| `issuer` | string | ❌ | Filter by issuer |

**Response 200**:
```json
{
  "count": 5,
  "assets": [
    {
      "token": {"code": "USDC", "issuer": "GA5Z..."},
      "supply": 50000000,
      "accounts": 1250,
      "trustlines": 1500,
      "flags": {"authRequired": false, "authRevocable": true, "authImmutable": false}
    }
  ]
}
```

---

## Orders

### `GET /api/orders`

Query limit orders. Without `user`, returns global count.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | string | ❌ | Stellar address for user-specific orders |
| `limit` | number | ❌ | Page size (default 20) |
| `cursor` | number | ❌ | Pagination cursor |

**Response 200 (global)**:
```json
{
  "count": 42
}
```

**Response 200 (user-specific)**:
```json
{
  "orders": [
    {
      "id": 1,
      "owner": "GABC...",
      "base": "XLM",
      "counter": "USDC",
      "price": 0.125,
      "amount": 100,
      "side": "sell",
      "expiryLedger": 0,
      "placedAt": 1700000000
    }
  ]
}
```

### `POST /api/orders`

Place a new limit order.

```json
{
  "base": {"code": "XLM", "isNative": true},
  "counter": {"code": "USDC", "issuer": "GA5Z..."},
  "price": 0.125,
  "amount": 100,
  "side": "sell",
  "expiryLedger": 0
}
```

**Response 200**: `{ "xdr": "...", "orderId": 1 }`

### `DELETE /api/orders`

Cancel or mark a limit order as executed.

```json
{
  "id": 1,
  "userAddress": "GABC...",
  "txHash": "abc123..."
}
```

---

## Portfolio

### `GET /api/portfolio/:address`

Get portfolio summary for an address.

**Response 200**:
```json
{
  "address": "GABC...",
  "balances": [
    {"token": {"code": "XLM", "isNative": true}, "balance": "100.0", "valueInXlm": 100}
  ],
  "totalValueXlm": 150
}
```

**Response 400**: Invalid address format.

### `GET /api/trades/:address`

Get trade history for an address.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `limit` | number | ❌ | Number of entries (default 40) |

**Response 200**:
```json
{
  "entries": [
    {
      "id": "tx-hash",
      "type": "swap",
      "timestamp": 1700000000,
      "summary": "Swapped 100 XLM for 12.5 USDC"
    }
  ]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Human-readable error message"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Invalid parameters |
| 404 | Route or resource not found |
| 429 | Rate limit exceeded |
| 502 | Upstream service (Horizon/RPC) unreachable |
