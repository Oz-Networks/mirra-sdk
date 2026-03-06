---
name: mirra-user
description: "Use Mirra to internal user profile and account management system. Covers all User SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra User

Internal user profile and account management system

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
    "resourceId": "user",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/user/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `getProfile` | Get user profile information including username, email, timezone, phone, and usage stats |
| `updateProfile` | Update user profile fields (username, email, timezone, phone) |
| `updatePreferences` | Update user preferences (notification settings, etc) |
| `getUsageStats` | Get token usage statistics, quota, and billing information |
| `getSessions` | Get active sessions/devices (based on push token registrations) |
| `deactivateAccount` | Soft delete user account (set inactive flag) - CAUTION: This marks the account for deletion |

## Operation Details

### `getProfile`

Get user profile information including username, email, timezone, phone, and usage stats

**Returns:**

`UserProfile`: User profile object with all profile fields

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"user","method":"getProfile","params":{}}' | jq .
```

### `updateProfile`

Update user profile fields (username, email, timezone, phone)

**Arguments:**

- `username` (string, *optional*): New username (3-30 characters, alphanumeric with underscores/hyphens)
- `email` (string, *optional*): New email address
- `timezone` (string, *optional*): IANA timezone identifier (e.g., America/Los_Angeles)
- `phoneNumber` (string, *optional*): Phone number (7-15 digits with optional formatting)

**Returns:**

`UserProfile`: Updated user profile object

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"user","method":"updateProfile","params":{}}' | jq .
```

### `updatePreferences`

Update user preferences (notification settings, etc)

**Arguments:**

- `timezone` (string, *optional*): Preferred timezone for scheduling
- `socials` (object, *optional*): Social media links (twitter, discord)

**Returns:**

`UserPreferences`: Updated user preferences

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"user","method":"updatePreferences","params":{}}' | jq .
```

### `getUsageStats`

Get token usage statistics, quota, and billing information

**Returns:**

`UsageStats`: Token usage and quota information

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"user","method":"getUsageStats","params":{}}' | jq .
```

### `getSessions`

Get active sessions/devices (based on push token registrations)

**Returns:**

`Session[]`: Array of active sessions/devices

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"user","method":"getSessions","params":{}}' | jq .
```

### `deactivateAccount`

Soft delete user account (set inactive flag) - CAUTION: This marks the account for deletion

**Arguments:**

- `confirm` (boolean, **required**): Must be true to confirm account deactivation

**Returns:**

`void`: No return value on success

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"user","method":"deactivateAccount","params":{"confirm":true}}' | jq .
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
