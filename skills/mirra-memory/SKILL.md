---
name: mirra-memory
description: "Use Mirra to internal memory and knowledge graph management. Covers all Memory SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Memory

Internal memory and knowledge graph management

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
    "resourceId": "memory",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/memory/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `create` | Create a new memory entity in the knowledge graph. Use the type field to specify what kind of mem... |
| `createTask` | Create a task in the knowledge graph. Tasks are a specialized memory type with assignment, timing... |
| `search` | Semantic search across memory entities with advanced filtering. IMPORTANT: Search results return ... |
| `query` | Query memory entities with filters. Returns lightweight summaries with TRUNCATED content (max 200... |
| `findOne` | Find a single entity by ID or name. Returns the FULL untruncated entity content. Use this after `... |
| `update` | Update an existing memory entity. Works with all memory types including tasks created via createT... |
| `delete` | Delete a memory entity. Works with all memory types including tasks, notes, ideas, etc. |
| `share` | Share a memory entity with another graph (group or contact). Only the creator can share memories.... |
| `unshare` | Remove sharing of a memory entity from a graph. Only the creator can unshare. Cannot unshare from... |
| `listGraphs` | List all graphs a memory entity is shared with, including share history and metadata. |

## Operation Details

### `create`

Create a new memory entity in the knowledge graph. Use the type field to specify what kind of memory (note, idea, shopping_item, etc.). For tasks with assignment or timing features, use `createTask` instead. All memory types can be queried, updated, and deleted using the standard operations.

**Arguments:**

- `type` (string, **required**): Memory subtype: "note" (general notes), "idea" (concepts/ideas), "shopping_item" (shopping list), "topic" (general knowledge), "document" (documents), "contact" (people), "event" (calendar items). For tasks with assignment, use createTask instead.
- `name` (string, *optional*): Short display title/name for the memory (max ~80 chars). Should be a concise summary distinct from the full content. If omitted, a title is auto-extracted from content.
- `content` (string, **required**): Main content/description of the memory. Can be longer markdown text with full details.
- `metadata` (object, *optional*): Additional metadata (e.g., priority, deadline, tags, etc.)
- `tags` (array, *optional*): Tags for organizing the memory. Shorthand for metadata.tags.
- `groupId` (string, *optional*): Group ID to scope the memory to a specific group. If omitted, memory is created in the user's personal graph.

**Returns:**

`AdapterOperationResult`: Wraps result in AdapterOperationResult: { id, status, timestamp, data: { ...fields } }. The data field contains: id, type, name, content, status, priority, graphId, createdAt, createdByUserId, createdByName, tags[].

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"memory","method":"create","params":{"type":"note","name":"Product sync meeting notes","content":"Discussed Q2 roadmap priorities. Team agreed to focus on mobile performance and new onboarding flow. Follow-up meeting scheduled for next Thursday."}}' | jq .
```

**Example response:**

```json
{
  "id": "note_123",
  "type": "note",
  "name": "Product sync meeting notes",
  "content": "Discussed Q2 roadmap priorities. Team agreed to focus on mobile performance and new onboarding flow. Follow-up meeting scheduled for next Thursday.",
  "status": "",
  "priority": "",
  "graphId": "user_001",
  "createdAt": "2024-01-15T10:00:00Z",
  "createdByUserId": "user_001",
  "createdByName": "john",
  "tags": []
}
```

### `createTask`

Create a task in the knowledge graph. Tasks are a specialized memory type with assignment, timing, priority, and status lifecycle. Use this instead of `create` when you need task-specific features like assigning to users. Tasks can be queried, updated, and deleted using the standard memory operations (`query`, `update`, `delete`) with type="task". For group contexts, the task is stored in the group's shared graph.

**Arguments:**

- `name` (string, *optional*): Short task title for display (max ~80 chars). Concise summary of what needs to be done. If omitted, a title is auto-extracted from content.
- `content` (string, **required**): Full task description with details. IMPORTANT: Write task content from a neutral perspective without possessive pronouns (his/her/their). The assignee will see this exact text, so "fold dresses" is correct, NOT "fold her dresses". Avoid phrases like "remind him to", "help her with", etc.
- `assignedTo` (string, *optional*): Username of the person to assign this task to (group contexts only). System resolves username to user ID.
- `dueAt` (string, *optional*): Due date/time in ISO 8601 format (e.g., "2024-01-15T10:00:00Z") or natural language that will be parsed
- `priority` (string, *optional*): Task priority: "high", "medium", or "low"
- `tags` (array, *optional*): Tags/labels for categorization (e.g., ["work", "urgent"])

**Returns:**

`AdapterOperationResult`: Wraps result in AdapterOperationResult: { id, status, timestamp, data: { ...fields } }. The data field contains: id, type, content, status, priority, graphId, createdAt, createdByUserId, createdByName, assignedToUserId, assignedToName, assignmentWarning, dueAt, tags[].

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"memory","method":"createTask","params":{"name":"Review quarterly report","content":"Review the Q2 quarterly report and flag any discrepancies in the revenue figures before the board meeting."}}' | jq .
```

**Example response:**

```json
{
  "id": "task_123",
  "type": "task",
  "name": "Review quarterly report",
  "content": "Review the Q2 quarterly report and flag any discrepancies in the revenue figures before the board meeting.",
  "status": "pending",
  "priority": "medium",
  "graphId": "user_001",
  "createdAt": "2024-01-15T10:00:00Z",
  "createdByUserId": "user_001",
  "createdByName": "john",
  "assignedToUserId": "",
  "assignedToName": "",
  "assignmentWarning": "",
  "dueAt": "",
  "tags": []
}
```

### `search`

Semantic search across memory entities with advanced filtering. IMPORTANT: Search results return TRUNCATED content (max 300 chars) to prevent huge payloads. To get the full untruncated text of a specific entity, use `findOne` with the entity ID after searching. Recommended workflow: (1) Use `search` to find matching entities, (2) Use `findOne` with { filters: { id: "entity_id" } } to retrieve full content for entities you need.

**Arguments:**

- `query` (string, **required**): Search query text for semantic matching
- `types` (array, *optional*): Filter by entity types (e.g., ["TASK", "NOTE", "IDEA"])
- `startTime` (number, *optional*): Filter entities created after this timestamp (Unix milliseconds)
- `endTime` (number, *optional*): Filter entities created before this timestamp (Unix milliseconds)
- `propertyFilters` (object, *optional*): Filter by entity properties: { status: ["completed"], tags: ["urgent"], priority: ["high"], roles: ["task"], contexts: ["work"] }
- `limit` (number, *optional*): Maximum number of results (default: 20, max: 100)

**Returns:**

`AdapterOperationResult`: Wraps result in AdapterOperationResult: { id, status, timestamp, data: { ...fields } }. The data field contains: query, totalCount, count, offset, limit, results[]. Each result has FLAT fields: id, type, name, description (truncated), status, priority, graphId, createdAt, score.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"memory","method":"search","params":{"query":"quarterly product review meeting"}}' | jq .
```

