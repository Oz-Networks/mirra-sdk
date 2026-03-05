---
name: mirra-jira
description: "Use Mirra to jira project management and issue tracking. Covers all Jira SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Jira

Jira project management and issue tracking

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Jira requires OAuth authentication. The user must have connected their Jira account in the Mirra app before these operations will work.

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `createIssue` | Create a new Jira issue |
| `searchIssues` | Search Jira issues using JQL. Returns normalized flat issue summaries. |
| `getIssue` | Get a specific Jira issue by key or ID. Returns normalized flat structure. |
| `updateIssue` | Update an existing Jira issue |
| `deleteIssue` | Delete a Jira issue |
| `addComment` | Add a comment to a Jira issue |
| `transitionIssue` | Transition a Jira issue to a different status |
| `assignIssue` | Assign a Jira issue to a user |
| `getProjects` | Get all accessible Jira projects. Returns normalized flat project structures. |
| `listProjects` | List all accessible Jira projects (alias for getProjects). Returns normalized flat structures. |
| `getProjectMetadata` | Get metadata for a specific Jira project. Returns normalized flat structures. |
| `getTransitions` | Get available transitions for a Jira issue. Returns normalized flat structures. |
| `listAssignableUsers` | List users that can be assigned to issues in a project |
| `getIssueTypes` | Get available issue types for a project. Returns normalized flat structures. |
| `discoverExtended` | Search Jira API for available operations beyond core tools |
| `executeExtended` | Execute a Jira API operation by operationId |

## Operation Details

### `createIssue`

Create a new Jira issue

**Arguments:**

- `projectKey` (string, **required**): Jira project key (e.g., "PROJ")
- `summary` (string, **required**): Issue summary/title
- `description` (string, *optional*): Issue description
- `issueType` (string, *optional*): Issue type (Task, Bug, Story, etc.)

**Returns:**

`AdapterOperationResult`: Created issue information

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/createIssue" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"projectKey":"<value>","summary":"<value>"}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `searchIssues`

Search Jira issues using JQL. Returns normalized flat issue summaries.

**Arguments:**

- `jql` (string, **required**): JQL query string
- `maxResults` (number, *optional*): Maximum number of results (default: 50, max: 100)

**Returns:**

`AdapterOperationResult`: Returns { jql, count, issues[] }. Each issue has FLAT fields: id, key, summary, status, statusId, issueType, issueTypeId, priority, priorityId, assignee, assigneeAccountId, projectKey, projectName, labels[], created, updated, isAssigned. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/searchIssues" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"jql":"<value>"}' | jq .
```

### `getIssue`

Get a specific Jira issue by key or ID. Returns normalized flat structure.

**Arguments:**

- `issueKey` (string, **required**): Issue key (e.g., "PROJ-123") or ID

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: id, key, summary, description, status, statusId, issueType, issueTypeId, priority, priorityId, assignee, assigneeAccountId, reporter, reporterAccountId, projectKey, projectName, projectId, labels[], created, updated, isAssigned, hasLabels. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/getIssue" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"issueKey":"<value>"}' | jq .
```

### `updateIssue`

Update an existing Jira issue

**Arguments:**

- `issueKey` (string, **required**): Issue key (e.g., "PROJ-123")
- `summary` (string, *optional*): New issue summary/title
- `description` (string, *optional*): New issue description

**Returns:**

`AdapterOperationResult`: Updated issue information

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/updateIssue" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"issueKey":"<value>"}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `deleteIssue`

Delete a Jira issue

**Arguments:**

- `issueKey` (string, **required**): Issue key (e.g., "PROJ-123")

**Returns:**

