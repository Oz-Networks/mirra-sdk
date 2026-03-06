---
name: mirra-spaceAgent
description: "Use Mirra to inspect and direct the autonomous space agent for this group. Covers all Space Agent SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Space Agent

Inspect and direct the autonomous space agent for this group

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
    "resourceId": "spaceAgent",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/spaceAgent/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `getStatus` | Get current status snapshot of the space agent including cycle count, budget usage, last observat... |
| `getRecentEpisodes` | Get recent Tier 2 (non-silent) agent episodes. Each episode contains observations, actions taken,... |
| `sendDirective` | Queue an instruction for the space agent to process on its next cycle. The agent will address the... |
| `getMemory` | Get the agent's workspace memory — the persistent scratchpad the agent uses to track state across... |
| `getWorkspaceConfig` | Get the agent's workspace configuration including instructions, context, and heartbeat checklist. |
| `respondToAttention` | Respond to the space agent's attention request. Clears the attention state, stores your response,... |
| `dismissAttention` | Dismiss the agent's attention request without responding. The agent returns to active status but ... |
| `triggerCycle` | Force an immediate agent cycle. The scheduler will pick up the agent on its next pass. |
| `updateWorkspaceConfig` | Update the agent's workspace configuration fields. Only the provided fields are updated; omitted ... |
| `updateMemory` | Append entries to the agent's workspace memory. Entries are added with a date header. Memory is t... |
| `updateBudget` | Set the agent's monthly token budget cap. |
| `setStatus` | Pause or resume the space agent. Set to "dormant" to pause or "active" to resume. Cannot pause wh... |
| `getActivitySummary` | Get a summary of workspace activity since the agent's last cycle — flow executions, chat messages... |

## Operation Details

### `getStatus`

Get current status snapshot of the space agent including cycle count, budget usage, last observation, and pending directive count.

**Returns:**

`AdapterOperationResult`: Agent status object with status, cycleCount, lastCycleAt, lastTier2At, budgetCap, tokensUsedThisMonth, pendingDirectiveCount, lastObservation, attentionMessage

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"getStatus","params":{}}' | jq .
```

**Example response:**

```json
{
  "status": "active",
  "cycleCount": 47,
  "lastCycleAt": "2026-03-01T10:30:00.000Z",
  "lastTier2At": "2026-03-01T08:00:00.000Z",
  "budgetCap": 500000,
  "tokensUsedThisMonth": 125000,
  "pendingDirectiveCount": 0,
  "lastObservation": "Heartbeat check — market conditions stable",
  "attentionMessage": null
}
```

### `getRecentEpisodes`

Get recent Tier 2 (non-silent) agent episodes. Each episode contains observations, actions taken, deltas, next steps, and token usage from a full agent cycle.

**Arguments:**

- `limit` (number, *optional*): Number of episodes to return (default 5, max 20)

**Returns:**

`AdapterOperationResult`: Array of recent episodes with cycleNumber, timestamp, observations, actions, deltas, nextSteps, tokensUsed, durationMs

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"getRecentEpisodes","params":{"limit":3}}' | jq .
```

**Example response:**

```json
{
  "episodes": [
    {
      "cycleNumber": 47,
      "timestamp": "2026-03-01T08:00:00.000Z",
      "observations": [
        "Market stable, no anomalies detected"
      ],
      "actions": [
        {
          "type": "analysis",
          "description": "Ran portfolio review"
        }
      ],
      "deltas": [
        "Updated risk assessment"
      ],
      "nextSteps": [
        "Monitor overnight positions"
      ],
      "tokensUsed": 3500,
      "durationMs": 12000
    }
  ],
  "count": 1
}
```

### `sendDirective`

Queue an instruction for the space agent to process on its next cycle. The agent will address the directive during Tier 2 processing. Use urgent=true to force an immediate cycle.

**Arguments:**

- `directive` (string, **required**): The instruction text for the agent (max 2000 characters)
- `urgent` (boolean, *optional*): If true, forces an immediate cycle by resetting lastCycleAt so the scheduler picks it up right away

**Returns:**

`AdapterOperationResult`: Confirmation with queued status, directive count, and whether an immediate cycle will be triggered

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"sendDirective","params":{"directive":"Cancel all stuck sessions immediately","urgent":true}}' | jq .
```

**Example response:**

```json
{
  "queued": true,
  "directiveCount": 1,
  "willTriggerImmediateCycle": true
}
```

### `getMemory`

Get the agent's workspace memory — the persistent scratchpad the agent uses to track state across cycles.

**Returns:**

`AdapterOperationResult`: Agent memory string

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"getMemory","params":{}}' | jq .
```

