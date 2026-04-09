---
name: mirra-workspace
description: "Use Mirra to execute bash commands in the group workspace container for file operations, builds, and deployments. Covers all Workspace SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Workspace

Execute bash commands in the group workspace container for file operations, builds, and deployments

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
    "resourceId": "workspace",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/workspace/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `exec` | Execute a bash command in the group workspace container. The workspace is a persistent Docker con... |

## Operation Details

### `exec`

Execute a bash command in the group workspace container. The workspace is a persistent Docker container with a volume mounted at /workspace. Use this for file operations (read, write, list), installing packages, running builds, and preparing content for deployment via other adapters.

**Arguments:**

- `command` (string, **required**): Bash command to execute (e.g., "ls /workspace/scripts", "cat > /workspace/scripts/handler.js << 'EOF'\n...\nEOF")
- `timeout` (number, *optional*): Timeout in milliseconds (default: 60000, max: 300000)
- `cwd` (string, *optional*): Working directory inside the container (default: /workspace)

**Returns:**

`AdapterOperationResult`: Command output with stdout, stderr, exitCode, and durationMs

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"workspace","method":"exec","params":{"command":"ls -la /workspace"}}' | jq .
```

**Example response:**

```json
{
  "stdout": "total 0\ndrwxr-xr-x 8 root root 256 Jan 1 00:00 .\ndrwxr-xr-x 1 root root 4096 Jan 1 00:00 ..\ndrwxr-xr-x 2 root root 64 Jan 1 00:00 scripts\ndrwxr-xr-x 2 root root 64 Jan 1 00:00 pages\ndrwxr-xr-x 2 root root 64 Jan 1 00:00 flows\ndrwxr-xr-x 2 root root 64 Jan 1 00:00 videos\ndrwxr-xr-x 2 root root 64 Jan 1 00:00 data",
  "stderr": "",
  "exitCode": 0,
  "durationMs": 45
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
