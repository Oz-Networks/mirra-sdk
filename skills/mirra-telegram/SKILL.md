---
name: mirra-telegram
description: "Use Mirra to telegram messaging and chat management. Covers all Telegram SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Telegram

Telegram messaging and chat management

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Telegram requires OAuth authentication. The user must have connected their Telegram account in the Mirra app before these operations will work.

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegram/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `sendMessage` | Send a text message to a Telegram chat or user. Supports both chat IDs and usernames. |
| `searchChats` | Powerful unified chat search with filtering, sorting, and activity tracking. Replaces getChats, f... |
| `searchMessages` | Search for messages across Telegram chats. When chatIds is omitted, performs global search across... |
| `getChatMessages` | Get message history from a specific Telegram chat with pagination and date filtering. |
| `getUnreadSummary` | Get summary of unread messages across Telegram chats, including mentions and flattened last messa... |
| `markAsRead` | Mark messages as read in a Telegram chat up to a specific message ID. |
| `getMentions` | Get messages where the user is mentioned in Telegram chats. |
| `leaveGroup` | Leave a Telegram group, supergroup, or channel. Removes the user from the group and clears it fro... |

## Operation Details

### `sendMessage`

Send a text message to a Telegram chat or user. Supports both chat IDs and usernames.

**Arguments:**

- `chatId` (string, **required**): Chat ID (numeric) or username (e.g., @username) to send the message to. Chat IDs can be obtained from searchChats operation.
- `text` (string, **required**): The text content of the message to send

**Returns:**