**Example response:**

```json
{
  "query": "quarterly product review meeting",
  "totalCount": 2,
  "count": 2,
  "offset": 0,
  "limit": 20,
  "results": [
    {
      "id": "note_123",
      "type": "note",
      "name": "Q3 Product Review",
      "description": "Discussion points from the quarterly...",
      "status": "",
      "priority": "",
      "graphId": "user_001",
      "createdAt": "2024-01-15T10:00:00Z",
      "score": 0.89
    },
    {
      "id": "note_456",
      "type": "note",
      "name": "Product Roadmap Meeting",
      "description": "Review of upcoming features...",
      "status": "",
      "priority": "",
      "graphId": "user_001",
      "createdAt": "2024-01-14T09:00:00Z",
      "score": 0.75
    }
  ]
}
```

### `query`

Query memory entities with filters. Returns lightweight summaries with TRUNCATED content (max 200 chars) to prevent large payloads. Use type="task" to list all tasks (including those created via createTask). To get full untruncated content for a specific entity, use `findOne` with the entity ID.

**Arguments:**

- `type` (string, *optional*): Semantic type filter (e.g., "task", "note", "idea", "reminder", "contact", "document"). Matches against entityType, meta_item_type, subType, or semantic_roles
- `filters` (object, *optional*): Additional filters (not yet implemented)
- `limit` (number, *optional*): Maximum results (default: 20, max: 100)
- `offset` (number, *optional*): Pagination offset for fetching more results (default: 0)

**Returns:**

`AdapterOperationResult`: Wraps result in AdapterOperationResult: { id, status, timestamp, data: { ...fields } }. The data field contains: type, totalCount, count, offset, limit, results[]. Each result has FLAT fields: id, type, name, description (truncated), status, priority, graphId, createdAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"memory","method":"query","params":{"type":"task","limit":20}}' | jq .
```

**Example response:**

```json
{
  "type": "task",
  "totalCount": 2,
  "count": 2,
  "offset": 0,
  "limit": 20,
  "results": [
    {
      "id": "task_123",
      "type": "task",
      "name": "Review report",
      "description": "Review the quarterly report...",
      "status": "pending",
      "priority": "medium",
      "graphId": "user_001",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "task_456",
      "type": "task",
      "name": "Prepare slides",
      "description": "Prepare presentation slides...",
      "status": "pending",
      "priority": "high",
      "graphId": "group_789",
      "createdAt": "2024-01-14T09:00:00Z"
    }
  ]
}
```

### `findOne`

Find a single entity by ID or name. Returns the FULL untruncated entity content. Use this after `search` or `query` to retrieve complete content for a specific entity (since those operations return truncated results to prevent large payloads).

**Arguments:**

- `filters` (object, **required**): Filter criteria. Use { id: "entity_id" } to find by ID (recommended), or { name: "entity name" } to find by name.

**Returns:**

`AdapterOperationResult`: Wraps result in AdapterOperationResult: { id, status, timestamp, data: { ...fields } }. The data field contains: id, type, name, content (full), status, priority, graphId, createdAt, updatedAt, createdByUserId, createdByName, assignedToUserId, assignedToName, dueAt, tags[]. Null if not found.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"memory","method":"findOne","params":{"filters":{"id":"note_123"}}}' | jq .
```

