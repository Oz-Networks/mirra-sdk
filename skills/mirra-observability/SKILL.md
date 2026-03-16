---
name: mirra-observability
description: "Use Mirra to query audit events and traces for the current user or group. provides full observability into adapter operations, llm tool calls, and desktop operations.. Covers all Observability SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Observability

Query audit events and traces for the current user or group. Provides full observability into adapter operations, LLM tool calls, and desktop operations.

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
    "resourceId": "observability",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/observability/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `queryEvents` | Query audit events with flexible filters. Returns structured audit events for adapter operations,... |
| `getTrace` | Reconstruct the full operation chain for a given trace ID. Returns all events in chronological or... |

## Operation Details

### `queryEvents`

Query audit events with flexible filters. Returns structured audit events for adapter operations, LLM tool calls, and desktop operations. Use this to investigate errors, see what happened recently, or trace a specific operation chain.

**Arguments:**

- `timeRange` (object, *optional*): Time range filter with start/end ISO 8601 strings. Defaults to last 24 hours.
- `adapter` (string, *optional*): Filter by adapter service ID (e.g. "data", "flows", "claudeCode", "desktop")
- `operation` (string, *optional*): Filter by exact operation name (e.g. "insertRecord", "executeFlow")
- `outcome` (string, *optional*): Filter by outcome: "success", "failure", or "pending"
- `severity` (string, *optional*): Filter by severity: "debug", "info", "warn", or "error"
- `actorType` (string, *optional*): Filter by actor type: "user", "llm", "flow", "agent", or "system"
- `traceId` (string, *optional*): Filter to a single trace ID
- `search` (string, *optional*): Text search across action, error.message, and target.name fields
- `limit` (number, *optional*): Max results to return (default 50, max 200)
- `offset` (number, *optional*): Pagination offset (default 0)

**Returns:**

`object`: Object with events array and pagination metadata (totalCount, limit, offset, hasMore)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"observability","method":"queryEvents","params":{"adapter":"data","outcome":"failure","limit":10}}' | jq .
```

**Example response:**

```json
{
  "events": [
    {
      "adapter": "data",
      "operation": "insertRecord",
      "outcome": "failure",
      "error": {
        "message": "Collection not found"
      }
    }
  ],
  "pagination": {
    "totalCount": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

### `getTrace`

Reconstruct the full operation chain for a given trace ID. Returns all events in chronological order with a summary of the trace outcome.

**Arguments:**

- `traceId` (string, **required**): The trace ID to look up

**Returns:**

`object`: Object with events array (chronological) and summary (totalDuration, adaptersCalled, outcome, errorCount)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"observability","method":"getTrace","params":{"traceId":"trace-abc-1234"}}' | jq .
```

**Example response:**

```json
{
  "events": [
    {
      "adapter": "data",
      "operation": "queryRecords",
      "outcome": "success",
      "duration": 42
    },
    {
      "adapter": "claudeCode",
      "operation": "startSession",
      "outcome": "failure",
      "duration": 12
    }
  ],
  "summary": {
    "totalDuration": 54,
    "adaptersCalled": [
      "data",
      "claudeCode"
    ],
    "outcome": "mixed",
    "errorCount": 1
  }
}
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
