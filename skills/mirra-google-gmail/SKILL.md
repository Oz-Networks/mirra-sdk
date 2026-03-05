---
name: mirra-google-gmail
description: "Use Mirra to gmail email management and automation. Covers all Gmail SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Gmail

Gmail email management and automation

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Gmail requires OAuth authentication. The user must have connected their Gmail account in the Mirra app before these operations will work.

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleGmail/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `sendEmail` | Send an email via Gmail |
| `searchEmails` | Search emails with Gmail query syntax. Returns normalized email summaries. |
| `listEmails` | List recent emails from inbox. Returns normalized email summaries. |
| `getEmail` | Get full details of a specific email by ID. Returns normalized flat structure. |
| `createDraft` | Create a draft email in Gmail |
| `updateDraft` | Update an existing draft email |
| `deleteDraft` | Delete a draft email |
| `listDrafts` | List all draft emails. Returns normalized draft summaries. |
| `deleteEmail` | Delete an email |
| `bulkDeleteEmails` | Delete multiple emails at once. Uses Gmail batchDelete API for efficiency. |

## Operation Details

### `sendEmail`

Send an email via Gmail

**Arguments:**

- `to` (string, **required**): Valid email address
- `subject` (string, **required**): Email subject line
- `body` (string, **required**): Email body content
- `cc` (string, *optional*): CC recipients (comma-separated email addresses)
- `bcc` (string, *optional*): BCC recipients (comma-separated email addresses)
- `isHtml` (boolean, *optional*): Whether body is HTML format

**Returns:**

