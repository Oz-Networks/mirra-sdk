---
name: mirra-jupiter
description: "Use Mirra to jupiter dex integration for solana token swaps and portfolio management. Covers all Jupiter SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Jupiter

Jupiter DEX integration for Solana token swaps and portfolio management

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

## API Call Pattern

All operations use a single POST endpoint with the resource ID and method in the body:

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "resourceId": "jupiter",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/jupiter/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `swap` | Execute a token swap on Jupiter DEX. Provide EITHER `amount` (input to spend) OR `outputAmount` (... |
| `getHoldings` | Get token holdings for a wallet with live USD prices. Returns normalized FLAT structure with owne... |
| `getTokenSecurity` | Get token security information using Jupiter Shield. Returns normalized FLAT structure with riskL... |
| `searchTokens` | Search for tokens by symbol, name, or mint address. Returns top 10 slim results for quick identif... |
| `refreshSwap` | Refresh an expired swap with a new quote. Only feedItemId and swapId are required — original swap... |
| `launchToken` | Launch a new token on Solana via Jupiter Studio. Creates a DBC (Dynamic Bonding Curve) pool. The ... |

## Operation Details

### `swap`

Execute a token swap on Jupiter DEX. Provide EITHER `amount` (input to spend) OR `outputAmount` (output to receive), not both. When user says "buy 1000 TOKEN_B", use outputAmount: 1000 — the adapter auto-calculates input from live prices. SOL mint: So11111111111111111111111111111111111111112.

**Arguments:**

- `inputMint` (string, **required**): Mint address of the token you are SPENDING (e.g. SOL: So11111111111111111111111111111111111111112)
- `outputMint` (string, **required**): Mint address of the token you are BUYING
- `amount` (number, *optional*): Amount of INPUT token to spend (in UI units, e.g. 0.5 SOL). Use this when user says "spend X SOL on tokens". Provide this OR outputAmount, not both.
- `outputAmount` (number, *optional*): Amount of OUTPUT token to receive (UI units). Adapter auto-calculates input from live prices. Use this when user says "buy X tokens". Provide this OR amount, not both.
- `inputDecimals` (number, *optional*): Number of decimals for input token. Auto-resolved from Jupiter token registry if not provided.
- `slippageBps` (number, *optional*): Slippage tolerance in basis points (default: 50)

**Returns:**

`AdapterOperationResult`: Returns { type, transaction, requestId, signerWallet, expiresAt, inputMint, outputMint, inputAmount, inputDecimals, expectedOutputAmount, expectedOutputAmountUi, priceImpact, slippageBps, hasRoutePlan, routeStepCount }. FLAT structure. Use expectedOutputAmountUi (human-readable token count) when reporting to users, NOT expectedOutputAmount (raw units).

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"jupiter","method":"swap","params":{"inputMint":"<value>","outputMint":"<value>"}}' | jq .
```

### `getHoldings`

Get token holdings for a wallet with live USD prices. Returns normalized FLAT structure with owner, solBalance, solValueUsd, totalValueUsd, tokenCount, and tokens array. Each token includes priceUsd and valueUsd.

**Arguments:**

- `walletAddress` (string, *optional*): Wallet address to check (uses actor wallet if not provided)

**Returns:**

`AdapterOperationResult`: Returns { owner, solBalance, solValueUsd, totalValueUsd, tokenCount, tokens[] }. Each token has FLAT fields: mint, symbol, name, decimals, balance, uiBalance, logoURI, priceUsd, valueUsd, accountCount. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"jupiter","method":"getHoldings","params":{}}' | jq .
```

### `getTokenSecurity`

Get token security information using Jupiter Shield. Returns normalized FLAT structure with riskLevel, warningCount, and security flags.

**Arguments:**

- `tokenMint` (string, **required**): Token mint address to check security for

**Returns:**