`AdapterOperationResult`: Deletion confirmation

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/deleteIssue" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"issueKey":"<value>"}' | jq .
```

### `addComment`

Add a comment to a Jira issue

**Arguments:**

- `issueKey` (string, **required**): Issue key (e.g., "PROJ-123")
- `comment` (string, **required**): Comment text

**Returns:**

`AdapterOperationResult`: Created comment information

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/addComment" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"issueKey":"<value>","comment":"<value>"}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `transitionIssue`

Transition a Jira issue to a different status

**Arguments:**

- `issueKey` (string, **required**): Issue key (e.g., "PROJ-123")
- `transitionId` (string, **required**): ID of the transition to perform

**Returns:**

`AdapterOperationResult`: Transition result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/transitionIssue" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"issueKey":"<value>","transitionId":"<ID>"}' | jq .
```

### `assignIssue`

Assign a Jira issue to a user

**Arguments:**

- `issueKey` (string, **required**): Issue key (e.g., "PROJ-123")
- `accountId` (string, **required**): Atlassian account ID of the assignee

**Returns:**

`AdapterOperationResult`: Assignment result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/assignIssue" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"issueKey":"<value>","accountId":"<ID>"}' | jq .
```

### `getProjects`

Get all accessible Jira projects. Returns normalized flat project structures.

**Returns:**

`AdapterOperationResult`: Returns { count, projects[] }. Each project has FLAT fields: id, key, name, projectTypeKey, leadName, leadAccountId. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/getProjects" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `listProjects`

List all accessible Jira projects (alias for getProjects). Returns normalized flat structures.

**Returns:**

`AdapterOperationResult`: Returns { count, projects[] }. Each project has FLAT fields: id, key, name, projectTypeKey, leadName, leadAccountId. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/listProjects" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getProjectMetadata`

Get metadata for a specific Jira project. Returns normalized flat structures.

**Arguments:**

- `projectKey` (string, **required**): Project key (e.g., "PROJ")

**Returns:**

`AdapterOperationResult`: Returns { projectKey, projectName, issueTypeCount, issueTypes[], priorityCount, priorities[] }. Each issueType has FLAT fields: id, name, description, isSubtask. Each priority has: id, name, description.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/getProjectMetadata" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"projectKey":"<value>"}' | jq .
```

### `getTransitions`

Get available transitions for a Jira issue. Returns normalized flat structures.

**Arguments:**

- `issueKey` (string, **required**): Issue key (e.g., "PROJ-123")

**Returns:**

`AdapterOperationResult`: Returns { issueKey, count, transitions[] }. Each transition has FLAT fields: id, name, toStatus, toStatusId. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/getTransitions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"issueKey":"<value>"}' | jq .
```

### `listAssignableUsers`

List users that can be assigned to issues in a project

**Arguments:**

- `projectKey` (string, **required**): Project key (e.g., "PROJ")

**Returns:**

`AdapterOperationResult`: Returns { projectKey, count, users[] }. Each user has: accountId, displayName, emailAddress, active.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/listAssignableUsers" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"projectKey":"<value>"}' | jq .
```

### `getIssueTypes`

Get available issue types for a project. Returns normalized flat structures.

**Arguments:**

- `projectKey` (string, **required**): Project key (e.g., "PROJ")

**Returns:**

`AdapterOperationResult`: Returns { projectKey, count, issueTypes[] }. Each issueType has FLAT fields: id, name, description, isSubtask. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/getIssueTypes" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"projectKey":"<value>"}' | jq .
```

### `discoverExtended`

Search Jira API for available operations beyond core tools

**Arguments:**

- `query` (string, **required**): Describe what you want to do (e.g., "add label to card")
- `limit` (number, *optional*): Max results to return (default 5)

**Returns:**

`AdapterOperationResult`: List of matching operations with their details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/discoverExtended" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"query":"search term"}' | jq .
```

### `executeExtended`

Execute a Jira API operation by operationId

**Arguments:**

- `operationId` (string, **required**): The operationId from discoverExtended results
- `pathParams` (object, *optional*): Path parameters, e.g., { id: "abc123" }
- `queryParams` (object, *optional*): Query string parameters
- `body` (object, *optional*): Request body for POST/PUT/PATCH operations

**Returns:**

`AdapterOperationResult`: API response data

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/jira/executeExtended" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"operationId":"<ID>"}' | jq .
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
