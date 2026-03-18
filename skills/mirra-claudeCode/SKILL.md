---
name: mirra-claudeCode
description: "Use Mirra to manage claude code sessions running on the user's desktop. Covers all Claude Code SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Claude Code

Manage Claude Code sessions running on the user's desktop

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
    "resourceId": "claudeCode",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/claudeCode/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `startSession` | Start a new Claude Code session on the user's desktop. Spawns Claude Code with the given prompt a... |
| `resumeSession` | Resume an existing Claude Code session with a new prompt. The session continues from where it lef... |
| `listSessions` | List all active Claude Code sessions for the user |
| `killSession` | Kill a running Claude Code session and clean up associated Flows |

## Operation Details

### `startSession`

Start a new Claude Code session on the user's desktop. Spawns Claude Code with the given prompt and creates Flows to process protocol messages and route replies.

**Arguments:**

- `prompt` (string, **required**): The initial prompt/task for Claude Code
- `groupId` (string, *optional*): The Mirra group ID where Claude Code output will be posted. To find a groupId, call mirraMessaging.getGroups() which returns { groups: [{ groupId, name, description, role }], count }. If omitted, the desktop user will be prompted to select a group.
- `cwd` (string, *optional*): Working directory for Claude Code (defaults to system default)
- `model` (string, *optional*): Claude model to use (e.g., "claude-sonnet-4-6")
- `allowUnsupervisedMode` (boolean, *optional*): Run Claude Code in unsupervised mode, skipping all permission prompts. Only use for autonomous agent-driven sessions where no human is monitoring. Sessions still run in worktree isolation.
- `agentMode` (boolean, *optional*): If true, persist session output to DataAdapter on completion for queryable audit trail. Currently supported via delegate_to_claude_code tool.
- `async` (boolean, *optional*): If true, return immediately after spawning the process without waiting for CC to connect via WebSocket. The session runs independently and writes results to ~/.claude/results/<sessionId>.json. Use for long-running autonomous tasks.
- `taskType` (string, *optional*): Type of task for the result file metadata: "implementation", "research", or "analysis". Only used when async=true. Defaults to "implementation".

**Returns:**

`AdapterOperationResult`: Session info with sessionId, channelId, processId, pid

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"claudeCode","method":"startSession","params":{"prompt":"List all TypeScript files and explain the project structure","groupId":"507f1f77bcf86cd799439011","cwd":"/Users/user/projects/my-app"}}' | jq .
```

**Example response:**

```json
{
  "sessionId": "cc_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "channelId": "cc_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "processId": "x1y2z3",
  "pid": 12345
}
```

### `resumeSession`

Resume an existing Claude Code session with a new prompt. The session continues from where it left off.

**Arguments:**

- `claudeSessionId` (string, **required**): The Claude Code session ID to resume (from a previous session)
- `prompt` (string, **required**): The follow-up prompt/task
- `groupId` (string, *optional*): The Mirra group ID where Claude Code output will be posted. To find a groupId, call mirraMessaging.getGroups() which returns { groups: [{ groupId, name, description, role }], count }. If omitted, the desktop user will be prompted to select a group.
- `cwd` (string, *optional*): Working directory for Claude Code

**Returns:**

`AdapterOperationResult`: Session info with sessionId, channelId, processId, pid

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"claudeCode","method":"resumeSession","params":{"claudeSessionId":"abc123-previous-session","prompt":"Now add tests for the functions you created","groupId":"507f1f77bcf86cd799439011"}}' | jq .
```

**Example response:**

```json
{
  "sessionId": "cc_new-session-id",
  "channelId": "cc_new-session-id",
  "processId": "x1y2z3",
  "pid": 12346
}
```

### `listSessions`

List all active Claude Code sessions for the user

**Returns:**

`AdapterOperationResult`: List of active sessions with status

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"claudeCode","method":"listSessions","params":{}}' | jq .
```

**Example response:**

```json
{
  "sessions": [
    {
      "sessionId": "cc_a1b2c3d4",
      "channelId": "cc_a1b2c3d4",
      "groupId": "507f1f77bcf86cd799439011",
      "status": "connected",
      "startedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### `killSession`

Kill a running Claude Code session and clean up associated Flows

**Arguments:**

- `sessionId` (string, **required**): The session ID to kill

**Returns:**

`AdapterOperationResult`: Kill result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"claudeCode","method":"killSession","params":{"sessionId":"cc_a1b2c3d4"}}' | jq .
```

**Example response:**

```json
{
  "killed": true,
  "sessionId": "cc_a1b2c3d4"
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