`AdapterOperationResult`: Returns { mint, riskLevel, warningCount, hasCriticalWarning, hasFreezableWarning, hasMintableWarning, warnings[] }. Each warning has FLAT fields: type, message, severity, source. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"jupiter","method":"getTokenSecurity","params":{"tokenMint":"<value>"}}' | jq .
```

### `searchTokens`

Search for tokens by symbol, name, or mint address. Returns top 10 slim results for quick identification. Use getTokenSecurity for detailed token analysis.

**Arguments:**

- `query` (string, **required**): Search query (symbol, name, or mint address)

**Returns:**

`AdapterOperationResult`: Returns { query, count, totalFound, results[] }. Each result: mint, symbol, name, priceUsd, marketCap, liquidity, isVerified, isSuspicious, holderCount, tags[].

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"jupiter","method":"searchTokens","params":{"query":"search term"}}' | jq .
```

### `refreshSwap`

Refresh an expired swap with a new quote. Only feedItemId and swapId are required — original swap parameters are loaded automatically from the feed item. Optionally override slippageBps.

**Arguments:**

- `feedItemId` (string, **required**): Feed item ID containing the swap to refresh
- `swapId` (string, **required**): Original swap ID
- `inputMint` (string, *optional*): Optional override. If omitted, uses value from original swap.
- `outputMint` (string, *optional*): Optional override. If omitted, uses value from original swap.
- `amount` (number, *optional*): Optional override (in UI units). If omitted, uses value from original swap.
- `inputDecimals` (number, *optional*): Optional override. If omitted, auto-resolved from original swap or token registry.
- `slippageBps` (number, *optional*): Slippage tolerance in basis points (default from original swap or 50)

**Returns:**

`AdapterOperationResult`: Returns { type, transaction, requestId, signerWallet, expiresAt, refreshedAt, inputMint, outputMint, inputAmount, inputDecimals, expectedOutputAmount, priceImpact, slippageBps, hasRoutePlan, routeStepCount }. FLAT structure.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"jupiter","method":"refreshSwap","params":{"feedItemId":"<ID>","swapId":"<ID>"}}' | jq .
```

### `launchToken`

Launch a new token on Solana via Jupiter Studio. Creates a DBC (Dynamic Bonding Curve) pool. The user must have uploaded a token image in this conversation — pass the image URL provided in the chat. Returns a pending_transaction for the user to sign. FLAT structure.

**Arguments:**

- `tokenName` (string, **required**): Name of the token
- `tokenSymbol` (string, **required**): Token ticker symbol
- `tokenDescription` (string, *optional*): Description for the token metadata
- `tokenImageUrl` (string, **required**): URL of the uploaded token image (from user message)
- `quoteMint` (string, *optional*): Quote token mint address. Defaults to USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v). Can also use SOL or JUP mint.
- `preset` (string, *optional*): Market cap preset: "meme" (16k→69k, default), "mid" (69k→420k), "premium" (420k→1M). Sets initialMarketCap and migrationMarketCap. Explicit values override preset.
- `initialMarketCap` (number, *optional*): Initial market cap in quote token units. Overrides preset value if provided.
- `migrationMarketCap` (number, *optional*): Market cap threshold for graduation/migration. Overrides preset value if provided.
- `antiSniping` (boolean, *optional*): Enable anti-sniping protection (default: false)
- `feeBps` (number, *optional*): Creator trading fee in basis points: 100 (1%) or 200 (2%). Default: 100
- `isLpLocked` (boolean, *optional*): Lock LP tokens (default: true)
- `website` (string, *optional*): Project website URL for token metadata
- `twitter` (string, *optional*): Twitter/X URL for token metadata
- `telegram` (string, *optional*): Telegram URL for token metadata

**Returns:**

`AdapterOperationResult`: Returns { type, transaction, mint, signerWallet, expiresAt, tokenName, tokenSymbol, imageUrl }. FLAT structure.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"jupiter","method":"launchToken","params":{"tokenName":"<value>","tokenSymbol":"<value>","tokenImageUrl":"https://example.com"}}' | jq .
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
