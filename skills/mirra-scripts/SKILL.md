---
name: mirra-scripts
description: "Use Mirra to execute user-defined scripts in aws lambda. Covers all Scripts SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Scripts

Execute user-defined scripts in AWS Lambda

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
    "resourceId": "scripts",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/scripts/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `createScript` | Create a new script with initial version and API key. Returns flat structure with id field for su... |
| `deleteScript` | Delete a script and all its versions. Returns flat deletion confirmation. |
| `createVersion` | Create a new version by replacing the ENTIRE script code. For small changes, prefer editScriptCod... |
| `listVersions` | List all versions of a script. Returns flat version structures. |
| `deployScript` | Deploy a script version to AWS Lambda. Must be called after createScript to make the script execu... |
| `executeScript` | Execute a deployed script with custom data. Script must be deployed first via deployScript. Retur... |
| `getScript` | Get details of a specific script. Returns flat normalized structure. |
| `listScripts` | List all scripts owned by the user. Returns flat script summaries. |
| `getExecutions` | Get execution history for a script. Returns flat execution summaries. |
| `getExecution` | Get details of a specific execution. Returns flat execution structure. |
| `publishScript` | Publish a script to the marketplace. Returns flat publish confirmation. |
| `unpublishScript` | Remove a script from the marketplace. Returns flat unpublish confirmation. |
| `listMarketplaceScripts` | Search and list published scripts in the marketplace. Returns flat script summaries with pagination. |
| `getMetrics` | Get execution metrics for a script. Returns flat metrics structure. |
| `createWebhook` | Create a webhook endpoint for the script. Returns flat webhook details. |
| `createSchedule` | Create a cron schedule for the script. Returns flat schedule details. |
| `getFlowScript` | Get the script code for a specific flow. Returns flat flow script structure. |
| `modifyFlowScript` | Replace the ENTIRE script code for a flow. For small changes, prefer editScriptCode or editFlowSc... |
| `readScriptCode` | Read the active version's code for a script with line numbers. Supports optional line range. Use ... |
| `editScriptCode` | Apply surgical edits to a script's active code using oldText/newText pairs. Each edit replaces an... |
| `lintScript` | Validate script code BEFORE creating or deploying. Checks for: 1) Missing async handler wrapper (... |

## Operation Details

### `createScript`

Create a new script with initial version and API key. Returns flat structure with id field for subsequent operations.

**Arguments:**

- `name` (string, **required**): Name of the script
- `description` (string, *optional*): Description of what the script does
- `runtime` (string, *optional*): Lambda runtime (default: nodejs18)
- `config` (object, *optional*): Script configuration (timeout, memory, maxCostPerExecution, etc.)
- `code` (string, *optional*): Initial JavaScript/TypeScript code for the script. Required unless path is provided.
- `path` (string, *optional*): Path to a script file in the workspace container (e.g., "/workspace/scripts/handler.js"). If provided, code is read from this file. Optionally reads mirra.json from the same directory for config.

**Returns:**

`object`: Returns FLAT structure: { id, name, description, runtime, timeout, memory, activeVersion, isPublished, isPrivate, status, deploymentStatus, apiKey, installationId, createdAt }. Use data.id as scriptId for deployScript.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"createScript","params":{"name":"Daily Report","description":"Sends a daily summary report","path":"/workspace/scripts/daily-report.js"}}' | jq .
```

**Example response:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Daily Report",
  "description": "Sends a daily summary report",
  "runtime": "nodejs18",
  "timeout": 30,
  "memory": 256,
  "activeVersion": 1,
  "isPublished": false,
  "isPrivate": false,
  "status": "draft",
  "deploymentStatus": "pending",
  "apiKey": "mirra_script_abc123...",
  "installationId": "507f1f77bcf86cd799439012",
  "createdAt": "2024-12-08T10:00:00Z"
}
```

### `deleteScript`

Delete a script and all its versions. Returns flat deletion confirmation.

**Arguments:**

- `scriptId` (string, **required**): ID of the script to delete

**Returns:**

`object`: Returns FLAT structure: { deleted, scriptId, hardDeleted, installationsRemoved, preservedInstallations }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"deleteScript","params":{"scriptId":"507f1f77bcf86cd799439011"}}' | jq .
```

**Example response:**

```json
{
  "deleted": true,
  "scriptId": "507f1f77bcf86cd799439011",
  "hardDeleted": true,
  "installationsRemoved": 1,
  "preservedInstallations": 0
}
```

### `createVersion`

Create a new version by replacing the ENTIRE script code. For small changes, prefer editScriptCode instead — it only requires the changed portions. Returns flat version details.

**Arguments:**

- `scriptId` (string, **required**): ID of the script
- `code` (string, **required**): Updated code for the new version
- `commitMessage` (string, *optional*): Description of changes in this version

**Returns:**

`object`: Returns FLAT structure: { id, scriptId, version, isActive, commitMessage, codeHash, createdAt, deployedAt }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"createVersion","params":{"scriptId":"507f1f77bcf86cd799439011","code":"export async function handler(event) { /* fixed code */ }","commitMessage":"Fixed error handling"}}' | jq .
```

