---
name: mirra-google-calendar
description: "Use Mirra to google calendar event management and scheduling. Covers all Google Calendar SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Google Calendar

Google Calendar event management and scheduling

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Google Calendar requires OAuth authentication. The user must have connected their Google Calendar account in the Mirra app before these operations will work.

## API Call Pattern

All operations use a single POST endpoint with the resource ID and method in the body:

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "resourceId": "google-calendar",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/googleCalendar/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `createEvent` | Create a new calendar event |
| `listEvents` | List calendar events |
| `getEvents` | Get calendar events (alias for listEvents) |
| `getEvent` | Get a specific calendar event by ID |
| `updateEvent` | Update an existing calendar event |
| `deleteEvent` | Delete a calendar event |
| `searchEvents` | Search calendar events by text query |

## Operation Details

### `createEvent`

Create a new calendar event

**Arguments:**

- `summary` (string, **required**): Event title/summary
- `start` (object, **required**): Start time object with dateTime and optional timeZone
- `end` (object, **required**): End time object with dateTime and optional timeZone
- `description` (string, *optional*): Event description
- `location` (string, *optional*): Event location
- `attendees` (array, *optional*): Array of attendee email addresses

**Returns:**

`AdapterOperationResult`: Created event information

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-calendar","method":"createEvent","params":{"summary":"<value>","start":{},"end":{}}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listEvents`

List calendar events

**Arguments:**

- `timeMin` (string, *optional*): Start time for events to list (ISO 8601)
- `timeMax` (string, *optional*): End time for events to list (ISO 8601)
- `maxResults` (number, *optional*): Maximum number of events to return (default: 50, max: 100)
- `query` (string, *optional*): Search query to filter events

**Returns:**

`AdapterOperationResult`: List of calendar events

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-calendar","method":"listEvents","params":{}}' | jq .
```

### `getEvents`

Get calendar events (alias for listEvents)

**Arguments:**

- `timeMin` (string, *optional*): Start time for events to list (ISO 8601)
- `timeMax` (string, *optional*): End time for events to list (ISO 8601)
- `maxResults` (number, *optional*): Maximum number of events to return (default: 50, max: 100)
- `query` (string, *optional*): Search query to filter events

**Returns:**

`AdapterOperationResult`: List of calendar events

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-calendar","method":"getEvents","params":{}}' | jq .
```

### `getEvent`

Get a specific calendar event by ID

**Arguments:**

- `eventId` (string, **required**): Calendar event ID

**Returns:**

`AdapterOperationResult`: Calendar event details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-calendar","method":"getEvent","params":{"eventId":"<ID>"}}' | jq .
```

### `updateEvent`

Update an existing calendar event

**Arguments:**

- `eventId` (string, **required**): Calendar event ID to update
- `summary` (string, *optional*): Updated event title/summary
- `description` (string, *optional*): Updated event description
- `location` (string, *optional*): Updated event location
- `start` (object, *optional*): Updated start time object with dateTime and optional timeZone
- `end` (object, *optional*): Updated end time object with dateTime and optional timeZone

**Returns:**

`AdapterOperationResult`: Updated event information

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-calendar","method":"updateEvent","params":{"eventId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `deleteEvent`

Delete a calendar event

**Arguments:**

- `eventId` (string, **required**): Calendar event ID to delete

**Returns:**

`AdapterOperationResult`: Deletion confirmation

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-calendar","method":"deleteEvent","params":{"eventId":"<ID>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `searchEvents`

Search calendar events by text query

**Arguments:**

- `query` (string, **required**): Search query to filter events
- `timeMin` (string, *optional*): Start time for events to search (ISO 8601)
- `timeMax` (string, *optional*): End time for events to search (ISO 8601)
- `maxResults` (number, *optional*): Maximum number of events to return (default: 50, max: 100)

**Returns:**

`AdapterOperationResult`: List of matching calendar events

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-calendar","method":"searchEvents","params":{"query":"search term"}}' | jq .
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
