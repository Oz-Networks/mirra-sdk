---
name: mirra-trello
description: "Use Mirra to trello project management and collaboration. Covers all Trello SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Trello

Trello project management and collaboration

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Trello requires OAuth authentication. The user must have connected their Trello account in the Mirra app before these operations will work.

## API Call Pattern

All operations use a single POST endpoint with the resource ID and method in the body:

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "resourceId": "trello",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/trello/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `getBoards` | Get all boards for the authenticated user |
| `getBoard` | Get a specific board by ID including its lists |
| `createCard` | Create a new card in a Trello list |
| `getCard` | Get a specific card by ID |
| `updateCard` | Update an existing card |
| `deleteCard` | Delete a card permanently |
| `createChecklist` | Create a new checklist on a card |
| `getChecklist` | Get a specific checklist by ID |
| `updateChecklist` | Update a checklist name |
| `deleteChecklist` | Delete a checklist from a card |
| `addCheckItem` | Add a check item to a checklist |
| `updateCheckItem` | Update a check item (name or completion state) |
| `deleteCheckItem` | Delete a check item from a checklist |
| `discoverExtended` | Search Trello API for available operations beyond core tools |
| `executeExtended` | Execute a Trello API operation by operationId |

## Operation Details

### `getBoards`

Get all boards for the authenticated user

**Returns:**

`AdapterOperationResult`: Returns { boards[], count }. Each board has FLAT fields: id, name, description, url, closed, starred, listCount. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"getBoards","params":{}}' | jq .
```

**Example response:**

```json
{
  "boards": [
    {
      "id": "123",
      "name": "My Board",
      "description": "Board description",
      "url": "https://trello.com/b/123",
      "closed": false,
      "starred": true,
      "listCount": 3
    }
  ],
  "count": 1
}
```

### `getBoard`

Get a specific board by ID including its lists

**Arguments:**

- `boardId` (string, **required**): The ID of the board to retrieve

**Returns:**

`AdapterOperationResult`: Returns FLAT board fields: id, name, description, url, closed, starred, lists[], listCount. Each list has FLAT fields: id, name, closed, position, boardId.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"getBoard","params":{"boardId":"123"}}' | jq .
```

**Example response:**

```json
{
  "id": "123",
  "name": "My Board",
  "description": "Board description",
  "url": "https://trello.com/b/123",
  "closed": false,
  "starred": true,
  "lists": [
    {
      "id": "list1",
      "name": "To Do",
      "closed": false,
      "position": 1,
      "boardId": "123"
    }
  ],
  "listCount": 1
}
```

### `createCard`

Create a new card in a Trello list

**Arguments:**

- `name` (string, **required**): Card name/title
- `idList` (string, **required**): ID of the list to add the card to
- `desc` (string, *optional*): Card description (supports markdown)
- `description` (string, *optional*): Card description (alias for "desc", supports markdown)

**Returns:**

`AdapterOperationResult`: Returns { card }. Card has FLAT fields: id, name, description, url, shortUrl, closed, position, listId, boardId, dueDate, dueComplete, labels[], checklistCount, attachmentCount, commentCount.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"createCard","params":{"name":"New Task","idList":"list123","description":"Task description"}}' | jq .
```

**Example response:**

```json
{
  "card": {
    "id": "card456",
    "name": "New Task",
    "description": "Task description",
    "url": "https://trello.com/c/card456",
    "shortUrl": "https://trello.com/c/card456",
    "closed": false,
    "position": 1,
    "listId": "list123",
    "boardId": "board789",
    "dueDate": null,
    "dueComplete": false,
    "labels": [],
    "checklistCount": 0,
    "attachmentCount": 0,
    "commentCount": 0
  }
}
```

### `getCard`

Get a specific card by ID

**Arguments:**

- `cardId` (string, **required**): The ID of the card to retrieve

**Returns:**

`AdapterOperationResult`: Returns { card }. Card has FLAT fields: id, name, description, url, shortUrl, closed, position, listId, boardId, dueDate, dueComplete, labels[], checklistCount, attachmentCount, commentCount.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"getCard","params":{"cardId":"card456"}}' | jq .
```