**Example response:**

```json
{
  "id": "507f1f77bcf86cd799439013",
  "scriptId": "507f1f77bcf86cd799439011",
  "version": 2,
  "isActive": false,
  "commitMessage": "Fixed error handling",
  "codeHash": "abc123...",
  "createdAt": "2024-12-08T10:30:00Z",
  "deployedAt": ""
}
```

### `listVersions`

List all versions of a script. Returns flat version structures.

**Arguments:**

- `scriptId` (string, **required**): ID of the script

**Returns:**

`object`: Returns { count, versions[] }. Each version has FLAT fields: id, scriptId, version, isActive, commitMessage, codeHash, createdAt, deployedAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"listVersions","params":{"scriptId":"507f1f77bcf86cd799439011"}}' | jq .
```

**Example response:**

```json
{
  "count": 2,
  "versions": [
    {
      "id": "...",
      "scriptId": "507f1f77bcf86cd799439011",
      "version": 2,
      "isActive": true,
      "commitMessage": "Fixed error handling",
      "codeHash": "abc...",
      "createdAt": "2024-12-08T10:30:00Z",
      "deployedAt": "2024-12-08T11:00:00Z"
    },
    {
      "id": "...",
      "scriptId": "507f1f77bcf86cd799439011",
      "version": 1,
      "isActive": false,
      "commitMessage": "Initial version",
      "codeHash": "def...",
      "createdAt": "2024-12-08T10:00:00Z",
      "deployedAt": ""
    }
  ]
}
```

### `deployScript`

Deploy a script version to AWS Lambda. Must be called after createScript to make the script executable.

**Arguments:**

- `scriptId` (string, **required**): ID of the script to deploy (from createScript response at data._id)
- `version` (number, *optional*): Version number to deploy (default: latest)

**Returns:**

`object`: Returns { success: true, data: { scriptId, version, lambdaFunctionName, lambdaArn, deployedAt } }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"deployScript","params":{"scriptId":"507f1f77bcf86cd799439011"}}' | jq .
```

**Example response:**

```json
{
  "scriptId": "507f1f77bcf86cd799439011",
  "version": 2,
  "lambdaFunctionName": "mirra-script-...",
  "lambdaArn": "arn:aws:lambda:...",
  "deployedAt": "2024-12-08T10:30:00Z"
}
```

### `executeScript`

Execute a deployed script with custom data. Script must be deployed first via deployScript. Returns flat execution result.

**Arguments:**

- `scriptId` (string, **required**): ID of the script to execute (from createScript response at data.id)
- `data` (object, *optional*): Input data to pass to the script
- `trigger` (object, *optional*): Trigger information (type, source, event)

**Returns:**

`object`: Returns FLAT structure: { executionId, scriptId, status, output, duration, logs[], error, createdAt }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"executeScript","params":{"scriptId":"507f1f77bcf86cd799439011","data":{"userId":"123","reportType":"weekly"}}}' | jq .
```

**Example response:**

```json
{
  "executionId": "exec_507f1f77bcf86cd799439015",
  "scriptId": "507f1f77bcf86cd799439011",
  "status": "completed",
  "output": {
    "message": "Report generated"
  },
  "duration": 1250,
  "logs": [
    "Starting report generation...",
    "Report complete"
  ],
  "error": "",
  "createdAt": "2024-12-08T10:35:00Z"
}
```

### `getScript`

Get details of a specific script. Returns flat normalized structure.

**Arguments:**

- `scriptId` (string, **required**): ID of the script

**Returns:**

`object`: Returns FLAT structure: { id, name, description, runtime, timeout, memory, activeVersion, isPublished, isPrivate, status, deploymentStatus, lambdaFunctionName, lambdaArn, totalExecutions, totalCost, avgDuration, errorRate, createdAt, deployedAt, publishedAt, lastExecutedAt }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"getScript","params":{"scriptId":"507f1f77bcf86cd799439011"}}' | jq .
```

