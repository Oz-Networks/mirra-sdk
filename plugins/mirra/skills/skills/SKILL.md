---
name: skills
description: "Use Mirra to read and write the procedures this space shares with its members' claude. Covers all Skills SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Skills

read and write the procedures this space shares with its members' Claude

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
    "resourceId": "skills",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/skills/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `listSkills` | List this space's procedures as a menu — one trigger line each, no bodies. Call this once per ses... |
| `getSkill` | Load one procedure by name. Returns the full markdown body — follow it. |
| `createSkill` | Write a new procedure into this space so teammates’ agents can run it. Write it from what actuall... |
| `updateSkill` | Revise a procedure in place. Any member of the space can improve any procedure. |
| `deleteSkill` | Delete a procedure from this space. |

## Operation Details

### `listSkills`

List this space's procedures as a menu — one trigger line each, no bodies. Call this once per session; load a body with getSkill only when a description matches what you are about to do.

**Returns:**

`AdapterOperationResult`: Returns { count, skills[] }. Each entry: { name, description, tags, updatedAt }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"listSkills","params":{}}' | jq .
```

### `getSkill`

Load one procedure by name. Returns the full markdown body — follow it.

**Arguments:**

- `name` (string, **required**): The procedure name, as returned by listSkills

**Returns:**

`AdapterOperationResult`: Returns { name, description, body, tags, authorUserId, updatedAt }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"getSkill","params":{"name":"<value>"}}' | jq .
```

### `createSkill`

Write a new procedure into this space so teammates’ agents can run it. Write it from what actually just happened, in the second person, addressed to another Claude.

**Arguments:**

- `name` (string, **required**): kebab-case, unique within the space (e.g. "qualify-inbound-lead")
- `description` (string, **required**): The trigger line: when another agent should load this. One sentence, concrete.
- `body` (string, **required**): Markdown. The procedure itself — steps, gotchas, what "done" looks like.
- `tags` (array, *optional*): Tags for discovery

**Returns:**

`AdapterOperationResult`: Returns the created procedure.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"createSkill","params":{"name":"<value>","description":"<value>","body":"<value>"}}' | jq .
```

### `updateSkill`

Revise a procedure in place. Any member of the space can improve any procedure.

**Arguments:**

- `name` (string, **required**): The procedure to update
- `description` (string, *optional*): New trigger line
- `body` (string, *optional*): New markdown body
- `tags` (array, *optional*): New tags

**Returns:**

`AdapterOperationResult`: Returns the updated procedure.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"updateSkill","params":{"name":"<value>"}}' | jq .
```

### `deleteSkill`

Delete a procedure from this space.

**Arguments:**

- `name` (string, **required**): The procedure to delete

**Returns:**

`AdapterOperationResult`: Returns { success, deletedAt }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"deleteSkill","params":{"name":"<value>"}}' | jq .
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
