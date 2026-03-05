---
name: mirra-hypertrade
description: "Use Mirra to hyperliquid dex integration for perpetual futures trading. Covers all Hypertrade SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Hypertrade

Hyperliquid DEX integration for perpetual futures trading

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/hypertrade/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `placeOrder` | Place an order on Hyperliquid DEX. Returns a pending order for the user to sign in delegated mode... |
| `cancelOrder` | Cancel an open order on Hyperliquid DEX. Can cancel by orderId, clientOrderId, or cancel all orde... |
| `getPositions` | Get current perpetual positions for a wallet. Returns normalized FLAT array of positions with ass... |
| `getOpenOrders` | Get open orders for a wallet. Returns normalized FLAT array of orders. |
| `getBalances` | Get account balances including perp margin and spot balances. Returns normalized FLAT structure. |
| `getMarketInfo` | Get market information for perpetual assets. Returns normalized FLAT array of market info. If ass... |
| `getOrderbook` | Get the L2 orderbook for an asset. Returns normalized FLAT structure with bids and asks arrays. |
| `getCandles` | Get candlestick/OHLCV data for an asset. Returns normalized FLAT array of candles. |
| `setLeverage` | Set leverage for an asset on Hyperliquid. Returns a pending action for the user to sign. |
| `getTradeHistory` | Get trade fill history for a wallet. Returns normalized FLAT array of trades. |

## Operation Details

### `placeOrder`

Place an order on Hyperliquid DEX. Returns a pending order for the user to sign in delegated mode, or submits directly in standard mode. FLAT response.

**Arguments:**

- `asset` (string, **required**): Asset/coin symbol (e.g. "ETH", "BTC")
- `isBuy` (boolean, **required**): True for long/buy, false for short/sell
- `size` (number, **required**): Order size in asset units
- `limitPrice` (number, *optional*): Limit price (required for limit orders)
- `orderType` (string, *optional*): Order type: "limit" or "market" (default: "market")
- `triggerPrice` (number, *optional*): Trigger price for stop/take-profit orders
- `reduceOnly` (boolean, *optional*): Whether order can only reduce position (default: false)
- `postOnly` (boolean, *optional*): Whether order should only be maker (default: false)
- `clientOrderId` (string, *optional*): Custom client order ID for tracking

**Returns:**

`AdapterOperationResult`: Returns pending order details. FLAT structure.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/hypertrade/placeOrder" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"asset":"<value>","isBuy":true,"size":10}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `cancelOrder`

Cancel an open order on Hyperliquid DEX. Can cancel by orderId, clientOrderId, or cancel all orders for an asset.

**Arguments:**

- `asset` (string, **required**): Asset/coin symbol (e.g. "ETH", "BTC")
- `orderId` (number, *optional*): Order ID to cancel
- `clientOrderId` (string, *optional*): Client order ID to cancel
- `cancelAll` (boolean, *optional*): Cancel all orders for this asset (default: false)

**Returns:**

`AdapterOperationResult`: Returns cancellation result. FLAT structure.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/hypertrade/cancelOrder" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"asset":"<value>"}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `getPositions`

Get current perpetual positions for a wallet. Returns normalized FLAT array of positions with asset, size, entryPrice, markPrice, unrealizedPnl, leverage, liquidationPrice, marginUsed, positionValue, returnOnEquity, side.

**Arguments:**

- `walletAddress` (string, *optional*): EVM wallet address (uses context wallet if not provided)

**Returns:**

`AdapterOperationResult`: Returns { positions[] }. Each position has FLAT fields. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/hypertrade/getPositions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getOpenOrders`

Get open orders for a wallet. Returns normalized FLAT array of orders.

**Arguments:**

- `walletAddress` (string, *optional*): EVM wallet address (uses context wallet if not provided)
- `asset` (string, *optional*): Filter by asset/coin symbol

**Returns:**

`AdapterOperationResult`: Returns { orders[] }. Each order has FLAT fields: asset, orderId, side, size, originalSize, price, orderType, reduceOnly, timestamp, triggerCondition, triggerPrice, isTrigger. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/hypertrade/getOpenOrders" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getBalances`