**Example response:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Daily Report",
  "description": "Sends a daily summary report",
  "runtime": "nodejs18",
  "timeout": 30,
  "memory": 256,
  "activeVersion": 2,
  "isPublished": false,
  "isPrivate": false,
  "status": "draft",
  "deploymentStatus": "deployed",
  "lambdaFunctionName": "mirra-script-...",
  "lambdaArn": "arn:aws:lambda:...",
  "totalExecutions": 150,
  "totalCost": 0.05,
  "avgDuration": 850,
  "errorRate": 0.02,
  "createdAt": "2024-12-08T10:00:00Z",
  "deployedAt": "2024-12-08T10:30:00Z",
  "publishedAt": "",
  "lastExecutedAt": "2024-12-08T15:00:00Z"
}
```

### `listScripts`

List all scripts owned by the user. Returns flat script summaries.

**Returns:**

`object`: Returns { count, scripts[] }. Each script has FLAT fields: id, name, description, activeVersion, isPublished, status, deploymentStatus, totalExecutions, createdAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"listScripts","params":{}}' | jq .
```

**Example response:**

```json
{
  "count": 2,
  "scripts": [
    {
      "id": "...",
      "name": "Daily Report",
      "description": "...",
      "activeVersion": 2,
      "isPublished": false,
      "status": "draft",
      "deploymentStatus": "deployed",
      "totalExecutions": 150,
      "createdAt": "2024-12-08T10:00:00Z"
    },
    {
      "id": "...",
      "name": "Data Processor",
      "description": "...",
      "activeVersion": 1,
      "isPublished": false,
      "status": "draft",
      "deploymentStatus": "pending",
      "totalExecutions": 0,
      "createdAt": "2024-12-09T10:00:00Z"
    }
  ]
}
```

### `getExecutions`

Get execution history for a script. Returns flat execution summaries.

**Arguments:**

- `scriptId` (string, **required**): ID of the script
- `status` (string, *optional*): Filter by status (completed, failed, running)
- `limit` (number, *optional*): Maximum number of executions to return (default: 100)

**Returns:**

`object`: Returns { scriptId, count, executions[] }. Each execution has FLAT fields: executionId, scriptId, status, duration, createdAt, hasError.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"getExecutions","params":{"scriptId":"507f1f77bcf86cd799439011","limit":10}}' | jq .
```

**Example response:**

```json
{
  "scriptId": "507f1f77bcf86cd799439011",
  "count": 2,
  "executions": [
    {
      "executionId": "exec_001",
      "scriptId": "507f1f77bcf86cd799439011",
      "status": "completed",
      "duration": 1250,
      "createdAt": "2024-12-08T15:00:00Z",
      "hasError": false
    },
    {
      "executionId": "exec_002",
      "scriptId": "507f1f77bcf86cd799439011",
      "status": "failed",
      "duration": 500,
      "createdAt": "2024-12-08T14:00:00Z",
      "hasError": true
    }
  ]
}
```

### `getExecution`

Get details of a specific execution. Returns flat execution structure.

**Arguments:**

- `executionId` (string, **required**): ID of the execution

**Returns:**

`object`: Returns FLAT structure: { executionId, scriptId, status, output, duration, logs[], error, createdAt }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"getExecution","params":{"executionId":"exec_123"}}' | jq .
```

**Example response:**

```json
{
  "executionId": "exec_123",
  "scriptId": "507f1f77bcf86cd799439011",
  "status": "completed",
  "output": {
    "message": "Success"
  },
  "duration": 1250,
  "logs": [
    "Log line 1",
    "Log line 2"
  ],
  "error": "",
  "createdAt": "2024-12-08T15:00:00Z"
}
```

### `publishScript`

Publish a script to the marketplace. Returns flat publish confirmation.

**Arguments:**

- `scriptId` (string, **required**): ID of the script to publish
- `pricing` (object, *optional*): Pricing configuration for the marketplace

**Returns:**

`object`: Returns FLAT structure: { scriptId, isPublished, status, publishedAt }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"publishScript","params":{"scriptId":"507f1f77bcf86cd799439011","pricing":{"type":"free"}}}' | jq .
```

**Example response:**

```json
{
  "scriptId": "507f1f77bcf86cd799439011",
  "isPublished": true,
  "status": "published",
  "publishedAt": "2024-12-08T12:00:00Z"
}
```

### `unpublishScript`

Remove a script from the marketplace. Returns flat unpublish confirmation.

**Arguments:**

- `scriptId` (string, **required**): ID of the script to unpublish

**Returns:**

`object`: Returns FLAT structure: { scriptId, unpublished }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"unpublishScript","params":{"scriptId":"507f1f77bcf86cd799439011"}}' | jq .
```

**Example response:**

```json
{
  "scriptId": "507f1f77bcf86cd799439011",
  "unpublished": true
}
```

