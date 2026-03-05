---
name: mirra-feed-items
description: "Use Mirra to create feed items with flexible content blocks for user notifications and action results. Covers all Feed Items SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Feed Items

Create feed items with flexible content blocks for user notifications and action results

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/feedItems/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `createFeedItem` | Create a notification for the user. Shows up in their activity feed and sends a push notification... |

## Operation Details

### `createFeedItem`

Create a notification for the user. Shows up in their activity feed and sends a push notification. The feed item appears in the current conversation context (group chat, DM, or personal feed).

**Arguments:**

- `title` (string, **required**): What happened - the main notification text
- `subtitle` (string, *optional*): Secondary context shown below the title
- `category` (string, **required**): Activity type - determines icon and styling (e.g. email, calendar, task, document, reminder, message, crypto, shopping, note, memory, flow, call, error, update)
- `details` (object, *optional*): Key-value pairs of relevant info to display (e.g. { "recipients": "3 people", "status": "sent" })
- `preview` (string, *optional*): Longer text content shown below details (e.g. email body preview, note content)
- `notify` (boolean, *optional*): Send push notification (default: true, set false for background updates)

**Returns:**

`AdapterOperationResult`: Returns: feedItemId, title, itemType, subType, status, graphId, createdAt, hasActions, blockCount

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/feedItems/createFeedItem" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"title":"Email sent to john@example.com","subtitle":"Q4 Planning Discussion","category":"email","details":{"recipients":"3 people","status":"Sent"},"preview":"Hey John, wanted to touch base about the Q4 roadmap..."}' | jq .
```

**Example response:**

```json
{
  "feedItemId": "feed_123",
  "title": "Email sent to john@example.com",
  "itemType": "informative",
  "subType": "email_send",
  "status": "completed",
  "graphId": "user_456",
  "createdAt": "2024-01-15T09:00:00Z",
  "hasActions": false,
  "blockCount": 3
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