**Example response:**

```json
{
  "id": "note_123",
  "type": "note",
  "name": "Q3 Product Review",
  "content": "Full meeting notes with all details, action items, decisions made, attendees list, and follow-up tasks...",
  "status": "",
  "priority": "",
  "graphId": "user_001",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "",
  "createdByUserId": "user_001",
  "createdByName": "john",
  "assignedToUserId": "",
  "assignedToName": "",
  "dueAt": "",
  "tags": []
}
```

### `update`

Update an existing memory entity. Works with all memory types including tasks created via createTask. Use this to mark tasks complete, update content, or modify metadata.

**Arguments:**

- `id` (string, **required**): Entity ID to update
- `type` (string, *optional*): Entity type
- `name` (string, *optional*): Updated display title/name
- `content` (string, *optional*): Updated content
- `metadata` (object, *optional*): Updated metadata

**Returns:**

`AdapterOperationResult`: Wraps result in AdapterOperationResult: { id, status, timestamp, data: { ...fields } }. The data field contains: id, updated, updatedAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"memory","method":"update","params":{"id":"task_123","metadata":{"status":"completed"}}}' | jq .
```

**Example response:**

```json
{
  "id": "task_123",
  "updated": true,
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

### `delete`

Delete a memory entity. Works with all memory types including tasks, notes, ideas, etc.

**Arguments:**

- `id` (string, **required**): Entity ID to delete

**Returns:**

`AdapterOperationResult`: Wraps result in AdapterOperationResult: { id, status, timestamp, data: { ...fields } }. The data field contains: id, deleted, deletedAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"memory","method":"delete","params":{"id":"task_123"}}' | jq .
```

**Example response:**

```json
{
  "id": "task_123",
  "deleted": true,
  "deletedAt": "2024-01-15T11:00:00Z"
}
```

### `share`

Share a memory entity with another graph (group or contact). Only the creator can share memories. Recipients can view and complete tasks but cannot edit or delete.

**Arguments:**

- `entityId` (string, **required**): Entity ID to share
- `targetGraphId` (string, **required**): Target graph ID to share with (group ID or user contact graph ID)
- `shareReason` (string, *optional*): Optional reason for sharing

**Returns:**

`AdapterOperationResult`: Wraps result in AdapterOperationResult: { id, status, timestamp, data: { ...fields } }. The data field contains: entityId, success, message, graphIds[], targetGraphId, sharedAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"memory","method":"share","params":{"entityId":"task_123","targetGraphId":"group_456"}}' | jq .
```

**Example response:**

```json
{
  "entityId": "task_123",
  "success": true,
  "message": "Memory shared successfully",
  "graphIds": [
    "user_001",
    "group_456"
  ],
  "targetGraphId": "group_456",
  "sharedAt": "2024-01-15T11:00:00Z"
}
```

### `unshare`

Remove sharing of a memory entity from a graph. Only the creator can unshare. Cannot unshare from the primary graph (where it was created).

**Arguments:**

- `entityId` (string, **required**): Entity ID to unshare
- `graphId` (string, **required**): Graph ID to remove sharing from

**Returns:**

`AdapterOperationResult`: Wraps result in AdapterOperationResult: { id, status, timestamp, data: { ...fields } }. The data field contains: entityId, success, message, graphIds[], removedGraphId.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"memory","method":"unshare","params":{"entityId":"task_123","graphId":"group_456"}}' | jq .
```

**Example response:**

```json
{
  "entityId": "task_123",
  "success": true,
  "message": "Memory unshared successfully",
  "graphIds": [
    "user_001"
  ],
  "removedGraphId": "group_456"
}
```

### `listGraphs`

List all graphs a memory entity is shared with, including share history and metadata.

**Arguments:**

- `entityId` (string, **required**): Entity ID to list graphs for

**Returns:**

`AdapterOperationResult`: Returns { entityId, primaryGraphId, totalGraphs, graphs[] }. Each graph has FLAT fields: graphId, graphType, graphName, isPrimary, sharedAt, sharedByUserId. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"memory","method":"listGraphs","params":{"entityId":"task_123"}}' | jq .
```

**Example response:**

```json
{
  "entityId": "task_123",
  "primaryGraphId": "user_001",
  "totalGraphs": 2,
  "graphs": [
    {
      "graphId": "user_001",
      "graphType": "personal",
      "graphName": "My Graph",
      "isPrimary": true,
      "sharedAt": "",
      "sharedByUserId": ""
    },
    {
      "graphId": "group_456",
      "graphType": "group",
      "graphName": "Family",
      "isPrimary": false,
      "sharedAt": "2024-01-15T11:00:00Z",
      "sharedByUserId": "user_001"
    }
  ]
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
