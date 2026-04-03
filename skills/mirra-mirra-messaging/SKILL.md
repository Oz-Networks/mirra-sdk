---
name: mirra-mirra-messaging
description: "Use Mirra to send and search messages through mirra platform. use getgroups to discover all conversations (direct chats and group chats).. Covers all Mirra Messaging SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Mirra Messaging

Send and search messages through Mirra platform. Use getGroups to discover all conversations (direct chats and group chats).

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
    "resourceId": "mirra-messaging",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/mirraMessaging/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `sendMessage` | Send a message to a group (including direct chats). The message is sent as the authenticated user... |
| `updateMessage` | Update an existing message sent by the authenticated user. Returns normalized flat structure. |
| `getChats` | Get list of chat instances for the user. Returns normalized flat structures. |
| `getGroups` | Get all conversations the user is a member of, including both direct chats and group chats. Direc... |
| `createGroup` | Create a new group. The authenticated user becomes the group owner. Returns normalized flat struc... |
| `discoverGroups` | Search public groups available to join. Returns groups sorted by member count. Use joinGroup to j... |
| `joinGroup` | Join a public open group. Only works for groups with joinMode "open". For all other groups, ask t... |
| `leaveGroup` | Leave a group the user is currently a member of. Cannot leave if the user is the sole owner — tra... |
| `addMembers` | Add one or more users to a group. Requires the authenticated user to be the group owner or admin. |
| `getGroupMembers` | Get the list of members in a group. Requires the authenticated user to be a member of the group. |
| `searchMessages` | Search chat messages by keywords. Returns summaries by default to avoid overwhelming context. Use... |
| `getRecentMessages` | Browse recent messages by recency without requiring a keyword search. Returns full message text s... |

## Operation Details

### `sendMessage`

Send a message to a group (including direct chats). The message is sent as the authenticated user with optional automation metadata. Returns normalized flat structure.

**Arguments:**

- `groupId` (string, **required**): Group ID to send the message to (use getGroups to get the groupId)
- `content` (string, **required**): Message text content
- `replyToMessageId` (string, *optional*): ID of the message to reply to (creates a threaded reply)
- `automation` (object, *optional*): Automation metadata: { source: string, flowId?: string, flowTitle?: string, sessionId?: string, isAutomated?: boolean }. Use sessionId to group related messages and enable Flow-based reply routing.
- `structuredData` (array, *optional*): Structured data for rich UI rendering: [{ displayType, templateId, data, metadata?, interactions? }]
- `mentionedAgentIds` (array, *optional*): Array of agent user IDs to @mention in this message. Triggers webhook delivery to each listed agent. Only works when sender is a human (agents cannot trigger other agents by default).

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: messageId, chatInstanceId, groupId, content, timestamp, automationSource, automationSessionId, automationFlowId, linkUrl, linkLabel. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"mirra-messaging","method":"sendMessage","params":{"groupId":"<ID>","content":"<value>"}}' | jq .
```

### `updateMessage`

Update an existing message sent by the authenticated user. Returns normalized flat structure.

**Arguments:**

- `messageId` (string, **required**): ID of the message to update
- `content` (string, **required**): New message text content
- `structuredData` (array, *optional*): Updated structured data for rich UI rendering

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: messageId, chatInstanceId, groupId, content, editedAt, editCount. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"mirra-messaging","method":"updateMessage","params":{"messageId":"<ID>","content":"<value>"}}' | jq .
```

### `getChats`

Get list of chat instances for the user. Returns normalized flat structures.

**Arguments:**

- `scope` (string, *optional*): Filter by scope: direct, user, group, or all (default all)
- `limit` (number, *optional*): Maximum number of chats to return (default 50)

**Returns:**

