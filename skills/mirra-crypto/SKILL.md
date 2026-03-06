---
name: mirra-crypto
description: "Use Mirra to cryptocurrency price monitoring and token transfers. Covers all Crypto SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Crypto

Cryptocurrency price monitoring and token transfers

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
    "resourceId": "crypto",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/crypto/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `getPrice` | Get the current price of a crypto asset. Returns normalized flat structure. IMPORTANT: Not all to... |
| `sendToken` | Send cryptocurrency or tokens (creates pending transaction for signing). Returns normalized flat ... |
| `monitorPrice` | Set up automated price monitoring with progressive alerts. Returns normalized flat structure. |
| `listSubscriptions` | List all active crypto price monitoring assignments. Returns normalized flat structures. |
| `unsubscribeAsset` | Stop monitoring a crypto asset. Returns normalized flat structure. |
| `refreshTransaction` | Refresh an expired transaction with new blockhash and updated details. Returns normalized flat st... |

## Operation Details

### `getPrice`

Get the current price of a crypto asset. Returns normalized flat structure. IMPORTANT: Not all tokens are supported by the pricing service. Before using this operation in a Flow or automation, always make a test call first to verify the token is supported. If the call fails with "not supported", do NOT create the Flow — inform the user that price tracking is not available for that token.

**Arguments:**

- `tokenAddress` (string, **required**): Token contract address (EVM: 0x..., SVM: base58)
- `chainName` (string, *optional*): Specific chain name (auto-detected if not provided)

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: tokenAddress, chain, chainName, priceUsd, timestamp (ISO 8601), block, source. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"crypto","method":"getPrice","params":{"tokenAddress":"<value>"}}' | jq .
```

### `sendToken`

Send cryptocurrency or tokens (creates pending transaction for signing). Returns normalized flat structure.

**Arguments:**

- `recipient` (string, **required**): Contact username, user ID, or Solana wallet address
- `token` (string, **required**): Token symbol (SOL, USDC), name, or mint address
- `amount` (number, **required**): Amount to send (in UI units)

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: type, transferId, transaction (base64), signerWallet, tokenMint, tokenSymbol, tokenName, tokenDecimals, amount, recipientAddress, recipientDisplayName, isContact, estimatedFee, senderAddress, expiresAt (ISO 8601). No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"crypto","method":"sendToken","params":{"recipient":"<value>","token":"<value>","amount":10}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `monitorPrice`

Set up automated price monitoring with progressive alerts. Returns normalized flat structure.

**Arguments:**

- `tokenAddress` (string, **required**): Token contract address to monitor
- `direction` (string, **required**): Alert direction: "above" or "below"
- `targetPrice` (number, **required**): Target price in USD to trigger alert
- `scriptId` (string, **required**): ID of the script to execute when price target is reached
- `chainName` (string, *optional*): Chain name (auto-detected if not provided)
- `percentStep` (number, *optional*): Progressive alert step percentage (default: 0.1 = 10%)

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: flowId, tokenAddress, chain, chainName, currentPrice, targetPrice, direction, percentStep, status. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"crypto","method":"monitorPrice","params":{"tokenAddress":"<value>","direction":"<value>","targetPrice":10,"scriptId":"<ID>"}}' | jq .
```

### `listSubscriptions`

List all active crypto price monitoring assignments. Returns normalized flat structures.

**Returns:**

`AdapterOperationResult`: Returns { monitors[], count }. Each monitor has FLAT fields: assignmentId, title, tokenAddress, chain, chainName, direction, targetPrice, currentStep, maxSteps, nextThreshold, stepValue, status, createdAt. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"crypto","method":"listSubscriptions","params":{}}' | jq .
```

### `unsubscribeAsset`

Stop monitoring a crypto asset. Returns normalized flat structure.

**Arguments:**

- `tokenAddress` (string, **required**): Token address to stop monitoring

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: tokenAddress, chain, deletedAssignments[], count, status, message (optional). No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"crypto","method":"unsubscribeAsset","params":{"tokenAddress":"<value>"}}' | jq .
```

### `refreshTransaction`

Refresh an expired transaction with new blockhash and updated details. Returns normalized flat structure.

**Arguments:**

- `feedItemId` (string, **required**): Feed item ID containing the transaction to refresh
- `transferId` (string, **required**): Original transfer ID
- `recipient` (string, **required**): Recipient address
- `token` (string, **required**): Token symbol or mint address
- `amount` (number, **required**): Amount to send
- `tokenMint` (string, *optional*): Token mint address (optional, will resolve if not provided)
- `tokenDecimals` (number, *optional*): Token decimals (optional)

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: type, transferId, transaction (base64), signerWallet, tokenMint, tokenSymbol, tokenName, tokenDecimals, amount, recipientAddress, recipientDisplayName, isContact, estimatedFee, senderAddress, expiresAt, refreshedAt (ISO 8601). No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"crypto","method":"refreshTransaction","params":{"feedItemId":"<ID>","transferId":"<ID>","recipient":"<value>","token":"<value>","amount":10}}' | jq .
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