`AdapterOperationResult`: Email send confirmation with message ID

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleGmail/sendEmail" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"to":"recipient@example.com","subject":"Hello","body":"This is a test email"}' | jq .
```

**Example response:**

```json
{
  "messageId": "msg_abc123"
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `searchEmails`

Search emails with Gmail query syntax. Returns normalized email summaries.

**Arguments:**

- `query` (string, **required**): Gmail search query (e.g., "from:user@example.com is:unread")
- `maxResults` (number, *optional*): Maximum number of results to return (default: 50, max: 100)

**Returns:**

`AdapterOperationResult`: Array of normalized email summaries with flat structure

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleGmail/searchEmails" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"query":"from:sender@example.com is:unread","maxResults":5}' | jq .
```

**Example response:**

```json
{
  "query": "from:sender@example.com is:unread",
  "count": 1,
  "emails": [
    {
      "id": "msg_abc123",
      "threadId": "thread_xyz",
      "subject": "Meeting Tomorrow",
      "from": "sender@example.com",
      "to": "you@example.com",
      "date": "2024-01-15T10:30:00.000Z",
      "snippet": "Just wanted to confirm our meeting...",
      "labelIds": [
        "INBOX",
        "UNREAD"
      ],
      "isUnread": true,
      "hasAttachments": false
    }
  ]
}
```

### `listEmails`

List recent emails from inbox. Returns normalized email summaries.

**Arguments:**

- `maxResults` (number, *optional*): Maximum number of results to return (default: 50, max: 100)

**Returns:**

`AdapterOperationResult`: Array of normalized email summaries

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleGmail/listEmails" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"maxResults":20}' | jq .
```

**Example response:**

```json
{
  "query": "",
  "count": 2,
  "emails": [
    {
      "id": "msg_1",
      "threadId": "thread_1",
      "subject": "Welcome!",
      "from": "hello@example.com",
      "to": "you@example.com",
      "date": "2024-01-15T09:00:00.000Z",
      "snippet": "Welcome to our service...",
      "labelIds": [
        "INBOX"
      ],
      "isUnread": false,
      "hasAttachments": false
    }
  ]
}
```

### `getEmail`

Get full details of a specific email by ID. Returns normalized flat structure.

**Arguments:**

- `messageId` (string, **required**): Gmail message ID
- `includeHtml` (boolean, *optional*): Include HTML body content (default: false)
- `includeAttachments` (boolean, *optional*): Include attachment metadata (default: false)

**Returns:**

`AdapterOperationResult`: Normalized email with all fields extracted to flat structure

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleGmail/getEmail" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"messageId":"msg_abc123"}' | jq .
```

**Example response:**

```json
{
  "id": "msg_abc123",
  "threadId": "thread_xyz",
  "subject": "Test Email",
  "from": "John Doe <sender@example.com>",
  "to": "you@example.com",
  "date": "2024-01-15T10:30:00.000Z",
  "body": "This is the email body content in plain text.",
  "snippet": "This is the email body content...",
  "labelIds": [
    "INBOX",
    "IMPORTANT"
  ],
  "isUnread": false,
  "hasAttachments": false
}
```

### `createDraft`

Create a draft email in Gmail

**Arguments:**

- `to` (string, **required**): Valid email address
- `subject` (string, **required**): Email subject line
- `body` (string, **required**): Email body content
- `cc` (string, *optional*): CC recipients (comma-separated email addresses)
- `bcc` (string, *optional*): BCC recipients (comma-separated email addresses)
- `isHtml` (boolean, *optional*): Whether body is HTML format

**Returns:**

`AdapterOperationResult`: Draft creation confirmation with draft ID

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleGmail/createDraft" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"to":"recipient@example.com","subject":"Draft Subject","body":"Draft content"}' | jq .
```

**Example response:**

```json
{
  "draftId": "draft_xyz789"
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `updateDraft`

Update an existing draft email

**Arguments:**

- `draftId` (string, **required**): Gmail draft ID to update
- `to` (string, *optional*): Updated recipient email address(es)
- `subject` (string, *optional*): Updated email subject line
- `body` (string, *optional*): Updated email body content
- `cc` (string, *optional*): Updated CC recipients
- `bcc` (string, *optional*): Updated BCC recipients
- `isHtml` (boolean, *optional*): Whether body is HTML format

**Returns:**

`AdapterOperationResult`: Draft update confirmation

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleGmail/updateDraft" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"draftId":"draft_xyz789","subject":"Updated Subject","body":"Updated content"}' | jq .
```

**Example response:**

```json
{
  "draftId": "draft_xyz789",
  "updated": true
}
```

### `deleteDraft`

Delete a draft email

**Arguments:**

- `draftId` (string, **required**): Gmail draft ID to delete

**Returns:**

`AdapterOperationResult`: Draft deletion confirmation

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleGmail/deleteDraft" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"draftId":"draft_xyz789"}' | jq .
```

**Example response:**

```json
{
  "deleted": true
}
```

### `listDrafts`

List all draft emails. Returns normalized draft summaries.

**Arguments:**

- `maxResults` (number, *optional*): Maximum number of drafts to return (default: 10)

**Returns:**

`AdapterOperationResult`: Array of normalized draft summaries

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleGmail/listDrafts" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"maxResults":20}' | jq .
```

**Example response:**

```json
{
  "count": 2,
  "drafts": [
    {
      "id": "draft_abc123",
      "messageId": "msg_xyz789",
      "subject": "Follow up on project",
      "to": "colleague@example.com",
      "snippet": "Hi, just wanted to follow up..."
    },
    {
      "id": "draft_def456",
      "messageId": "msg_uvw012",
      "subject": "Meeting notes",
      "to": "team@example.com",
      "snippet": "Here are the notes from..."
    }
  ]
}
```

### `deleteEmail`

Delete an email

**Arguments:**

- `messageId` (string, **required**): Gmail message ID to delete

**Returns:**

`AdapterOperationResult`: Email deletion confirmation

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleGmail/deleteEmail" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"messageId":"msg_abc123"}' | jq .
```

**Example response:**

```json
{
  "deleted": true
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `bulkDeleteEmails`

Delete multiple emails at once. Uses Gmail batchDelete API for efficiency.

**Arguments:**

- `messageIds` (array, **required**): Array of Gmail message IDs to delete (max 1000 per request)
- `permanently` (boolean, *optional*): If true, permanently delete. If false (default), move to trash.

**Returns:**

`AdapterOperationResult`: Bulk deletion confirmation with count of deleted emails

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleGmail/bulkDeleteEmails" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"messageIds":["msg_abc123","msg_def456","msg_ghi789"]}' | jq .
```

**Example response:**

```json
{
  "deletedCount": 3,
  "deleted": "trash"
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

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
