---
name: mirra-github
description: "Use Mirra to group-linked github repository — the team's shared ground truth. read any file in the repo (requirements, context.md, code docs) and write markdown (call not.... Covers all GitHub SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra GitHub

Group-linked GitHub repository — the team's shared ground truth. Read any file in the repo (requirements, CONTEXT.md, code docs) and write markdown (call notes, decisions, digests) under the group's configured base path (default .mirra/). Commits land directly on the default branch as mirra[bot]. Requires a group context with a linked repository; a group admin links one with linkRepo.

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
    "resourceId": "github",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/github/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `linkRepo` | Link a GitHub repository to this group (group admin only). The repo becomes the group's shared gr... |
| `unlinkRepo` | Unlink the group's GitHub repository (group admin only). Stops all auto-commits and prompt inject... |
| `getRepoStatus` | Get the group's repo link status: config (owner/repo, basePath, promptFiles, autoSync) plus a liv... |
| `updateRepoSettings` | Update the group's repo link settings (group admin only): basePath (write confinement dir), promp... |
| `readFile` | Read a file from anywhere in the group's linked repo (reads are repo-wide, not confined to basePa... |
| `listFiles` | List files in a directory of the linked repo (repo-wide). Pass recursive: true to walk the whole ... |
| `writeFile` | Create or update a single file in the group's repo. Writes are CONFINED to the group's basePath (... |
| `commitFiles` | Commit multiple files atomically in ONE commit (Git Data API). Same basePath confinement as write... |
| `deleteFile` | Delete a file from the group's repo. Confined to basePath — only Mirra-managed files can be delet... |
| `getRecentCommits` | List recent commits on the default branch (repo-wide), optionally filtered to a path. Answers "wh... |

## Operation Details

### `linkRepo`

Link a GitHub repository to this group (group admin only). The repo becomes the group's shared ground truth: Mirra auto-commits call notes and decisions under basePath (default ".mirra/") and injects promptFiles (default ".mirra/CONTEXT.md") into the group's AI context. Requires the Mirra GitHub App to be installed on the repo's owner — if it isn't, this returns linked: false with an installUrl to complete installation first (the URL expires in ~30 minutes; re-call linkRepo after installing). On success, seeds an opinionated scaffold (README, CONTEXT.md, calls/, decisions/, chats/) and appends a "Mirra shared context" section to the repo's root CLAUDE.md so every teammate's Claude Code learns the conventions.

**Arguments:**

- `owner` (string, **required**): Repository owner (org or user), e.g. "Oz-Networks"
- `repo` (string, **required**): Repository name, e.g. "fxn-monorepo"
- `basePath` (string, *optional*): Directory all Mirra writes are confined to (default ".mirra"). No leading slash, no "..".
- `promptFiles` (array, *optional*): Repo paths injected into the group's system prompt (default ["{basePath}/CONTEXT.md"], max 5)

**Returns:**

`AdapterOperationResult`: Returns: linked (boolean). When false: installUrl, message. When true: owner, repo, installationId, defaultBranch, basePath, promptFiles, scaffoldCommitUrl?, itemsExported?, warnings[]

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"github","method":"linkRepo","params":{"owner":"Oz-Networks","repo":"fxn-monorepo"}}' | jq .
```

**Example response:**

```json
{
  "linked": true,
  "owner": "Oz-Networks",
  "repo": "fxn-monorepo",
  "installationId": 12345678,
  "defaultBranch": "main",
  "basePath": ".mirra",
  "promptFiles": [
    ".mirra/CONTEXT.md"
  ],
  "scaffoldCommitUrl": "https://github.com/Oz-Networks/fxn-monorepo/commit/abc123",
  "warnings": []
}
```

### `unlinkRepo`

Unlink the group's GitHub repository (group admin only). Stops all auto-commits and prompt injection. Nothing in the repo is deleted; the config is retired and a new repo can be linked afterwards.

**Returns:**

`AdapterOperationResult`: Returns: unlinked (true), owner, repo

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"github","method":"unlinkRepo","params":{}}' | jq .
```

**Example response:**

