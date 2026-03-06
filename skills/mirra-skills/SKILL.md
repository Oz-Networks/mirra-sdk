---
name: mirra-skills
description: "Use Mirra to manage reusable instruction bundles for agent execution. Covers all Skills SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Skills

Manage reusable instruction bundles for agent execution

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
| `listSkills` | List skills available to the user (built-in + user-created). |
| `getSkill` | Get full details of a skill by ID. |
| `createSkill` | Create a new user skill. |
| `updateSkill` | Update a user skill procedure, templates, or metadata. |
| `deleteSkill` | Delete a user skill. Cannot delete built-in skills. |
| `selectSkills` | Select relevant skills for an agent iteration. Returns ranked skills with full procedure text. |
| `recordSkillUsage` | Record that a skill was used during agent execution. |
| `getSkillUsage` | Get usage records for a skill or flow. |

## Operation Details

### `listSkills`

List skills available to the user (built-in + user-created).

**Arguments:**

- `category` (string, *optional*): Filter by category

**Returns:**

`AdapterOperationResult`: Returns { count, skills[] }. Each skill: { skillId, name, title, description, category, builtIn, usageCount }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"listSkills","params":{}}' | jq .
```

### `getSkill`

Get full details of a skill by ID.

**Arguments:**

- `skillId` (string, **required**): ID of the skill

**Returns:**

`AdapterOperationResult`: Returns full skill with procedure, templates, and examples.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"getSkill","params":{"skillId":"<ID>"}}' | jq .
```

### `createSkill`

Create a new user skill.

**Arguments:**

- `name` (string, **required**): Unique kebab-case name
- `title` (string, **required**): Human-readable title
- `description` (string, **required**): What this skill does
- `whenToUse` (string, **required**): Conditions for using this skill
- `whenNotToUse` (string, **required**): Conditions to avoid this skill
- `procedure` (array, **required**): Step-by-step procedure
- `category` (string, **required**): Skill category
- `tags` (array, *optional*): Tags for discovery

**Returns:**

`AdapterOperationResult`: Returns the created skill.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"createSkill","params":{"name":"<value>","title":"<value>","description":"<value>","whenToUse":"<value>","whenNotToUse":"<value>","procedure":[],"category":"<value>"}}' | jq .
```

### `updateSkill`

Update a user skill procedure, templates, or metadata.

**Arguments:**

- `skillId` (string, **required**): ID of the skill to update
- `updates` (object, **required**): Fields to update

**Returns:**

`AdapterOperationResult`: Returns the updated skill.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"updateSkill","params":{"skillId":"<ID>","updates":{}}}' | jq .
```

### `deleteSkill`

Delete a user skill. Cannot delete built-in skills.

**Arguments:**

- `skillId` (string, **required**): ID of the skill to delete

**Returns:**

`AdapterOperationResult`: Returns { success, deletedAt }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"deleteSkill","params":{"skillId":"<ID>"}}' | jq .
```

### `selectSkills`

Select relevant skills for an agent iteration. Returns ranked skills with full procedure text.

**Arguments:**

- `agentObjective` (string, **required**): The objective being pursued
- `currentPhase` (string, *optional*): Current execution phase
- `isLooping` (boolean, *optional*): Whether loop detection is active
- `budgetPercentage` (number, *optional*): Token budget used (0-100)
- `recentFailureCount` (number, *optional*): Number of recent failures
- `hasDelegation` (boolean, *optional*): Whether delegation is configured

**Returns:**

`AdapterOperationResult`: Returns { count, skills[] } with full procedure text for LLM context injection. Max 10 skills.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"selectSkills","params":{"agentObjective":"<value>"}}' | jq .
```

### `recordSkillUsage`

Record that a skill was used during agent execution.

**Arguments:**

- `skillId` (string, **required**): ID of the skill used
- `flowId` (string, **required**): ID of the agent flow
- `iteration` (number, **required**): Iteration number
- `outcome` (string, **required**): success or failure
- `notes` (string, *optional*): Optional notes

**Returns:**

`AdapterOperationResult`: Returns the created usage record.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"recordSkillUsage","params":{"skillId":"<ID>","flowId":"<ID>","iteration":10,"outcome":"<value>"}}' | jq .
```

### `getSkillUsage`

Get usage records for a skill or flow.

**Arguments:**

- `skillId` (string, *optional*): Filter by skill ID
- `flowId` (string, *optional*): Filter by flow ID
- `limit` (number, *optional*): Max records to return (default 20)

**Returns:**

`AdapterOperationResult`: Returns { count, usageRecords[] }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"skills","method":"getSkillUsage","params":{}}' | jq .
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
