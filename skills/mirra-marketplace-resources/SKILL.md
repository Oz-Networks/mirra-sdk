---
name: mirra-marketplace-resources
description: "Use Mirra to access third-party api integrations from the marketplace. Covers all Marketplace Resources SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Marketplace Resources

Access third-party API integrations from the marketplace

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
    "resourceId": "marketplace-resources",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/marketplaceResources/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `call` | Call a method on an installed marketplace resource. Returns flat response with result, cost, dura... |
| `install` | Install a marketplace resource for the user. Returns flat installation details. |
| `uninstall` | Uninstall a marketplace resource. Returns confirmation. |
| `authenticate` | Authenticate with a marketplace resource that requires credentials. |
| `listInstalled` | List all installed marketplace resources for the user. |
| `getInstallation` | Get details of a specific resource installation. |

## Operation Details

### `call`

Call a method on an installed marketplace resource. Returns flat response with result, cost, duration, and statusCode.

**Arguments:**

- `resourceId` (string, **required**): ID of the installed resource
- `method` (string, **required**): Method name to call on the resource
- `parameters` (object, **required**): Parameters to pass to the method

**Returns:**

`AdapterOperationResult`: Returns FLAT structure: { result, cost, duration, statusCode }. result contains the actual data from the resource. No nested wrappers.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-resources","method":"call","params":{"resourceId":"<ID>","method":"<value>","parameters":{}}}' | jq .
```

### `install`

Install a marketplace resource for the user. Returns flat installation details.

**Arguments:**

- `resourceId` (string, **required**): ID of the resource to install

**Returns:**

`AdapterOperationResult`: Returns FLAT structure: { installationId, userId, resourceId, alias, isAuthenticated, status, installedAt, totalCalls, totalCost, lastUsedAt }. All timestamps are ISO 8601.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-resources","method":"install","params":{"resourceId":"<ID>"}}' | jq .
```

### `uninstall`

Uninstall a marketplace resource. Returns confirmation.

**Arguments:**

- `resourceId` (string, **required**): ID of the resource to uninstall

**Returns:**

`AdapterOperationResult`: Returns FLAT structure: { success, resourceId, uninstalledAt }. uninstalledAt is ISO 8601.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-resources","method":"uninstall","params":{"resourceId":"<ID>"}}' | jq .
```

### `authenticate`

Authenticate with a marketplace resource that requires credentials.

**Arguments:**

- `resourceId` (string, **required**): ID of the resource to authenticate with
- `type` (string, **required**): Authentication type: api_key, oauth2, basic, or bearer
- `credentials` (object, **required**): Credentials object (structure depends on auth type)

**Returns:**

`AdapterOperationResult`: Returns FLAT structure: { success, resourceId, isAuthenticated, authenticatedAt }. authenticatedAt is ISO 8601.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-resources","method":"authenticate","params":{"resourceId":"<ID>","type":"<value>","credentials":{}}}' | jq .
```

### `listInstalled`

List all installed marketplace resources for the user.

**Returns:**

`AdapterOperationResult`: Returns { count, installations[] }. Each installation has FLAT fields: installationId, resourceId, alias, isAuthenticated, status, installedAt, totalCalls, totalCost. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-resources","method":"listInstalled","params":{}}' | jq .
```

### `getInstallation`

Get details of a specific resource installation.

**Arguments:**

- `resourceId` (string, **required**): ID of the resource to get installation details for

**Returns:**

`AdapterOperationResult`: Returns FLAT structure: { installationId, userId, resourceId, alias, isAuthenticated, status, installedAt, totalCalls, totalCost, lastUsedAt }. All timestamps are ISO 8601.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-resources","method":"getInstallation","params":{"resourceId":"<ID>"}}' | jq .
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