```json
{
  "unlinked": true,
  "owner": "Oz-Networks",
  "repo": "fxn-monorepo"
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `getRepoStatus`

Get the group's repo link status: config (owner/repo, basePath, promptFiles, autoSync) plus a live connectivity check against GitHub. Returns linked: false (not an error) when no repo is linked — use this to check before reading/writing.

**Returns:**

`AdapterOperationResult`: Returns: linked (boolean). When true: status ("active"|"revoked"|"error"), owner, repo, installationId, defaultBranch, basePath, promptFiles, autoSync ({ calls, chatDigest }), lastError?, live ({ ok, error? })

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"github","method":"getRepoStatus","params":{}}' | jq .
```

**Example response:**

```json
{
  "linked": true,
  "status": "active",
  "owner": "Oz-Networks",
  "repo": "fxn-monorepo",
  "installationId": 12345678,
  "defaultBranch": "main",
  "basePath": ".mirra",
  "promptFiles": [
    ".mirra/CONTEXT.md"
  ],
  "autoSync": {
    "calls": true,
    "chatDigest": "off"
  },
  "live": {
    "ok": true
  }
}
```

### `updateRepoSettings`

Update the group's repo link settings (group admin only): basePath (write confinement dir), promptFiles (injected into group AI context), autoSync toggles.

**Arguments:**

- `basePath` (string, *optional*): New write-confinement directory (no leading slash, no "..")
- `promptFiles` (array, *optional*): Repo paths to inject into the group prompt (max 5)
- `autoSync` (object, *optional*): { calls?: boolean, chatDigest?: "off" | "daily" | "weekly" }

**Returns:**

`AdapterOperationResult`: Returns: updated (true), basePath, promptFiles, autoSync ({ calls, chatDigest })

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"github","method":"updateRepoSettings","params":{"autoSync":{"chatDigest":"weekly"}}}' | jq .
```

**Example response:**

```json
{
  "updated": true,
  "basePath": ".mirra",
  "promptFiles": [
    ".mirra/CONTEXT.md"
  ],
  "autoSync": {
    "calls": true,
    "chatDigest": "weekly"
  }
}
```

### `readFile`

Read a file from anywhere in the group's linked repo (reads are repo-wide, not confined to basePath). Use for requirements, docs, CONTEXT.md, code — the same files the team's Claude Code reads. Content over 200k characters is truncated with a marker.

**Arguments:**

- `path` (string, **required**): File path from repo root, e.g. "docs/requirements.md" or ".mirra/CONTEXT.md"
- `ref` (string, *optional*): Branch, tag, or commit SHA (default: the repo's default branch)

**Returns:**

`AdapterOperationResult`: Returns: path, content (string), size (bytes), truncated (boolean), ref

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"github","method":"readFile","params":{"path":".mirra/CONTEXT.md"}}' | jq .
```

**Example response:**

```json
{
  "path": ".mirra/CONTEXT.md",
  "content": "# Project Alpha — Context\n\nGoals: ...",
  "size": 1832,
  "truncated": false,
  "ref": "main"
}
```

### `listFiles`

List files in a directory of the linked repo (repo-wide). Pass recursive: true to walk the whole subtree (capped at 500 entries).

**Arguments:**

- `path` (string, *optional*): Directory path from repo root (default: repo root)
- `ref` (string, *optional*): Branch, tag, or commit SHA (default: default branch)
- `recursive` (boolean, *optional*): Walk the subtree recursively (default false)

**Returns:**

`AdapterOperationResult`: Returns: path, entries (array of { path, name, type: "file"|"dir", size? }), count, truncated (boolean)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"github","method":"listFiles","params":{"path":".mirra/calls","recursive":true}}' | jq .
```

**Example response:**

```json
{
  "path": ".mirra/calls",
  "entries": [
    {
      "path": ".mirra/calls/2026/07/20-1030-standup.md",
      "name": "20-1030-standup.md",
      "type": "file",
      "size": 4210
    }
  ],
  "count": 1,
  "truncated": false
}
```

### `writeFile`

Create or update a single file in the group's repo. Writes are CONFINED to the group's basePath (default ".mirra/") — pass a path relative to basePath (e.g. "decisions/2026-07-20-auth.md") or the full confined path (".mirra/decisions/2026-07-20-auth.md"). Commits directly to the default branch as mirra[bot]. Use commitFiles for atomic multi-file commits.

**Arguments:**

- `path` (string, **required**): File path — relative to basePath, or an absolute repo path already under basePath
- `content` (string, **required**): Full file content (max 1MB)
- `message` (string, *optional*): Commit message (default: "mirra: update {path}")

**Returns:**

`AdapterOperationResult`: Returns: path (resolved repo path), commitSha, commitUrl, fileUrl, created (true if new file, false if updated)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"github","method":"writeFile","params":{"path":"decisions/2026-07-20-auth-provider.md","content":"# Decision: Auth provider\n\nWe chose ...","message":"mirra: record auth provider decision"}}' | jq .
```

