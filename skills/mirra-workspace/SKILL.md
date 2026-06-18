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
| `exec` | Execute a bash command in the group workspace container. By default this is a PERSISTENT Docker c... |

## Operation Details

### `exec`

Execute a bash command in the group workspace container. By default this is a PERSISTENT Docker container with a volume mounted at /workspace — use it for file operations (read, write, list), installing packages, running builds, and preparing content for deployment via other adapters. Files persist across calls. For commands that process untrusted or customer-facing input, set `sandboxed: true` to run in an isolated, no-network, ephemeral container instead; because the sandbox keeps NOTHING between calls, use `sandboxData` to feed it files you staged earlier (see those two args).

**Arguments:**

- `command` (string, **required**): Bash command to execute (e.g., "ls /workspace/scripts", "cat > /workspace/scripts/handler.js << 'EOF'\n...\nEOF")
- `timeout` (number, *optional*): Timeout in milliseconds (default: 60000, max: 300000)
- `cwd` (string, *optional*): Working directory inside the container (default: /workspace)
- `sandboxed` (boolean, *optional*): Run in an isolated sandbox: no network, non-root, all capabilities dropped, read-only rootfs, and no stored credentials. IMPORTANT — the sandbox is fully EPHEMERAL: a fresh throwaway container per call with an empty /workspace, so NOTHING persists between calls. A common pattern is "write data files in one exec, then run code over them in a later exec" — that does NOT work under sandboxed because the later call is a brand-new empty container that cannot see the earlier writes. To run code over files you staged earlier, keep staging them with normal (non-sandboxed) exec calls (so they land on the persistent volume) and pass `sandboxData` to mount that directory into the sandbox read-only. Use sandboxed for commands that process untrusted or customer-facing input (e.g. model-written code). NOTE on enforcement: the sandbox is automatically FORCED for any caller that does not OWN the target workspace (sub-accounts, delegated / act-as / service callers), regardless of this flag. Owners are never auto-sandboxed — and a personal flow always runs as the owner of its own workspace, so it keeps the persistent container unless it opts in with this flag.
- `sandboxData` (string, *optional*): How to get files INTO an ephemeral sandbox. Absolute path to a directory inside YOUR workspace volume (under /workspace) to mount READ-ONLY into the sandbox at the same path, so code run with sandboxed:true can read files you staged earlier while still having no network and no credentials. Canonical pattern: (1) stage the data with a normal (non-sandboxed) exec so it lands on the persistent volume, e.g. /workspace/run/<id>/data/*.json; (2) run the analysis with sandboxed:true and sandboxData set to that directory. Mount the DATA dir only — never a directory that also holds secrets (e.g. a temp token file), because anything under the mounted path is readable by the sandboxed code; only that one subpath is exposed, so the rest of the volume (including /workspace/.env) stays hidden. The mount is read-only, so the sandbox cannot modify your files. Honored only when you OWN the workspace; ignored for a forced (non-owner) sandbox, which stays data-less by design.

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