### `listMarketplaceScripts`

Search and list published scripts in the marketplace. Returns flat script summaries with pagination.

**Arguments:**

- `name` (string, *optional*): Exact match on script name
- `system` (boolean, *optional*): Filter by system scripts (scope="system") when true, user scripts when false
- `search` (string, *optional*): Text search on name and description
- `tags` (array, *optional*): Filter by tags (matches scripts with any of the specified tags)
- `category` (string, *optional*): Filter by UI category (notification, data_sync, automation, utility, reporting)
- `pricingModel` (string, *optional*): Filter by pricing model (free, pay-per-execution, subscription)
- `staffPick` (boolean, *optional*): Filter to only staff-picked scripts when true
- `minRating` (number, *optional*): Minimum rating threshold (0-5)
- `requiredIntegrations` (array, *optional*): Filter by required integrations (e.g., ["telegram", "gmail"])
- `sortBy` (string, *optional*): Sort field: rating, installCount, trendingScore, publishedAt, name (default: rating)
- `sortOrder` (string, *optional*): Sort order: asc or desc (default: desc)
- `limit` (number, *optional*): Maximum number of results to return (default: 50, max: 100)
- `offset` (number, *optional*): Number of results to skip for pagination (default: 0)

**Returns:**

`object`: Returns { total, limit, offset, scripts[] }. Each script has FLAT fields: id, name, description, activeVersion, isPublished, status, deploymentStatus, totalExecutions, createdAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"listMarketplaceScripts","params":{}}' | jq .
```

**Example response:**

```json
{
  "total": 25,
  "limit": 50,
  "offset": 0,
  "scripts": [
    {
      "id": "...",
      "name": "Email Validator",
      "description": "...",
      "activeVersion": 1,
      "isPublished": true,
      "status": "published",
      "deploymentStatus": "deployed",
      "totalExecutions": 500,
      "createdAt": "2024-12-01T10:00:00Z"
    }
  ]
}
```

### `getMetrics`

Get execution metrics for a script. Returns flat metrics structure.

**Arguments:**

- `scriptId` (string, **required**): ID of the script

**Returns:**

`object`: Returns FLAT structure: { scriptId, totalExecutions, totalCost, avgDuration, successRate, errorRate, lastExecutedAt }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"getMetrics","params":{"scriptId":"507f1f77bcf86cd799439011"}}' | jq .
```

**Example response:**

```json
{
  "scriptId": "507f1f77bcf86cd799439011",
  "totalExecutions": 1250,
  "totalCost": 0.45,
  "avgDuration": 850,
  "successRate": 0.98,
  "errorRate": 0.02,
  "lastExecutedAt": "2024-12-08T15:30:00Z"
}
```

### `createWebhook`

Create a webhook endpoint for the script. Returns flat webhook details.

**Arguments:**

- `scriptId` (string, **required**): ID of the script
- `name` (string, **required**): Name of the webhook
- `enabled` (boolean, *optional*): Whether webhook is enabled (default: true)

**Returns:**

`object`: Returns FLAT structure: { scriptId, webhookUrl, webhookSecret, name, enabled }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"createWebhook","params":{"scriptId":"507f1f77bcf86cd799439011","name":"GitHub Deploy Hook"}}' | jq .
```

**Example response:**

```json
{
  "scriptId": "507f1f77bcf86cd799439011",
  "webhookUrl": "https://api.mirra.com/webhooks/...",
  "webhookSecret": "...",
  "name": "GitHub Deploy Hook",
  "enabled": true
}
```

### `createSchedule`

Create a cron schedule for the script. Returns flat schedule details.

**Arguments:**

- `scriptId` (string, **required**): ID of the script
- `name` (string, **required**): Name of the schedule
- `cronExpression` (string, **required**): Cron expression (e.g., "0 9 * * *" for daily at 9am)
- `enabled` (boolean, *optional*): Whether schedule is enabled (default: true)
- `data` (object, *optional*): Data to pass to the script on scheduled execution

**Returns:**

`object`: Returns FLAT structure: { scheduleId, scriptId, name, cronExpression, enabled }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"createSchedule","params":{"scriptId":"507f1f77bcf86cd799439011","name":"Daily Report Schedule","cronExpression":"0 9 * * *","data":{"reportType":"daily"}}}' | jq .
```

**Example response:**

```json
{
  "scheduleId": "sched_abc123",
  "scriptId": "507f1f77bcf86cd799439011",
  "name": "Daily Report Schedule",
  "cronExpression": "0 9 * * *",
  "enabled": true
}
```

### `getFlowScript`

Get the script code for a specific flow. Returns flat flow script structure.