**Example response:**

```json
{
  "card": {
    "id": "card456",
    "name": "Task Name",
    "description": "Task description",
    "url": "https://trello.com/c/card456",
    "shortUrl": "https://trello.com/c/card456",
    "closed": false,
    "position": 1,
    "listId": "list123",
    "boardId": "board789",
    "dueDate": "2024-01-15T10:00:00.000Z",
    "dueComplete": false,
    "labels": [
      "Bug",
      "High Priority"
    ],
    "checklistCount": 2,
    "attachmentCount": 1,
    "commentCount": 5
  }
}
```

### `updateCard`

Update an existing card

**Arguments:**

- `cardId` (string, **required**): The ID of the card to update
- `name` (string, *optional*): New card name
- `desc` (string, *optional*): New card description
- `description` (string, *optional*): New card description (alias for "desc", supports markdown)
- `idList` (string, *optional*): Move card to a different list
- `closed` (boolean, *optional*): Archive the card

**Returns:**

`AdapterOperationResult`: Returns { card } with updated FLAT fields.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"updateCard","params":{"cardId":"card456","name":"Updated Task","idList":"list789"}}' | jq .
```

**Example response:**

```json
{
  "card": {
    "id": "card456",
    "name": "Updated Task",
    "description": "Task description",
    "url": "https://trello.com/c/card456",
    "shortUrl": "https://trello.com/c/card456",
    "closed": false,
    "position": 1,
    "listId": "list789",
    "boardId": "board789",
    "dueDate": null,
    "dueComplete": false,
    "labels": [],
    "checklistCount": 0,
    "attachmentCount": 0,
    "commentCount": 0
  }
}
```

### `deleteCard`

Delete a card permanently

**Arguments:**

- `cardId` (string, **required**): The ID of the card to delete

**Returns:**

`AdapterOperationResult`: Returns { success, deletedId, deletedAt }. FLAT deletion confirmation.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"deleteCard","params":{"cardId":"card456"}}' | jq .
```

**Example response:**

```json
{
  "success": true,
  "deletedId": "card456",
  "deletedAt": "2024-01-15T10:30:00.000Z"
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `createChecklist`

Create a new checklist on a card

**Arguments:**

- `cardId` (string, **required**): The ID of the card to add the checklist to
- `name` (string, **required**): Checklist name

**Returns:**

`AdapterOperationResult`: Returns { checklist, checkItems[] }. Checklist has FLAT fields: id, name, cardId, boardId, position, checkItemCount, checkItemsChecked.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"createChecklist","params":{"cardId":"card456","name":"Tasks"}}' | jq .
```

**Example response:**

```json
{
  "checklist": {
    "id": "checklist123",
    "name": "Tasks",
    "cardId": "card456",
    "boardId": "board789",
    "position": 1,
    "checkItemCount": 0,
    "checkItemsChecked": 0
  },
  "checkItems": []
}
```

### `getChecklist`

Get a specific checklist by ID

**Arguments:**

- `checklistId` (string, **required**): The ID of the checklist to retrieve

**Returns:**

`AdapterOperationResult`: Returns { checklist, checkItems[] }. Each checkItem has FLAT fields: id, name, checklistId, state, position.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"getChecklist","params":{"checklistId":"checklist123"}}' | jq .
```

**Example response:**

```json
{
  "checklist": {
    "id": "checklist123",
    "name": "Tasks",
    "cardId": "card456",
    "boardId": "board789",
    "position": 1,
    "checkItemCount": 2,
    "checkItemsChecked": 1
  },
  "checkItems": [
    {
      "id": "item1",
      "name": "First task",
      "checklistId": "checklist123",
      "state": "complete",
      "position": 1
    },
    {
      "id": "item2",
      "name": "Second task",
      "checklistId": "checklist123",
      "state": "incomplete",
      "position": 2
    }
  ]
}
```

### `updateChecklist`

Update a checklist name

**Arguments:**

- `checklistId` (string, **required**): The ID of the checklist to update
- `name` (string, **required**): New checklist name

**Returns:**

`AdapterOperationResult`: Returns { checklist, checkItems[] } with updated FLAT fields.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"updateChecklist","params":{"checklistId":"checklist123","name":"Updated Tasks"}}' | jq .
```