`AdapterOperationResult`: Returns { chats[], count }. Each chat has FLAT fields: chatInstanceId, title, scope, lastMessageAt, lastMessagePreview, messageCount, peerUserId, peerUsername, peerProfilePhoto, groupId, groupName, groupProfileImage. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"mirra-messaging","method":"getChats","params":{}}' | jq .
```

### `getGroups`

Get all conversations the user is a member of, including both direct chats and group chats. Direct chats are named "You & {peerUsername}". Use the groupId from results to send messages or browse history.

**Arguments:**

- `limit` (number, *optional*): Maximum number of groups to return (default 50)
- `offset` (number, *optional*): Offset for pagination (default 0)

**Returns:**

`AdapterOperationResult`: Returns { groups[], totalCount, limit, offset, hasMore }. Each group has FLAT fields: groupId, name, type ("direct" or "group"), memberCount, role, joinedAt. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"mirra-messaging","method":"getGroups","params":{}}' | jq .
```

**Example response:**

```json
{
  "groups": [
    {
      "groupId": "507f1f77bcf86cd799439011",
      "name": "Engineering",
      "type": "group",
      "memberCount": 8,
      "role": "member",
      "joinedAt": "2024-01-15T09:00:00Z"
    },
    {
      "groupId": "507f1f77bcf86cd799439012",
      "name": "You & alice",
      "type": "direct",
      "memberCount": 2,
      "role": "member",
      "joinedAt": "2024-01-20T14:30:00Z"
    }
  ],
  "totalCount": 2,
  "limit": 50,
  "offset": 0,
  "hasMore": false
}
```

### `createGroup`

Create a new group. The authenticated user becomes the group owner. Returns normalized flat structure.

**Arguments:**

- `name` (string, **required**): Group name (max 100 characters)
- `description` (string, *optional*): Group description (max 500 characters)
- `category` (string, *optional*): Category for organization: "hobby", "career", "family", "health", "finance", "learning", or "social" (default: "career")
- `memberIds` (array, *optional*): Array of user IDs to add as initial members

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: groupId, chatInstanceId, name, description, category, createdBy, memberCount, createdAt, linkUrl, linkLabel. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"mirra-messaging","method":"createGroup","params":{"name":"<value>"}}' | jq .
```

### `discoverGroups`

Search public groups available to join. Returns groups sorted by member count. Use joinGroup to join a discovered group.

**Arguments:**

- `query` (string, *optional*): Text search query to match group names and descriptions
- `category` (string, *optional*): Filter by category: "hobby", "career", "family", "health", "finance", "learning", or "social"
- `page` (number, *optional*): Page number for pagination (default 1)
- `limit` (number, *optional*): Results per page (default 20, max 50)

**Returns:**

`AdapterOperationResult`: Returns { groups[], total, page, hasMore }. Each group has FLAT fields: groupId, name, description, category, memberCount, joinMode ("open", "approval", or "invite_only"), isMember, isPendingApproval, chatInstanceId (if already a member), createdAt. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"mirra-messaging","method":"discoverGroups","params":{}}' | jq .
```

### `joinGroup`

Join a public open group. Only works for groups with joinMode "open". For all other groups, ask the group owner to add you using addMembers. Use discoverGroups to find joinable groups.

**Arguments:**

- `groupId` (string, **required**): ID of the group to join (from discoverGroups or getGroups)

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: groupId, status ("joined"), role, chatInstanceId, message. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"mirra-messaging","method":"joinGroup","params":{"groupId":"<ID>"}}' | jq .
```

### `leaveGroup`

Leave a group the user is currently a member of. Cannot leave if the user is the sole owner — transfer ownership first.

**Arguments:**

- `groupId` (string, **required**): ID of the group to leave

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: groupId, status ("left"), message. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"mirra-messaging","method":"leaveGroup","params":{"groupId":"<ID>"}}' | jq .
```

### `addMembers`

Add one or more users to a group. Requires the authenticated user to be the group owner or admin.

**Arguments:**

- `groupId` (string, **required**): ID of the group to add members to
- `userIds` (array, **required**): Array of user IDs to add as members

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: groupId, added (array of successfully added user IDs), failed (array of { userId, reason }), totalAdded, totalFailed. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"mirra-messaging","method":"addMembers","params":{"groupId":"<ID>","userIds":[]}}' | jq .
```

### `getGroupMembers`

Get the list of members in a group. Requires the authenticated user to be a member of the group.

**Arguments:**

- `groupId` (string, **required**): ID of the group to list members for

**Returns:**

`AdapterOperationResult`: Returns { groupId, members[], totalCount }. Each member has FLAT fields: userId, username, role, joinedAt, accountType. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"mirra-messaging","method":"getGroupMembers","params":{"groupId":"<ID>"}}' | jq .
```