Get account balances including perp margin and spot balances. Returns normalized FLAT structure.

**Arguments:**

- `walletAddress` (string, *optional*): EVM wallet address (uses context wallet if not provided)

**Returns:**

`AdapterOperationResult`: Returns { accountValue, totalMarginUsed, withdrawable, perpEquity, spotBalances[] }. Each spotBalance has FLAT fields: coin, total, hold, available. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/hypertrade/getBalances" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getMarketInfo`

Get market information for perpetual assets. Returns normalized FLAT array of market info. If asset is provided, returns only that asset.

**Arguments:**

- `asset` (string, *optional*): Specific asset/coin symbol to get info for (returns all if omitted)

**Returns:**

`AdapterOperationResult`: Returns { markets[] }. Each market has FLAT fields: asset, markPrice, midPrice, oraclePrice, openInterest, funding, dayVolume, prevDayPrice, maxLeverage, szDecimals. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/hypertrade/getMarketInfo" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getOrderbook`

Get the L2 orderbook for an asset. Returns normalized FLAT structure with bids and asks arrays.

**Arguments:**

- `asset` (string, **required**): Asset/coin symbol (e.g. "ETH", "BTC")
- `depth` (number, *optional*): Number of levels to return (default: all)

**Returns:**

`AdapterOperationResult`: Returns { asset, bids[], asks[], spread, midPrice, timestamp }. Each level has FLAT fields: price, size, numOrders. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/hypertrade/getOrderbook" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"asset":"<value>"}' | jq .
```

### `getCandles`

Get candlestick/OHLCV data for an asset. Returns normalized FLAT array of candles.

**Arguments:**

- `asset` (string, **required**): Asset/coin symbol (e.g. "ETH", "BTC")
- `interval` (string, *optional*): Candle interval (e.g. "1m", "5m", "1h", "1d"). Default: "1h"
- `startTime` (number, *optional*): Start time in milliseconds (default: 24h ago)
- `endTime` (number, *optional*): End time in milliseconds (default: now)
- `limit` (number, *optional*): Max number of candles to return

**Returns:**

`AdapterOperationResult`: Returns { asset, interval, candles[] }. Each candle has FLAT fields: timestamp, open, high, low, close, volume, numTrades. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/hypertrade/getCandles" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"asset":"<value>"}' | jq .
```

### `setLeverage`

Set leverage for an asset on Hyperliquid. Returns a pending action for the user to sign.

**Arguments:**

- `asset` (string, **required**): Asset/coin symbol (e.g. "ETH", "BTC")
- `leverage` (number, **required**): Leverage multiplier (e.g. 5 for 5x)
- `isCrossMargin` (boolean, *optional*): Use cross margin (default: true). False for isolated margin.

**Returns:**

`AdapterOperationResult`: Returns leverage update result. FLAT structure.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/hypertrade/setLeverage" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"asset":"<value>","leverage":10}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `getTradeHistory`

Get trade fill history for a wallet. Returns normalized FLAT array of trades.

**Arguments:**

- `walletAddress` (string, *optional*): EVM wallet address (uses context wallet if not provided)
- `asset` (string, *optional*): Filter by asset/coin symbol
- `limit` (number, *optional*): Max number of trades to return

**Returns:**

`AdapterOperationResult`: Returns { trades[] }. Each trade has FLAT fields: asset, tradeId, orderId, side, price, size, fee, feeToken, closedPnl, timestamp, direction, crossed, hash. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/hypertrade/getTradeHistory" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

## Response Format

All SDK responses return the operation payload wrapped in a standard envelope:

```json
{
  "success": true,
  "data": { ... }
}
```

The `data` field contains the operation result. Error responses include:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Tips

- Use `jq .` to pretty-print responses, `jq .data` to extract just the payload
- For list operations, results are in `data.results` or directly in `data` (check examples)
- Pass `--fail-with-body` to curl to see error details on HTTP failures
- Store the API key in a variable: `export API_KEY="your-key"`