`AdapterOperationResult`: Normalized result with messageId, chatId, text, and sentAt timestamp

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegram/sendMessage" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"chatId":"123456789","text":"Hello from Mirra!"}' | jq .
```

**Example response:**

```json
{
  "messageId": 12345,
  "chatId": "123456789",
  "text": "Hello from Mirra!",
  "sentAt": "2024-01-15T10:30:00.000Z"
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `searchChats`

Powerful unified chat search with filtering, sorting, and activity tracking. Replaces getChats, findChatByName, and getRecentContacts. Use with no filters to list all chats.

**Arguments:**

- `query` (string, *optional*): Text to search in chat names/usernames. Supports fuzzy matching with relevance scoring.
- `type` (string, *optional*): Filter by chat type: "private", "group", "channel", or "all" (default: "all")
- `inactiveSince` (string, *optional*): Find chats with no activity since date. Accepts ISO date or relative like "30 days ago", "1 week ago"
- `activeSince` (string, *optional*): Find chats with activity since date. Accepts ISO date or relative like "7 days ago"
- `hasUnread` (boolean, *optional*): Filter by unread status: true = only unread, false = only read
- `archived` (boolean, *optional*): Filter by archived status
- `pinned` (boolean, *optional*): Filter by pinned status
- `sortBy` (string, *optional*): Sort results: "relevance" (default with query), "lastActivity" (default without query), "unreadCount", "name"
- `limit` (number, *optional*): Max results (default: 50, max: 100)
- `offset` (number, *optional*): Pagination offset (default: 0)
- `forceRefresh` (boolean, *optional*): Bypass cache and fetch fresh data

**Returns:**

`AdapterOperationResult`: Paginated results with chat details including lastMessageDate, unreadCount, memberCount, and relevanceScore (when query provided)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegram/searchChats" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

**Example response:**

```json
{
  "items": [
    {
      "id": "123",
      "title": "John",
      "type": "private",
      "lastMessageDate": "2024-01-15T10:30:00Z",
      "unreadCount": 2
    }
  ],
  "pagination": {
    "totalCount": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### `searchMessages`

Search for messages across Telegram chats. When chatIds is omitted, performs global search across all chats (replaces globalSearch operation).

**Arguments:**

- `query` (string, **required**): Text query to search for in messages
- `chatIds` (array, *optional*): Array of chat IDs to search within. Omit for global search across all chats.
- `chatType` (string, *optional*): Filter by chat type (for global search): "private", "group", or "channel"
- `fromDate` (string, *optional*): ISO date string for start of date range
- `toDate` (string, *optional*): ISO date string for end of date range
- `limit` (number, *optional*): Maximum number of messages to return (default: 100, max: 100)
- `senderId` (string, *optional*): Filter messages by sender ID

**Returns:**

`AdapterOperationResult`: Normalized messages array with flat structure: id, text, caption, date (ISO), chatId, senderId, senderName, hasMedia, mediaType, isOutgoing, replyToMessageId

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegram/searchMessages" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"query":"project update"}' | jq .
```

**Example response:**

```json
{
  "messages": [
    {
      "id": "456",
      "text": "Project update: Phase 1 complete",
      "caption": null,
      "date": "2024-01-15T10:30:00.000Z",
      "chatId": "123456789",
      "senderId": "987654321",
      "senderName": "John",
      "hasMedia": false,
      "mediaType": null,
      "isOutgoing": false,
      "replyToMessageId": null
    }
  ],
  "count": 1
}
```

### `getChatMessages`

Get message history from a specific Telegram chat with pagination and date filtering.

**Arguments:**

- `chatId` (string, **required**): Chat ID to retrieve messages from
- `limit` (number, *optional*): Maximum number of messages to return (default: 50, max: 100)
- `offsetId` (number, *optional*): Message ID to use as pagination offset
- `minDate` (string, *optional*): ISO date string for minimum message date
- `maxDate` (string, *optional*): ISO date string for maximum message date

**Returns:**

`AdapterOperationResult`: Normalized messages array with flat structure including chatId

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegram/getChatMessages" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"chatId":"123456789","limit":50}' | jq .
```

**Example response:**

```json
{
  "messages": [
    {
      "id": "789",
      "text": "Hello everyone!",
      "caption": null,
      "date": "2024-01-15T10:30:00.000Z",
      "chatId": "123456789",
      "senderId": "987654321",
      "senderName": "John",
      "hasMedia": false,
      "mediaType": null,
      "isOutgoing": false,
      "replyToMessageId": null
    }
  ],
  "count": 1,
  "chatId": "123456789"
}
```

### `getUnreadSummary`

Get summary of unread messages across Telegram chats, including mentions and flattened last message info.

**Arguments:**

- `chatIds` (array, *optional*): Array of chat IDs to filter by. If not provided, checks all chats.
- `priorityOnly` (boolean, *optional*): If true, only return chats with unread messages
- `groupBy` (string, *optional*): Group results by "chat" or "sender"

**Returns:**

`AdapterOperationResult`: Normalized flat structure with chats array, totalUnread, chatsWithUnread. Each chat has flattened lastMessage fields (lastMessageText, lastMessageSender, lastMessageDate)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegram/getUnreadSummary" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"priorityOnly":true}' | jq .
```

**Example response:**

```json
{
  "chats": [
    {
      "chatId": "123456789",
      "chatName": "Project Team",
      "chatType": "group",
      "unreadCount": 5,
      "hasMention": true,
      "lastMessageText": "Can someone review this?",
      "lastMessageSender": "John",
      "lastMessageDate": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalUnread": 5,
  "chatsWithUnread": 1
}
```

### `markAsRead`

Mark messages as read in a Telegram chat up to a specific message ID.

**Arguments:**

- `chatId` (string, **required**): Chat ID to mark messages as read in
- `maxMessageId` (number, *optional*): Maximum message ID to mark as read. If not provided, marks all messages as read.

**Returns:**

`AdapterOperationResult`: Normalized result with success, chatId, and markedAt timestamp

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegram/markAsRead" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"chatId":"123456789"}' | jq .
```

**Example response:**

```json
{
  "success": true,
  "chatId": "123456789",
  "markedAt": "2024-01-15T10:30:00.000Z"
}
```

### `getMentions`

Get messages where the user is mentioned in Telegram chats.

**Arguments:**

- `chatIds` (array, *optional*): Array of chat IDs to filter mentions by
- `sinceDate` (string, *optional*): ISO date string - only return mentions since this date
- `onlyUnread` (boolean, *optional*): If true, only return unread mentions

**Returns:**

`AdapterOperationResult`: Normalized mentions array with flat message structure: id, text, caption, date (ISO), chatId, senderId, senderName, hasMedia, mediaType, isOutgoing, replyToMessageId

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegram/getMentions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"onlyUnread":true}' | jq .
```

**Example response:**

```json
{
  "mentions": [
    {
      "id": "456",
      "text": "@you please check this",
      "caption": null,
      "date": "2024-01-15T10:30:00.000Z",
      "chatId": "123456789",
      "senderId": "987654321",
      "senderName": "John",
      "hasMedia": false,
      "mediaType": null,
      "isOutgoing": false,
      "replyToMessageId": null
    }
  ],
  "count": 1
}
```

### `leaveGroup`

Leave a Telegram group, supergroup, or channel. Removes the user from the group and clears it from the local cache.

**Arguments:**

- `chatId` (string, **required**): The ID of the group, supergroup, or channel to leave. Can be obtained from searchChats operation.

**Returns:**

`AdapterOperationResult`: Normalized result with success, chatId, and leftAt timestamp

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegram/leaveGroup" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"chatId":"-1001234567890"}' | jq .
```

**Example response:**

```json
{
  "success": true,
  "chatId": "-1001234567890",
  "leftAt": "2024-01-15T10:30:00.000Z"
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
