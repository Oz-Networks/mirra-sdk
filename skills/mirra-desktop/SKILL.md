---
name: mirra-desktop
description: "Use Mirra to execute operations on the user's local desktop machine (shell commands, file i/o, system info). Covers all Desktop SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Desktop

Execute operations on the user's local desktop machine (shell commands, file I/O, system info)

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/desktop/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `executeCommand` | Run a shell command on the user's desktop and return stdout, stderr, and exit code. The command r... |
| `readFile` | Read the text contents of a file on the user's desktop with line-based pagination. Returns 200 li... |
| `writeFile` | Write or create a file on the user's desktop. Parent directories are created automatically. Requi... |
| `editFile` | Make a targeted text replacement in a file on the user's desktop. Read the file first with readFi... |
| `listDirectory` | List files and directories at a given path on the user's desktop. Returns name, type, size, and m... |
| `getSystemInfo` | Get system information from the user's desktop: hostname, OS, CPU, memory, home directory. |
| `spawnProcess` | Spawn a long-running background process on the user's desktop. The process runs detached with no ... |
| `killProcess` | Kill a previously spawned background process by its process ID. |
| `listMachines` | List all desktop machines currently connected for the user. Shows hostname, platform, capabilitie... |
| `selectMachine` | Select a specific desktop machine to receive all subsequent operations. Required when multiple de... |

## Operation Details

### `executeCommand`

Run a shell command on the user's desktop and return stdout, stderr, and exit code. The command runs via /bin/sh -c. Output is truncated to 1 MB.

**Arguments:**

- `command` (string, **required**): Shell command to execute (e.g., "ls -la ~/Documents")
- `cwd` (string, *optional*): Working directory for the command (defaults to user home)
- `timeoutMs` (number, *optional*): Timeout in milliseconds (defaults to 120000)

**Returns:**

`AdapterOperationResult`: Command result with stdout, stderr, exitCode, executionTimeMs

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/desktop/executeCommand" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"command":"ls -la ~"}' | jq .
```

**Example response:**

```json
{
  "stdout": "total 48\ndrwxr-x---  12 user  staff  384 Jan 15 10:00 .\n...",
  "stderr": "",
  "exitCode": 0,
  "executionTimeMs": 45
}
```

### `readFile`

Read the text contents of a file on the user's desktop with line-based pagination. Returns 200 lines by default starting from line 1. The "content" field has line numbers in "cat -n" format for display; the "rawContent" field has clean text for programmatic use (JSON.parse, CSV parsing, etc). Supports ~ for home directory. Use offset/limit to paginate through large files. Check hasMore to know if more content follows.

**Arguments:**

- `path` (string, **required**): Path to the file. Supports ~ for home directory (e.g., "~/Documents/data.json")
- `offset` (number, *optional*): Line number to start reading from (1-indexed, defaults to 1)
- `limit` (number, *optional*): Maximum number of lines to return (defaults to 200)
- `maxBytes` (number, *optional*): Maximum file size in bytes before rejecting (defaults to 10485760 = 10 MB)

**Returns:**

`AdapterOperationResult`: File contents with line numbers, pagination metadata (totalLines, startLine, endLine, hasMore), and file size

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/desktop/readFile" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"path":"~/.zshrc"}' | jq .
```

**Example response:**

```json
{
  "content": "     1\t# .zshrc\n     2\texport PATH=\"$HOME/bin:$PATH\"\n     3\talias ll=\"ls -la\"\n",
  "rawContent": "# .zshrc\nexport PATH=\"$HOME/bin:$PATH\"\nalias ll=\"ls -la\"\n",
  "path": "/Users/user/.zshrc",
  "sizeBytes": 1234,
  "totalLines": 3,
  "startLine": 1,
  "endLine": 3,
  "hasMore": false
}
```

### `writeFile`

Write or create a file on the user's desktop. Parent directories are created automatically. Requires user consent.

**Arguments:**

- `path` (string, **required**): Path to the file. Supports ~ for home directory (e.g., "~/scripts/hello.sh")
- `content` (string, **required**): Text content to write to the file
- `append` (boolean, *optional*): If true, append to existing file instead of overwriting (defaults to false)

**Returns:**

`AdapterOperationResult`: Write result with path and bytes written

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/desktop/writeFile" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"path":"~/scripts/hello.sh","content":"#!/bin/bash\necho \"Hello, world!\"\n"}' | jq .
```

**Example response:**

```json
{
  "path": "/Users/user/scripts/hello.sh",
  "bytesWritten": 32
}
```

### `editFile`

Make a targeted text replacement in a file on the user's desktop. Read the file first with readFile to find the exact text, then use editFile to surgically replace it. old_string must appear verbatim in the file. If it matches multiple locations the edit fails unless replaceAll is true. Requires user consent.

**Arguments:**

- `path` (string, **required**): Path to the file. Supports ~ for home directory (e.g., "~/projects/config.json")
- `oldString` (string, **required**): The exact text to find and replace (must match verbatim)
- `newString` (string, **required**): The replacement text (use empty string to delete the matched text)
- `replaceAll` (boolean, *optional*): If true, replace every occurrence of oldString. Defaults to false (single match required).

**Returns:**

`AdapterOperationResult`: Edit result with path, bytesWritten (new file size), and matchCount (number of replacements made)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/desktop/editFile" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"path":"/Users/user/projects/app/config.json","oldString":"\"port\": 3000","newString":"\"port\": 8080"}' | jq .
```