**Arguments:**

- `flowId` (string, **required**): ID of the flow to get script code for

**Returns:**

`object`: Returns FLAT structure: { code, version, scriptId, scriptName, description, isOwned }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"getFlowScript","params":{"flowId":"507f1f77bcf86cd799439011"}}' | jq .
```

**Example response:**

```json
{
  "code": "export async function handler(event) { ... }",
  "version": 1,
  "scriptId": "507f1f77bcf86cd799439012",
  "scriptName": "Call Summary Generator",
  "description": "Generates call summaries",
  "isOwned": false
}
```

### `modifyFlowScript`

Replace the ENTIRE script code for a flow. For small changes, prefer editScriptCode or editFlowScript instead — they only require the changed portions. Use this only when rewriting more than ~50% of the code.

**Arguments:**

- `flowId` (string, **required**): ID of the flow to modify
- `newCode` (string, **required**): New code to deploy
- `commitMessage` (string, *optional*): Description of changes

**Returns:**

`object`: Returns FLAT structure: { copied, scriptId, versionId, version }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"modifyFlowScript","params":{"flowId":"507f1f77bcf86cd799439011","newCode":"export async function handler(event) { /* modified */ }","commitMessage":"Filter by current user only"}}' | jq .
```

**Example response:**

```json
{
  "copied": true,
  "scriptId": "507f1f77bcf86cd799439015",
  "versionId": "507f1f77bcf86cd799439016",
  "version": 1
}
```

### `readScriptCode`

Read the active version's code for a script with line numbers. Supports optional line range. Use this before editScriptCode to see the current code.

**Arguments:**

- `scriptId` (string, **required**): Script ID
- `startLine` (number, *optional*): First line to return (1-indexed). Default: 1
- `endLine` (number, *optional*): Last line to return (inclusive). Default: end of file

**Returns:**

`object`: Returns: { scriptId, version, totalLines, startLine, endLine, code (with line numbers) }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"readScriptCode","params":{"scriptId":"507f1f77bcf86cd799439011"}}' | jq .
```

**Example response:**

```json
{
  "scriptId": "507f1f77bcf86cd799439011",
  "version": 2,
  "totalLines": 30,
  "startLine": 1,
  "endLine": 30,
  "code": " 1\texport async function handler(event, context, mirra) {\n 2\t  ..."
}
```

### `editScriptCode`

Apply surgical edits to a script's active code using oldText/newText pairs. Each edit replaces an exact text match. Much more efficient than createVersion for small changes. Use readScriptCode first to see current code.

**Arguments:**

- `scriptId` (string, **required**): Script ID
- `edits` (array, **required**): Array of edits. Each: { oldText: string (exact match in current code), newText: string (replacement) }. Applied sequentially.
- `commitMessage` (string, *optional*): Description of changes

**Returns:**

`object`: Returns: { versionId, version, linesChanged }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"editScriptCode","params":{"scriptId":"507f1f77bcf86cd799439011","edits":[{"oldText":"cosnt result","newText":"const result"}],"commitMessage":"Fix typo"}}' | jq .
```

**Example response:**

```json
{
  "versionId": "507f1f77bcf86cd799439016",
  "version": 3,
  "linesChanged": 1
}
```

### `lintScript`

Validate script code BEFORE creating or deploying. Checks for: 1) Missing async handler wrapper (top-level await errors), 2) Invalid adapter operations, 3) Invalid event.data field access (when eventType provided). Returns flat validation results with suggestions for fixes. ALWAYS use this before createScript/modifyFlowScript.

**Arguments:**

- `code` (string, **required**): The script code to validate
- `eventType` (string, *optional*): Event type for event.data field validation (e.g., "telegram.message", "call.ended"). When provided, validates that event.data.fieldName accesses match the event type schema.
- `scriptInputSchema` (object, *optional*): Schema of scriptInput fields that will be on event.data at runtime. Keys are field names, values are { type: "string"|"number"|"boolean"|"object"|"array" }. When provided, event.data field errors are reported as errors instead of warnings.

**Returns:**

`object`: Returns FLAT structure: { valid, issueCount, issues[], callAdapterCallsCount, mirraSDKCallsCount }. Each issue has: severity, message, line, suggestion.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"scripts","method":"lintScript","params":{"code":"export async function handler(event, context, mirra) { const messages = await mirra.telegram.getChatMessages({ chatId: \"123\" }); return { messages }; }"}}' | jq .
```

**Example response:**

```json
{
  "valid": true,
  "issueCount": 0,
  "issues": [],
  "callAdapterCallsCount": 0,
  "mirraSDKCallsCount": 1
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
