---
name: mirra-polymarket
description: "Use Mirra to polymarket prediction market integration with builder program support. provides market discovery, clob trading via server-side signing with user approval thr.... Covers all Polymarket SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Polymarket

Polymarket prediction market integration with Builder program support. Provides market discovery, CLOB trading via server-side signing with user approval through ActionProposals, and position tracking. Trading operations create proposals requiring explicit user approval before server-signed execution.

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Polymarket requires OAuth authentication. The user must have connected their Polymarket account in the Mirra app before these operations will work.

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `getMarkets` | Search and list Polymarket prediction markets. Returns active and resolved markets with current p... |
| `getMarket` | Get detailed information for a specific Polymarket prediction market. Lookup by conditionId (the ... |
| `getEvents` | List Polymarket events, which are groups of related prediction markets. For example, a "2024 US E... |
| `getPrice` | Get the current price for a specific market outcome token on the Polymarket CLOB. The tokenId is ... |
| `getOrderbook` | Get the current orderbook depth for a market outcome token on the Polymarket CLOB. Returns sorted... |
| `placeOrder` | Creates an action proposal for user approval. Validates that CLOB credentials exist, fetches live... |
| `executeOrder` | Executes a previously approved order using server-stored CLOB credentials. Called automatically w... |
| `cancelOrder` | Creates an action proposal to cancel an existing order. Validates that CLOB credentials exist and... |
| `executeCancelOrder` | Executes a previously approved cancel using server-stored CLOB credentials. Called automatically ... |
| `refreshOrder` | Rebuild an expired order proposal with fresh market data. Use this when a pending order from plac... |
| `getOrders` | Get active orders for the authenticated user on the Polymarket CLOB. Returns open/pending orders ... |
| `getPositions` | Get current prediction market positions for the authenticated user. Shows all held outcome token ... |
| `getTrades` | Get trade history for the authenticated user. Returns completed trades with execution prices, siz... |
| `getBuilderLeaderboard` | Get the Polymarket Builder program leaderboard rankings. Shows top builders by volume and trade c... |
| `getBuilderVolume` | Get volume time-series data for the Builder program. Shows daily volume and trade count attribute... |
| `discoverExtended` | Search Polymarket API for available operations beyond core tools |
| `executeExtended` | Execute a Polymarket API operation by operationId |

## Operation Details

### `getMarkets`

Search and list Polymarket prediction markets. Returns active and resolved markets with current pricing, volume, and outcome data from the Gamma API. Use the query parameter to search by question text, or filter by category tag, active/closed status. Results are paginated.

**Arguments:**

- `query` (string, *optional*): Search query to filter markets by question text (matched against slug)
- `tag` (string, *optional*): Filter by category tag (e.g., "politics", "crypto", "sports", "science")
- `limit` (number, *optional*): Maximum number of markets to return (default: 25, max: 100)
- `offset` (number, *optional*): Offset for pagination (default: 0)
- `active` (boolean, *optional*): If true, return only active/open markets
- `closed` (boolean, *optional*): If true, return only closed/resolved markets

**Returns:**

`AdapterOperationResult`: Returns { markets[], count }. Each market has FLAT fields: id, conditionId, slug, question, description, category, endDate, active, closed, volume, volumeFormatted, liquidity, outcomes (string[]), outcomePrices (string[]), bestBid, bestAsk, lastTradePrice, imageUrl, eventSlug, eventTitle.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/getMarkets" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"tag":"politics","active":true,"limit":3}' | jq .
```

**Example response:**

```json
{
  "markets": [
    {
      "id": "0x1234...",
      "conditionId": "0xabcd...",
      "slug": "will-candidate-win-2024",
      "question": "Will Candidate X win the 2024 election?",
      "description": "Resolves YES if Candidate X wins.",
      "category": "politics",
      "endDate": "2024-11-05T00:00:00Z",
      "active": true,
      "closed": false,
      "volume": 5230000,
      "volumeFormatted": "5.23M",
      "liquidity": 420000,
      "outcomes": [
        "Yes",
        "No"
      ],
      "outcomePrices": [
        "0.62",
        "0.38"
      ],
      "bestBid": 0.61,
      "bestAsk": 0.63,
      "lastTradePrice": 0.62
    }
  ],
  "count": 1
}
```

### `getMarket`

Get detailed information for a specific Polymarket prediction market. Lookup by conditionId (the unique market identifier on the CTF contract) or by slug (the URL-friendly market name). Returns full market details including current pricing, volume, liquidity, and outcome probabilities.

**Arguments:**

- `conditionId` (string, *optional*): The condition ID of the market (hex string, e.g., "0xabc123...")
- `slug` (string, *optional*): The market slug (URL-friendly name, alternative to conditionId)

**Returns:**

`AdapterOperationResult`: Returns a single market with FLAT fields: id, conditionId, slug, question, description, category, endDate, active, closed, volume, volumeFormatted, liquidity, outcomes (string[]), outcomePrices (string[]), bestBid, bestAsk, lastTradePrice, imageUrl, eventSlug, eventTitle.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/getMarket" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"conditionId":"0xabcdef1234567890"}' | jq .
```

**Example response:**

```json
{
  "id": "0x1234...",
  "conditionId": "0xabcdef1234567890",
  "slug": "will-btc-reach-100k",
  "question": "Will Bitcoin reach $100k by end of 2024?",
  "description": "Resolves YES if BTC/USD reaches $100,000.",
  "category": "crypto",
  "endDate": "2024-12-31T23:59:59Z",
  "active": true,
  "closed": false,
  "volume": 12500000,
  "volumeFormatted": "12.5M",
  "liquidity": 890000,
  "outcomes": [
    "Yes",
    "No"
  ],
  "outcomePrices": [
    "0.45",
    "0.55"
  ],
  "bestBid": 0.44,
  "bestAsk": 0.46,
  "lastTradePrice": 0.45
}
```

### `getEvents`

List Polymarket events, which are groups of related prediction markets. For example, a "2024 US Election" event may contain multiple markets for different races. Events include aggregated volume/liquidity and a list of child markets with their individual outcome prices.

**Arguments:**

- `tag` (string, *optional*): Filter by category tag (e.g., "politics", "crypto", "sports")
- `limit` (number, *optional*): Maximum number of events to return (default: 25, max: 100)
- `offset` (number, *optional*): Offset for pagination (default: 0)
- `active` (boolean, *optional*): If true, return only active events
- `closed` (boolean, *optional*): If true, return only closed/resolved events

**Returns:**

`AdapterOperationResult`: Returns { events[], count }. Each event has FLAT fields: id, slug, title, description, category, startDate, endDate, active, closed, marketCount, markets[] (each with id, question, outcomes, outcomePrices, active), volume, liquidity.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/getEvents" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"active":true,"limit":2}' | jq .
```

**Example response:**

```json
{
  "events": [
    {
      "id": "evt_123",
      "slug": "us-election-2024",
      "title": "2024 US Presidential Election",
      "description": "Markets for the 2024 US Presidential Election.",
      "category": "politics",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-11-05T00:00:00Z",
      "active": true,
      "closed": false,
      "marketCount": 5,
      "markets": [
        {
          "id": "0x111...",
          "question": "Will Candidate A win?",
          "outcomes": [
            "Yes",
            "No"
          ],
          "outcomePrices": [
            "0.52",
            "0.48"
          ],
          "active": true
        }
      ],
      "volume": 25000000,
      "liquidity": 3200000
    }
  ],
  "count": 1
}
```

### `getPrice`

Get the current price for a specific market outcome token on the Polymarket CLOB. The tokenId is the unique identifier for one side of a binary market outcome (e.g., the "Yes" token or "No" token). Prices range from 0.00 to 1.00, representing the implied probability. Use side to get the BUY or SELL price.

**Arguments:**

- `tokenId` (string, **required**): The token ID of the outcome to price (available from market.outcomes or market data)
- `side` (string, *optional*): Price side: "BUY" or "SELL". Defaults to "BUY".

**Returns:**

`AdapterOperationResult`: Returns { tokenId, price (0.00–1.00), timestamp (ISO 8601) }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/getPrice" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"tokenId":"71321045679252212594626385532706912750332728571942532289631379312455583992563"}' | jq .
```

**Example response:**

```json
{
  "tokenId": "71321045679252212594626385532706912750332728571942532289631379312455583992563",
  "price": 0.62,
  "timestamp": "2024-06-15T14:30:00Z"
}
```

### `getOrderbook`

Get the current orderbook depth for a market outcome token on the Polymarket CLOB. Returns sorted bid and ask arrays with price/size at each level, plus computed midpoint and spread. Useful for assessing liquidity and slippage before placing orders.

**Arguments:**

- `tokenId` (string, **required**): The token ID of the outcome (available from market data)

**Returns:**

`AdapterOperationResult`: Returns FLAT orderbook: tokenId, bids[] (each { price, size }), asks[] (each { price, size }), midpoint, spread, bestBid, bestAsk. Bids are sorted highest-first, asks lowest-first.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/getOrderbook" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"tokenId":"71321045679252212594626385532706912750332728571942532289631379312455583992563"}' | jq .
```

**Example response:**

```json
{
  "tokenId": "71321045679252212594626385532706912750332728571942532289631379312455583992563",
  "bids": [
    {
      "price": 0.61,
      "size": 500
    },
    {
      "price": 0.6,
      "size": 1200
    }
  ],
  "asks": [
    {
      "price": 0.63,
      "size": 800
    },
    {
      "price": 0.64,
      "size": 300
    }
  ],
  "midpoint": 0.62,
  "spread": 0.02,
  "bestBid": 0.61,
  "bestAsk": 0.63
}
```

### `placeOrder`

Creates an action proposal for user approval. Validates that CLOB credentials exist, fetches live market price/spread for context, and saves an ActionProposal to the database. Server signs and submits the order on approval. Returns status "pending" with requiresAction: true.

**Arguments:**

- `tokenId` (string, **required**): The token ID of the outcome to trade (from market data)
- `price` (number, **required**): Order price between 0.01 and 0.99 (implied probability)
- `size` (number, **required**): Order size in number of shares (denominated in USDC)
- `side` (string, **required**): Order side: "BUY" to buy outcome shares, "SELL" to sell held shares
- `type` (string, *optional*): Order type: "GTC" (Good Til Cancelled, default), "GTD" (Good Til Date), "FOK" (Fill Or Kill), "FAK" (Fill And Kill)
- `expiration` (number, *optional*): Unix timestamp expiration for GTD orders only
- `marketQuestion` (string, *optional*): Human-readable market question (e.g. "Will Bitcoin reach $100k?"). Pass this from getMarkets results so the order card shows the market name instead of a numeric token ID.

**Returns:**

`AdapterOperationResult`: Returns pending order intent with FLAT fields: type ("pending_order"), orderPayload { tokenId, price, size, side, type, expiration }, expiresAt (ISO 8601), currentPrice (live market price for reference), currentSpread. Status is "pending" with requiresAction: true.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/placeOrder" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"tokenId":"713210456...","price":0.55,"size":100,"side":"BUY"}' | jq .
```

**Example response:**

```json
{
  "type": "pending_order",
  "orderPayload": {
    "tokenId": "713210456...",
    "price": 0.55,
    "size": 100,
    "side": "BUY",
    "type": "GTC"
  },
  "expiresAt": "2024-06-15T14:35:00Z",
  "currentPrice": 0.54,
  "currentSpread": 0.02
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `executeOrder`

Executes a previously approved order using server-stored CLOB credentials. Called automatically when user approves a placeOrder proposal. Signs the order server-side with HMAC-SHA256 and submits to the Polymarket CLOB API with optional Builder attribution headers.

**Arguments:**

- `orderPayload` (object, **required**): The order payload from placeOrder: { tokenId, price, size, side, type, expiration }

**Returns:**

`AdapterOperationResult`: Returns the placed order with FLAT fields: id, market, tokenId, side, price, size, sizeMatched, status, type, createdAt, expiresAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/executeOrder" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"orderPayload":{"tokenId":"713210456...","price":0.55,"size":100,"side":"BUY","type":"GTC"}}' | jq .
```

**Example response:**

```json
{
  "id": "order_abc123",
  "market": "0xabcdef...",
  "tokenId": "713210456...",
  "side": "BUY",
  "price": 0.55,
  "size": 100,
  "sizeMatched": 0,
  "status": "live",
  "type": "GTC",
  "createdAt": "2024-06-15T14:31:00Z"
}
```

### `cancelOrder`

Creates an action proposal to cancel an existing order. Validates that CLOB credentials exist and saves an ActionProposal to the database. Server signs and submits the cancellation on approval. Returns status "pending" with requiresAction: true.

**Arguments:**

- `orderId` (string, **required**): The ID of the order to cancel (from getOrders or placeOrder result)

**Returns:**

`AdapterOperationResult`: Returns pending cancel intent with FLAT fields: type ("pending_cancel"), orderId, expiresAt (ISO 8601). Status is "pending" with requiresAction: true.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/cancelOrder" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"orderId":"order_abc123"}' | jq .
```

**Example response:**

```json
{
  "type": "pending_cancel",
  "orderId": "order_abc123",
  "expiresAt": "2024-06-15T14:35:00Z"
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `executeCancelOrder`

Executes a previously approved cancel using server-stored CLOB credentials. Called automatically when user approves a cancelOrder proposal. Signs the cancel request server-side and submits to the Polymarket CLOB API.

**Arguments:**

- `orderId` (string, **required**): The ID of the order to cancel

**Returns:**

`AdapterOperationResult`: Returns { success: true, cancelledOrderId }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/executeCancelOrder" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"orderId":"order_abc123"}' | jq .
```

**Example response:**

```json
{
  "success": true,
  "cancelledOrderId": "order_abc123"
}
```

### `refreshOrder`

Rebuild an expired order proposal with fresh market data. Use this when a pending order from placeOrder has expired and the user still wants to place the trade. Creates a new ActionProposal with updated currentPrice and a new expiration. Same parameters as placeOrder.

**Arguments:**

- `tokenId` (string, **required**): The token ID of the outcome to trade
- `price` (number, **required**): Order price between 0.01 and 0.99
- `size` (number, **required**): Order size in number of shares
- `side` (string, **required**): Order side: "BUY" or "SELL"
- `type` (string, *optional*): Order type: "GTC" (default), "GTD", "FOK", "FAK"
- `expiration` (number, *optional*): Unix timestamp expiration for GTD orders

**Returns:**

`AdapterOperationResult`: Returns a new pending order intent (same structure as placeOrder) with updated currentPrice, currentSpread, and a new expiresAt timestamp.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/refreshOrder" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"tokenId":"713210456...","price":0.55,"size":100,"side":"BUY"}' | jq .
```

**Example response:**

```json
{
  "type": "pending_order",
  "orderPayload": {
    "tokenId": "713210456...",
    "price": 0.55,
    "size": 100,
    "side": "BUY",
    "type": "GTC"
  },
  "expiresAt": "2024-06-15T14:40:00Z",
  "currentPrice": 0.56,
  "currentSpread": 0.03
}
```

### `getOrders`

Get active orders for the authenticated user on the Polymarket CLOB. Returns open/pending orders with current fill status. Requires server-side CLOB credentials (read-only). Can be filtered by market condition ID.

**Arguments:**

- `market` (string, *optional*): Filter by market condition ID to see orders for a specific market
- `limit` (number, *optional*): Maximum number of orders to return (default: 25, max: 100)
- `offset` (number, *optional*): Offset for pagination (default: 0)

**Returns:**

`AdapterOperationResult`: Returns { orders[], count }. Each order has FLAT fields: id, market, tokenId, side, price, size, sizeMatched, status (live/matched/cancelled), type (GTC/GTD/FOK/FAK), createdAt, expiresAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/getOrders" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"limit":5}' | jq .
```

**Example response:**

```json
{
  "orders": [
    {
      "id": "order_abc123",
      "market": "0xabcdef...",
      "tokenId": "713210456...",
      "side": "BUY",
      "price": 0.55,
      "size": 100,
      "sizeMatched": 25,
      "status": "live",
      "type": "GTC",
      "createdAt": "2024-06-15T14:00:00Z"
    }
  ],
  "count": 1
}
```

### `getPositions`

Get current prediction market positions for the authenticated user. Shows all held outcome token positions with average entry price, current price, and computed P&L. Requires the user's wallet address and CLOB credentials.

**Returns:**

`AdapterOperationResult`: Returns { positions[], count }. Each position has FLAT fields: marketId, conditionId, question, outcome, tokenId, size (number of shares), avgPrice (entry price), currentPrice, pnl (unrealized profit/loss in USDC), pnlPercent, value (current position value in USDC).

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/getPositions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

**Example response:**

```json
{
  "positions": [
    {
      "marketId": "0xabcdef...",
      "conditionId": "0x123...",
      "question": "Will BTC reach $100k?",
      "outcome": "Yes",
      "tokenId": "713210456...",
      "size": 200,
      "avgPrice": 0.42,
      "currentPrice": 0.55,
      "pnl": 26,
      "pnlPercent": 30.95,
      "value": 110
    }
  ],
  "count": 1
}
```

### `getTrades`

Get trade history for the authenticated user. Returns completed trades with execution prices, sizes, fees, and on-chain transaction hashes. Can be filtered by market.

**Arguments:**

- `market` (string, *optional*): Filter by market condition ID
- `limit` (number, *optional*): Maximum number of trades to return (default: 25, max: 100)
- `offset` (number, *optional*): Offset for pagination (default: 0)

**Returns:**

`AdapterOperationResult`: Returns { trades[], count }. Each trade has FLAT fields: id, market, tokenId, side (BUY/SELL), price, size, fee (in USDC), timestamp (ISO 8601), outcome, status (matched), transactionHash (Polygon tx hash).

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/getTrades" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"limit":3}' | jq .
```

**Example response:**

```json
{
  "trades": [
    {
      "id": "trade_xyz789",
      "market": "0xabcdef...",
      "tokenId": "713210456...",
      "side": "BUY",
      "price": 0.55,
      "size": 100,
      "fee": 0.5,
      "timestamp": "2024-06-15T14:30:00Z",
      "outcome": "Yes",
      "status": "matched",
      "transactionHash": "0xtx123..."
    }
  ],
  "count": 1
}
```

### `getBuilderLeaderboard`

Get the Polymarket Builder program leaderboard rankings. Shows top builders by volume and trade count for a given period. Requires Builder API credentials configured on the server.

**Arguments:**

- `period` (string, *optional*): Time period for rankings: "daily", "weekly", "monthly", or omit for all-time
- `limit` (number, *optional*): Maximum number of entries to return (default: 25, max: 100)

**Returns:**

`AdapterOperationResult`: Returns { leaderboard[], count }. Each entry has FLAT fields: builderId, rank, volume (USDC), tradeCount, period.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/getBuilderLeaderboard" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"period":"weekly","limit":5}' | jq .
```

**Example response:**

```json
{
  "leaderboard": [
    {
      "builderId": "builder_001",
      "rank": 1,
      "volume": 5200000,
      "tradeCount": 15000,
      "period": "weekly"
    },
    {
      "builderId": "builder_002",
      "rank": 2,
      "volume": 3100000,
      "tradeCount": 8500,
      "period": "weekly"
    }
  ],
  "count": 2
}
```

### `getBuilderVolume`

Get volume time-series data for the Builder program. Shows daily volume and trade count attributed to the builder. Requires Builder API credentials.

**Arguments:**

- `startDate` (string, *optional*): Start date in ISO 8601 format (e.g., "2024-06-01")
- `endDate` (string, *optional*): End date in ISO 8601 format (e.g., "2024-06-30")

**Returns:**

`AdapterOperationResult`: Returns { volumes[], count }. Each entry has FLAT fields: builderId, date (ISO 8601), volume (USDC), tradeCount.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/getBuilderVolume" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"startDate":"2024-06-01","endDate":"2024-06-07"}' | jq .
```

**Example response:**

```json
{
  "volumes": [
    {
      "builderId": "builder_001",
      "date": "2024-06-01",
      "volume": 150000,
      "tradeCount": 420
    },
    {
      "builderId": "builder_001",
      "date": "2024-06-02",
      "volume": 175000,
      "tradeCount": 510
    }
  ],
  "count": 2
}
```

### `discoverExtended`

Search Polymarket API for available operations beyond core tools

**Arguments:**

- `query` (string, **required**): Describe what you want to do (e.g., "add label to card")
- `limit` (number, *optional*): Max results to return (default 5)

**Returns:**

`AdapterOperationResult`: List of matching operations with their details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/discoverExtended" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"query":"search term"}' | jq .
```

### `executeExtended`

Execute a Polymarket API operation by operationId

**Arguments:**

- `operationId` (string, **required**): The operationId from discoverExtended results
- `pathParams` (object, *optional*): Path parameters, e.g., { id: "abc123" }
- `queryParams` (object, *optional*): Query string parameters
- `body` (object, *optional*): Request body for POST/PUT/PATCH operations

**Returns:**

`AdapterOperationResult`: API response data

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/polymarket/executeExtended" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"operationId":"<ID>"}' | jq .
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
