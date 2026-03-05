---
name: mirra-contacts
description: "Use Mirra to manage user contacts - list, add, remove, search, block, and unblock contacts. Covers all Contacts SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Contacts

Manage user contacts - list, add, remove, search, block, and unblock contacts

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/contacts/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `listContacts` | Get a list of all accepted contacts for the user with their profile information |
| `getContact` | Get detailed information about a specific contact by their ID or username |
| `addContact` | Send a contact request to another user by their username |
| `removeContact` | Remove a user from your contacts list (unfriend) |
| `searchContacts` | Search your contacts by username, email, phone, or wallet address |
| `blockContact` | Block a user (prevents them from contacting you) |
| `unblockContact` | Unblock a previously blocked user |
| `getBlockedContacts` | Get a list of all users you have blocked |
| `getContactRequests` | Get pending contact requests (sent by you or received from others) |

## Operation Details

### `listContacts`

Get a list of all accepted contacts for the user with their profile information

**Arguments:**

- `limit` (number, *optional*): Maximum number of contacts to return (default: 100)
- `offset` (number, *optional*): Number of contacts to skip for pagination (default: 0)

**Returns:**

`object`: List of contacts with pagination info

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/contacts/listContacts" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"limit":10}' | jq .
```

**Example response:**

```json
{
  "success": true,
  "contacts": [
    {
      "id": "507f1f77bcf86cd799439011",
      "contactId": "507f1f77bcf86cd799439012",
      "username": "johndoe",
      "profilePhoto": null,
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "wallets": []
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### `getContact`

Get detailed information about a specific contact by their ID or username

**Arguments:**

- `contactId` (string, *optional*): The contact user ID (MongoDB ObjectId)
- `username` (string, *optional*): The contact username

**Returns:**

`object`: Contact information

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/contacts/getContact" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `addContact`

Send a contact request to another user by their username

**Arguments:**

- `username` (string, **required**): Username of the user to add as a contact

**Returns:**

`object`: Contact request details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/contacts/addContact" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"username":"<value>"}' | jq .
```

### `removeContact`

Remove a user from your contacts list (unfriend)

**Arguments:**

- `contactId` (string, *optional*): The contact user ID to remove
- `username` (string, *optional*): The contact username to remove

**Returns:**

`object`: Removal confirmation

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/contacts/removeContact" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `searchContacts`

Search your contacts by username, email, phone, or wallet address

**Arguments:**

- `query` (string, **required**): Search query - can be username, email, phone, or wallet address
- `searchType` (string, *optional*): Type of search to perform: all, username, email, phone, or wallet (default: all)
- `limit` (number, *optional*): Maximum number of results (default: 20)

**Returns:**

`object`: Search results with matching contacts

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/contacts/searchContacts" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"query":"heather"}' | jq .
```

**Example response:**

```json
{
  "success": true,
  "results": [
    {
      "contactId": "507f1f77bcf86cd799439011",
      "username": "heather_smith",
      "profilePhoto": null,
      "email": "heather@example.com",
      "phoneNumber": null,
      "wallets": []
    }
  ],
  "count": 1,
  "query": "heather",
  "searchType": "all"
}
```

### `blockContact`

Block a user (prevents them from contacting you)

**Arguments:**

- `contactId` (string, *optional*): The user ID to block
- `username` (string, *optional*): The username to block

**Returns:**

`object`: Block confirmation

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/contacts/blockContact" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `unblockContact`

Unblock a previously blocked user

**Arguments:**

- `contactId` (string, *optional*): The user ID to unblock
- `username` (string, *optional*): The username to unblock

**Returns:**

`object`: Unblock confirmation

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/contacts/unblockContact" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getBlockedContacts`

Get a list of all users you have blocked

**Arguments:**

- `limit` (number, *optional*): Maximum number of results (default: 100)
- `offset` (number, *optional*): Number of items to skip for pagination (default: 0)

**Returns:**

`object`: List of blocked users with pagination

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/contacts/getBlockedContacts" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `getContactRequests`

Get pending contact requests (sent by you or received from others)

**Arguments:**

- `type` (string, *optional*): Type of requests to retrieve: all, sent, or received (default: all)
- `status` (string, *optional*): Filter by request status: pending, accepted, or rejected (default: pending)

**Returns:**

`object`: List of contact requests

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/contacts/getContactRequests" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
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