**Example response:**

```json
{
  "path": "/Users/user/projects/app/config.json",
  "bytesWritten": 245,
  "matchCount": 1
}
```

### `listDirectory`

List files and directories at a given path on the user's desktop. Returns name, type, size, and modification time for each entry.

**Arguments:**

- `path` (string, **required**): Path to the directory. Supports ~ for home directory (e.g., "~/Documents")
- `recursive` (boolean, *optional*): If true, list recursively (max depth 3). Defaults to false.
- `includeHidden` (boolean, *optional*): If true, include hidden files (starting with .). Defaults to false.

**Returns:**

`AdapterOperationResult`: Directory listing with entries array and count

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/desktop/listDirectory" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"path":"~"}' | jq .
```

**Example response:**

```json
{
  "path": "/Users/user",
  "entries": [
    {
      "name": "Documents",
      "entryType": "directory",
      "size": 0,
      "modified": 1705315200
    },
    {
      "name": "notes.txt",
      "entryType": "file",
      "size": 2048,
      "modified": 1705315200
    }
  ],
  "count": 2
}
```

### `getSystemInfo`

Get system information from the user's desktop: hostname, OS, CPU, memory, home directory.

**Returns:**

`AdapterOperationResult`: System information with hostname, OS, architecture, CPU count, memory, home dir

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/desktop/getSystemInfo" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

**Example response:**

```json
{
  "hostname": "users-macbook-pro",
  "os": "macOS",
  "osVersion": "15.2",
  "arch": "aarch64",
  "cpuCount": 10,
  "totalMemoryMb": 16384,
  "homeDir": "/Users/user"
}
```

### `spawnProcess`

Spawn a long-running background process on the user's desktop. The process runs detached with no stdin/stdout (all communication via --sdk-url). Returns a process ID for later management. Requires user consent. A desktop:process_exited event is emitted when the process terminates.

**Arguments:**

- `command` (string, **required**): Path to the executable to run (e.g., "node", "python3", "/usr/local/bin/my-app")
- `args` (array, *optional*): Command-line arguments to pass to the process
- `env` (object, *optional*): Additional environment variables to set for the process
- `cwd` (string, *optional*): Working directory for the process (defaults to system default)

**Returns:**

`AdapterOperationResult`: Spawn result with processId and pid

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/desktop/spawnProcess" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"command":"node","args":["server.js","--sdk-url","wss://example.com/sdk"],"cwd":"/Users/user/projects/my-app"}' | jq .
```

**Example response:**

```json
{
  "processId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "pid": 12345
}
```

### `killProcess`

Kill a previously spawned background process by its process ID.

**Arguments:**

- `processId` (string, **required**): The process ID returned by spawnProcess

**Returns:**

`AdapterOperationResult`: Kill result indicating whether the process was found and killed

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/desktop/killProcess" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"processId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890"}' | jq .
```

**Example response:**

```json
{
  "killed": true
}
```

### `listMachines`

List all desktop machines currently connected for the user. Shows hostname, platform, capabilities, and which machine is actively selected for operations.

**Returns:**

`AdapterOperationResult`: List of connected machines with their details and the active device ID

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/desktop/listMachines" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

**Example response:**

```json
{
  "machines": [
    {
      "deviceId": "abc-123",
      "hostname": "work-macbook",
      "platform": "MacIntel",
      "arch": "aarch64",
      "appVersion": "0.1.0",
      "isActive": true,
      "connectedAt": 1705315200000,
      "capabilities": [
        "executeCommand",
        "readFile",
        "writeFile",
        "listDirectory",
        "getSystemInfo"
      ]
    }
  ],
  "activeDeviceId": "abc-123"
}
```

### `selectMachine`

Select a specific desktop machine to receive all subsequent operations. Required when multiple desktops are connected. Use listMachines first to see available devices.

**Arguments:**

- `deviceId` (string, **required**): The deviceId of the machine to select (from listMachines output)

**Returns:**

`AdapterOperationResult`: Selection result with the selected device ID, hostname, and previous selection

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/desktop/selectMachine" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"deviceId":"abc-123"}' | jq .
```

**Example response:**

```json
{
  "deviceId": "abc-123",
  "hostname": "work-macbook",
  "previousDeviceId": null
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