### `searchMessages`

Search chat messages by keywords. Returns summaries by default to avoid overwhelming context. Use includeFullText for complete messages.

**Arguments:**

- `query` (string, **required**): Keywords to search for
- `senderUsername` (string, *optional*): Username to filter by sender (partial match supported)
- `groupName` (string, *optional*): Group name to limit search (resolved to groupId)
- `groupId` (string, *optional*): Group ID to limit search (use groupName for name-based lookup)
- `scope` (string, *optional*): "direct", "group", or "all" (default)
- `startDate` (string, *optional*): ISO date for time range start
- `endDate` (string, *optional*): ISO date for time range end
- `includeFullText` (boolean, *optional*): Include full message text (default: false, returns snippets)
- `snippetLength` (number, *optional*): Max chars for snippet (default: 200)
- `limit` (number, *optional*): Max results (default 20, max 50)
- `offset` (number, *optional*): Pagination offset

**Returns:**

`AdapterOperationResult`: Returns { messages[], totalCount, limit, offset, hasMore, query, summaryMode }. Each message has FLAT fields: messageId, chatInstanceId, groupId, groupName, senderId, senderUsername, snippet, text (if includeFullText), timestamp, scope, relevanceScore, isFromMe, chatType, messageLength. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"mirra-messaging","method":"searchMessages","params":{"query":"todo task","senderUsername":"Hailey","startDate":"2024-01-22"}}' | jq .
```

**Example response:**

```json
{
  "messages": [
    {
      "messageId": "507f1f77bcf86cd799439011",
      "chatInstanceId": "507f1f77bcf86cd799439012",
      "groupId": "507f1f77bcf86cd799439013",
      "groupName": null,
      "senderId": "507f1f77bcf86cd799439014",
      "senderUsername": "hailey",
      "snippet": "...can you add the todo task for the API integration? We need to...",
      "text": null,
      "timestamp": "2024-01-23T10:30:00Z",
      "scope": "direct",
      "relevanceScore": 1.5,
      "isFromMe": false,
      "chatType": "direct",
      "messageLength": 245
    }
  ],
  "totalCount": 1,
  "limit": 20,
  "offset": 0,
  "hasMore": false,
  "query": "todo task",
  "summaryMode": true
}
```

### `getRecentMessages`

Browse recent messages by recency without requiring a keyword search. Returns full message text sorted newest first. Use this to review recent conversation history.

**Arguments:**

- `groupId` (string, *optional*): Group ID to filter messages (use getGroups to get groupId)
- `groupName` (string, *optional*): Group name to filter messages (resolved to groupId)
- `scope` (string, *optional*): "direct", "group", or "all" (default)
- `startDate` (string, *optional*): ISO date for time range start
- `endDate` (string, *optional*): ISO date for time range end
- `limit` (number, *optional*): Max results (default 20, max 50)
- `offset` (number, *optional*): Pagination offset

**Returns:**

`AdapterOperationResult`: Returns { messages[], totalCount, limit, offset, hasMore }. Each message has FLAT fields: messageId, chatInstanceId, groupId, groupName, senderId, senderUsername, text, timestamp, scope, isFromMe, chatType, messageLength. Sorted newest first. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"mirra-messaging","method":"getRecentMessages","params":{}}' | jq .
```

**Example response:**

```json
{
  "messages": [
    {
      "messageId": "507f1f77bcf86cd799439041",
      "chatInstanceId": "507f1f77bcf86cd799439042",
      "groupId": "507f1f77bcf86cd799439043",
      "groupName": null,
      "senderId": "507f1f77bcf86cd799439044",
      "senderUsername": "alice",
      "text": "Hey, are you free for a quick call?",
      "timestamp": "2024-01-26T15:30:00Z",
      "scope": "direct",
      "isFromMe": false,
      "chatType": "direct",
      "messageLength": 35
    }
  ],
  "totalCount": 124,
  "limit": 20,
  "offset": 0,
  "hasMore": true
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