**Example response:**

```json
{
  "path": ".mirra/decisions/2026-07-20-auth-provider.md",
  "commitSha": "a1b2c3d4e5f6",
  "commitUrl": "https://github.com/Oz-Networks/fxn-monorepo/commit/a1b2c3d4e5f6",
  "fileUrl": "https://github.com/Oz-Networks/fxn-monorepo/blob/main/.mirra/decisions/2026-07-20-auth-provider.md",
  "created": true
}
```

### `commitFiles`

Commit multiple files atomically in ONE commit (Git Data API). Same basePath confinement as writeFile. Use for backfills and multi-file updates so the repo history stays clean. skipExisting: true leaves already-existing files untouched (useful for idempotent seeding).

**Arguments:**

- `files` (array, **required**): Array of { path, content } (max 50 files, 5MB total). Paths relative to basePath or already under it.
- `message` (string, **required**): Commit message
- `skipExisting` (boolean, *optional*): Skip files that already exist in the repo (default false)

**Returns:**

`AdapterOperationResult`: Returns: commitSha, commitUrl, committedPaths (string[]), skippedPaths (string[]), fileCount. commitSha/commitUrl are empty strings when every file was skipped (no commit made).

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"github","method":"commitFiles","params":{"files":[{"path":"calls/2026/07/18-1400-planning.md","content":"---\ntype: call\n---\n# Summary\n..."},{"path":"calls/2026/07/19-0930-standup.md","content":"---\ntype: call\n---\n# Summary\n..."}],"message":"mirra: backfill call notes (2 calls)"}}' | jq .
```

**Example response:**

```json
{
  "commitSha": "f6e5d4c3b2a1",
  "commitUrl": "https://github.com/Oz-Networks/fxn-monorepo/commit/f6e5d4c3b2a1",
  "committedPaths": [
    ".mirra/calls/2026/07/18-1400-planning.md",
    ".mirra/calls/2026/07/19-0930-standup.md"
  ],
  "skippedPaths": [],
  "fileCount": 2
}
```

### `deleteFile`

Delete a file from the group's repo. Confined to basePath — only Mirra-managed files can be deleted, never the team's code. Requires user confirmation (risky operation).

**Arguments:**

- `path` (string, **required**): File path — relative to basePath, or an absolute repo path already under basePath
- `message` (string, *optional*): Commit message (default: "mirra: delete {path}")

**Returns:**

`AdapterOperationResult`: Returns: path (resolved repo path), deleted (true), commitSha, commitUrl

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"github","method":"deleteFile","params":{"path":"decisions/2026-06-01-old-plan.md"}}' | jq .
```

**Example response:**

```json
{
  "path": ".mirra/decisions/2026-06-01-old-plan.md",
  "deleted": true,
  "commitSha": "0a1b2c3d4e5f",
  "commitUrl": "https://github.com/Oz-Networks/fxn-monorepo/commit/0a1b2c3d4e5f"
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `getRecentCommits`

List recent commits on the default branch (repo-wide), optionally filtered to a path. Answers "what changed in the repo lately?".

**Arguments:**

- `path` (string, *optional*): Only commits touching this path (e.g. ".mirra/" or "src/")
- `limit` (number, *optional*): Max commits to return (default 10, max 50)

**Returns:**

`AdapterOperationResult`: Returns: commits (array of { sha, message, author, date, commitUrl }), count

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"github","method":"getRecentCommits","params":{"limit":5}}' | jq .
```

**Example response:**

```json
{
  "commits": [
    {
      "sha": "a1b2c3d",
      "message": "mirra: call notes — sprint planning",
      "author": "mirra[bot]",
      "date": "2026-07-20T18:10:00Z",
      "commitUrl": "https://github.com/Oz-Networks/fxn-monorepo/commit/a1b2c3d4e5f6"
    }
  ],
  "count": 1
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