**Example response:**

```json
{
  "checklist": {
    "id": "checklist123",
    "name": "Updated Tasks",
    "cardId": "card456",
    "boardId": "board789",
    "position": 1,
    "checkItemCount": 2,
    "checkItemsChecked": 1
  },
  "checkItems": []
}
```

### `deleteChecklist`

Delete a checklist from a card

**Arguments:**

- `checklistId` (string, **required**): The ID of the checklist to delete

**Returns:**

`AdapterOperationResult`: Returns { success, deletedId, deletedAt }. FLAT deletion confirmation.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"deleteChecklist","params":{"checklistId":"checklist123"}}' | jq .
```

**Example response:**

```json
{
  "success": true,
  "deletedId": "checklist123",
  "deletedAt": "2024-01-15T10:30:00.000Z"
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `addCheckItem`

Add a check item to a checklist

**Arguments:**

- `checklistId` (string, **required**): The ID of the checklist to add the item to
- `name` (string, **required**): Check item text

**Returns:**

`AdapterOperationResult`: Returns { checkItem }. CheckItem has FLAT fields: id, name, checklistId, state, position.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"addCheckItem","params":{"checklistId":"checklist123","name":"New task"}}' | jq .
```

**Example response:**

```json
{
  "checkItem": {
    "id": "item789",
    "name": "New task",
    "checklistId": "checklist123",
    "state": "incomplete",
    "position": 3
  }
}
```

### `updateCheckItem`

Update a check item (name or completion state)

**Arguments:**

- `cardId` (string, **required**): The ID of the card containing the check item
- `checkItemId` (string, **required**): The ID of the check item to update
- `name` (string, *optional*): New check item text
- `state` (string, *optional*): Check state: "complete" or "incomplete"

**Returns:**

`AdapterOperationResult`: Returns { checkItem } with updated FLAT fields: id, name, checklistId, state, position.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"updateCheckItem","params":{"cardId":"card456","checkItemId":"item789","state":"complete"}}' | jq .
```

**Example response:**

```json
{
  "checkItem": {
    "id": "item789",
    "name": "Task item",
    "checklistId": "checklist123",
    "state": "complete",
    "position": 1
  }
}
```

### `deleteCheckItem`

Delete a check item from a checklist

**Arguments:**

- `checklistId` (string, **required**): The ID of the checklist containing the item
- `checkItemId` (string, **required**): The ID of the check item to delete

**Returns:**

`AdapterOperationResult`: Returns { success, deletedId, deletedAt }. FLAT deletion confirmation.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"deleteCheckItem","params":{"checklistId":"checklist123","checkItemId":"item789"}}' | jq .
```

**Example response:**

```json
{
  "success": true,
  "deletedId": "item789",
  "deletedAt": "2024-01-15T10:30:00.000Z"
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `discoverExtended`

Search Trello API for available operations beyond core tools

**Arguments:**

- `query` (string, **required**): Describe what you want to do (e.g., "add label to card")
- `limit` (number, *optional*): Max results to return (default 5)

**Returns:**

`AdapterOperationResult`: List of matching operations with their details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"discoverExtended","params":{"query":"search term"}}' | jq .
```

### `executeExtended`

Execute a Trello API operation by operationId

**Arguments:**

- `operationId` (string, **required**): The operationId from discoverExtended results
- `pathParams` (object, *optional*): Path parameters, e.g., { id: "abc123" }
- `queryParams` (object, *optional*): Query string parameters
- `body` (object, *optional*): Request body for POST/PUT/PATCH operations

**Returns:**

`AdapterOperationResult`: API response data

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"trello","method":"executeExtended","params":{"operationId":"<ID>"}}' | jq .
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