**Example response:**

```json
{
  "memory": "## Active Positions\n- BTC long opened 2026-02-28\n\n## Notes\n- User prefers conservative approach"
}
```

### `getWorkspaceConfig`

Get the agent's workspace configuration including instructions, context, and heartbeat checklist.

**Returns:**

`AdapterOperationResult`: Workspace config with instructions, context, and heartbeat fields

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"getWorkspaceConfig","params":{}}' | jq .
```

**Example response:**

```json
{
  "instructions": "Monitor portfolio positions and alert on >5% swings",
  "context": "User timezone: EST. Risk tolerance: moderate.",
  "heartbeat": "- Check open positions\n- Review overnight activity"
}
```

### `respondToAttention`

Respond to the space agent's attention request. Clears the attention state, stores your response, and forces an immediate cycle so the agent can process it.

**Arguments:**

- `message` (string, **required**): Your response to the agent's attention request

**Returns:**

`AdapterOperationResult`: Confirmation that the response was recorded

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"respondToAttention","params":{"message":"Yes, go ahead and close that position"}}' | jq .
```

**Example response:**

```json
{
  "success": true
}
```

### `dismissAttention`

Dismiss the agent's attention request without responding. The agent returns to active status but does not immediately cycle.

**Returns:**

`AdapterOperationResult`: Confirmation that the attention was dismissed

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"dismissAttention","params":{}}' | jq .
```

**Example response:**

```json
{
  "success": true
}
```

### `triggerCycle`

Force an immediate agent cycle. The scheduler will pick up the agent on its next pass.

**Returns:**

`AdapterOperationResult`: Confirmation that a cycle was triggered

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"triggerCycle","params":{}}' | jq .
```

**Example response:**

```json
{
  "success": true
}
```

### `updateWorkspaceConfig`

Update the agent's workspace configuration fields. Only the provided fields are updated; omitted fields remain unchanged.

**Arguments:**

- `instructions` (string, *optional*): Agent instructions (max 20,000 characters)
- `context` (string, *optional*): Agent context (max 20,000 characters)
- `heartbeat` (string, *optional*): Agent heartbeat checklist (max 20,000 characters)

**Returns:**

`AdapterOperationResult`: Confirmation with list of updated fields

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"updateWorkspaceConfig","params":{"instructions":"Monitor BTC positions closely","heartbeat":"- Check BTC price\n- Review open orders"}}' | jq .
```

**Example response:**

```json
{
  "updated": true,
  "fields": [
    "instructions",
    "heartbeat"
  ]
}
```

### `updateMemory`

Append entries to the agent's workspace memory. Entries are added with a date header. Memory is truncated at 20,000 characters (oldest entries trimmed).

**Arguments:**

- `entries` (array, **required**): Array of memory entries to append (non-empty strings)

**Returns:**

`AdapterOperationResult`: Confirmation with current memory size

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"updateMemory","params":{"entries":["User prefers conservative risk","BTC long opened at 95k"]}}' | jq .
```

**Example response:**

```json
{
  "success": true,
  "memorySize": 1250
}
```

### `updateBudget`

Set the agent's monthly token budget cap.

**Arguments:**

- `budgetCap` (number, **required**): Monthly token budget cap (positive number)

**Returns:**

`AdapterOperationResult`: Confirmation with new budget cap

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"updateBudget","params":{"budgetCap":1000000}}' | jq .
```

**Example response:**

```json
{
  "updated": true,
  "budgetCap": 1000000
}
```

### `setStatus`

Pause or resume the space agent. Set to "dormant" to pause or "active" to resume. Cannot pause while agent is processing.

**Arguments:**

- `status` (string, **required**): Target status: "active" or "dormant"

**Returns:**

`AdapterOperationResult`: Confirmation with new status

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"setStatus","params":{"status":"dormant"}}' | jq .
```

**Example response:**

```json
{
  "status": "dormant"
}
```

### `getActivitySummary`

Get a summary of workspace activity since the agent's last cycle — flow executions, chat messages, voice recordings, and transcripts.

**Returns:**

`AdapterOperationResult`: Activity event counts and totals since last cycle

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"spaceAgent","method":"getActivitySummary","params":{}}' | jq .
```

**Example response:**

```json
{
  "events": [
    {
      "source": "flows",
      "type": "flow_execution",
      "count": 3
    },
    {
      "source": "mirraMessaging",
      "type": "message",
      "count": 12
    }
  ],
  "totalEventCount": 15,
  "since": "2026-03-01T10:30:00.000Z"
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
