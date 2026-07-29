---
name: voice
description: "Use Mirra to voice call history, transcripts, and call metadata. Covers all Voice SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Voice

Voice call history, transcripts, and call metadata

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
    "resourceId": "voice",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/voice/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `getCallHistory` | List voice calls the user participated in, with filters for scope, status, and date range. Return... |
| `getCallDetails` | Get full metadata and participant list for a specific call. Use the call's agoraCallId (from getC... |
| `getCallTranscript` | Get transcript segments for a voice call. Each segment contains the speaker, text, timing, and co... |
| `getCallSummary` | Get a human-readable formatted transcript summary for a voice call. Returns speaker-attributed te... |
| `searchTranscripts` | Full-text search across transcript segments. Searches the text content of all transcripts the use... |
| `getActiveCall` | Check if there is an active (in-progress) voice call in a specific chat or group. Returns call de... |
| `getCalendar` | Read the user's Mirra calendar: upcoming scheduled meetings (recurring series expanded into concr... |
| `scheduleMeeting` | Schedule a Mirra meeting ahead of time (Google Meet style). Returns a stable share link immediate... |
| `cancelScheduledMeeting` | Cancel a scheduled meeting series (host only). Cancels every future occurrence. Use getCalendar f... |
| `createCalendarEvent` | Create a native calendar event (a plain entry: title, time, optional repeat and notes; no call at... |
| `updateCalendarEvent` | Update a native calendar event the user owns. Only pass the fields being changed. Use getCalendar... |
| `deleteCalendarEvent` | Delete a native calendar event the user owns. Meetings are cancelled with cancelScheduledMeeting,... |

## Operation Details

### `getCallHistory`

List voice calls the user participated in, with filters for scope, status, and date range. Returns call metadata (no transcript content). Use getCallTranscript or getCallSummary to retrieve transcript text for a specific call.

**Arguments:**

- `scope` (string, *optional*): Filter by call scope: "direct" (1-on-1 with AI), "group", "user" (user-to-user), or "meeting" (public shareable). Omit to return all scopes.
- `status` (string, *optional*): Filter by call status: "active", "ended", "cancelled". Defaults to all statuses.
- `groupId` (string, *optional*): Filter calls to a specific group by group ID.
- `startDate` (string, *optional*): Filter calls created on or after this date (ISO 8601, e.g. "2025-01-15T00:00:00Z").
- `endDate` (string, *optional*): Filter calls created on or before this date (ISO 8601).
- `limit` (number, *optional*): Maximum number of calls to return (default: 20, max: 100).
- `offset` (number, *optional*): Number of results to skip for pagination (default: 0).

**Returns:**

`AdapterOperationResult`: Returns { data: { count, offset, limit, calls[] } }. Each call has: id, agoraCallId, scope, status, createdAt, endedAt, durationMs, participantCount, videoEnabled, meetingTitle.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"voice","method":"getCallHistory","params":{"status":"ended","limit":5}}' | jq .
```

**Example response:**

```json
{
  "count": 2,
  "offset": 0,
  "limit": 5,
  "calls": [
    {
      "id": "6789abc",
      "agoraCallId": "call_1750459861273_qbhg8we",
      "scope": "group",
      "status": "ended",
      "createdAt": "2025-06-01T10:00:00Z",
      "endedAt": "2025-06-01T10:45:00Z",
      "durationMs": 2700000,
      "participantCount": 3,
      "videoEnabled": false,
      "meetingTitle": ""
    }
  ]
}
```

### `getCallDetails`

Get full metadata and participant list for a specific call. Use the call's agoraCallId (from getCallHistory) or the MongoDB _id.

**Arguments:**

- `callId` (string, **required**): The agoraCallId or MongoDB _id of the call.

**Returns:**

`AdapterOperationResult`: Returns { data: { id, agoraCallId, scope, status, createdAt, endedAt, durationMs, videoEnabled, meetingTitle, participants[] } }. Each participant has: userId, username, isGuest, guestName, joinedAt, leftAt, status.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"voice","method":"getCallDetails","params":{"callId":"call_1750459861273_qbhg8we"}}' | jq .
```

**Example response:**

```json
{
  "id": "6789abc",
  "agoraCallId": "call_1750459861273_qbhg8we",
  "scope": "group",
  "status": "ended",
  "createdAt": "2025-06-01T10:00:00Z",
  "endedAt": "2025-06-01T10:45:00Z",
  "durationMs": 2700000,
  "videoEnabled": false,
  "meetingTitle": "",
  "participants": [
    {
      "userId": "user_001",
      "username": "alice",
      "isGuest": false,
      "guestName": "",
      "joinedAt": "2025-06-01T10:00:00Z",
      "leftAt": "2025-06-01T10:45:00Z",
      "status": "LEFT"
    }
  ]
}
```

### `getCallTranscript`

Get transcript segments for a voice call. Each segment contains the speaker, text, timing, and confidence. Results are sorted by time. For a human-readable summary instead of raw segments, use getCallSummary.

**Arguments:**

- `callId` (string, **required**): The agoraCallId or MongoDB _id of the call.
- `mirraTriggeredOnly` (boolean, *optional*): If true, return only segments where a Mirra voice command was detected. Default: false.
- `limit` (number, *optional*): Maximum segments to return (default: 50, max: 200).
- `offset` (number, *optional*): Number of segments to skip for pagination (default: 0).

**Returns:**

`AdapterOperationResult`: Returns { data: { callId, count, offset, limit, totalSegments, segments[] } }. Each segment has: id, speakerUserId, speakerUsername, text, startMs, endMs, confidence, isFinal, mirraTriggered.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"voice","method":"getCallTranscript","params":{"callId":"call_1750459861273_qbhg8we","limit":10}}' | jq .
```

**Example response:**

```json
{
  "callId": "call_1750459861273_qbhg8we",
  "count": 2,
  "offset": 0,
  "limit": 10,
  "totalSegments": 42,
  "segments": [
    {
      "id": "seg_001",
      "speakerUserId": "user_001",
      "speakerUsername": "alice",
      "text": "Hey, let's discuss the Q2 roadmap.",
      "startMs": 1200,
      "endMs": 3800,
      "confidence": 0.95,
      "isFinal": true,
      "mirraTriggered": false
    }
  ]
}
```

### `getCallSummary`

Get a human-readable formatted transcript summary for a voice call. Returns speaker-attributed text in "Speaker: text" format. Useful for AI context, summaries, and recaps. For raw segment data, use getCallTranscript instead.

**Arguments:**

- `callId` (string, **required**): The agoraCallId or MongoDB _id of the call.
- `maxLength` (number, *optional*): Maximum character length of the summary (default: 2000). Transcript is truncated with "[Transcript truncated...]" if it exceeds this.
- `startMs` (number, *optional*): Only include segments starting at or after this millisecond offset from call start.
- `endMs` (number, *optional*): Only include segments ending at or before this millisecond offset from call start.

**Returns:**

`AdapterOperationResult`: Returns { data: { callId, summary, characterCount } }. The summary is a formatted string with "Speaker: text" lines.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"voice","method":"getCallSummary","params":{"callId":"call_1750459861273_qbhg8we"}}' | jq .
```

**Example response:**

```json
{
  "callId": "call_1750459861273_qbhg8we",
  "summary": "alice: Hey, let's discuss the Q2 roadmap.\nbob: Sure, I think we should prioritize mobile performance.\nalice: Agreed. Let's also look at the onboarding flow.",
  "characterCount": 158
}
```

### `searchTranscripts`

Full-text search across transcript segments. Searches the text content of all transcripts the user has access to. Results include the call context and matching segments.

**Arguments:**

- `query` (string, **required**): Text to search for in transcript content (case-insensitive substring match).
- `groupId` (string, *optional*): Limit search to transcripts from calls in a specific group.
- `startDate` (string, *optional*): Only search transcripts from calls created on or after this date (ISO 8601).
- `endDate` (string, *optional*): Only search transcripts from calls created on or before this date (ISO 8601).
- `limit` (number, *optional*): Maximum number of matching segments to return (default: 20, max: 100).

**Returns:**

`AdapterOperationResult`: Returns { data: { query, count, results[] } }. Each result has: segmentId, callId (agoraCallId), speakerUsername, text, startMs, confidence, callCreatedAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"voice","method":"searchTranscripts","params":{"query":"roadmap","limit":5}}' | jq .
```

**Example response:**

```json
{
  "query": "roadmap",
  "count": 1,
  "results": [
    {
      "segmentId": "seg_001",
      "callId": "call_1750459861273_qbhg8we",
      "speakerUsername": "alice",
      "text": "Hey, let's discuss the Q2 roadmap.",
      "startMs": 1200,
      "confidence": 0.95,
      "callCreatedAt": "2025-06-01T10:00:00Z"
    }
  ]
}
```

### `getActiveCall`

Check if there is an active (in-progress) voice call in a specific chat or group. Returns call details if active, or an empty result if no call is in progress.

**Arguments:**

- `chatInstanceId` (string, *optional*): Check for an active call in a specific chat instance.
- `groupId` (string, *optional*): Check for an active call in a specific group. Provide either chatInstanceId or groupId.

**Returns:**

`AdapterOperationResult`: Returns { data: { hasActiveCall, call? } }. If active, call contains: id, agoraCallId, scope, status, createdAt, participantCount, videoEnabled.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"voice","method":"getActiveCall","params":{"groupId":"group_123"}}' | jq .
```

**Example response:**

```json
{
  "hasActiveCall": true,
  "call": {
    "id": "6789abc",
    "agoraCallId": "call_1750459861273_qbhg8we",
    "scope": "group",
    "status": "active",
    "createdAt": "2025-06-01T11:30:00Z",
    "participantCount": 2,
    "videoEnabled": false
  }
}
```

### `getCalendar`

Read the user's Mirra calendar: upcoming scheduled meetings (recurring series expanded into concrete instances), past calls, and native calendar events, date-sorted. Use this to answer "what does my week look like", find free time, or locate a specific meeting before changing it.

**Arguments:**

- `from` (string, *optional*): Window start, ISO date. Defaults to now.
- `to` (string, *optional*): Window end, ISO date. Defaults to 14 days after from. Window may span at most 92 days.
- `groupId` (string, *optional*): Restrict to one space. Omit for everything across the user's spaces plus personal items.

**Returns:**

`AdapterOperationResult`: Date-sorted entries; each has kind "meeting" | "call" | "event" with kind-specific fields (meetings carry uuid/shareUrl/isHost/liveNow, events carry eventId/notes/isOwner)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"voice","method":"getCalendar","params":{}}' | jq .
```

**Example response:**

```json
{
  "count": 2,
  "from": "2026-07-29T10:00:00.000Z",
  "to": "2026-08-12T10:00:00.000Z",
  "entries": [
    {
      "kind": "meeting",
      "uuid": "ab12cd34ef",
      "title": "Standup",
      "startAt": "2026-07-30T14:00:00.000Z",
      "durationMinutes": 30,
      "recurrence": "weekly",
      "isHost": true,
      "liveNow": false,
      "shareUrl": "https://host.withmirra.com/meet/ab12cd34ef"
    },
    {
      "kind": "event",
      "eventId": "665f00000000000000000001",
      "title": "Deep work",
      "startAt": "2026-07-31T18:00:00.000Z",
      "durationMinutes": 120,
      "allDay": false,
      "recurrence": "none",
      "isOwner": true
    }
  ]
}
```

### `scheduleMeeting`

Schedule a Mirra meeting ahead of time (Google Meet style). Returns a stable share link immediately; reminders fire automatically 10 minutes before and at start. Supports recurrence. The meeting appears on the calendar and in the space.

**Arguments:**

- `title` (string, *optional*): Meeting title. Defaults to "Mirra Meeting".
- `groupId` (string, *optional*): Space to attach the meeting to. Omit for a personal meeting.
- `startAt` (string, **required**): First occurrence, ISO date, must be in the future.
- `durationMinutes` (number, *optional*): Length in minutes, 15 to 480. Default 30.
- `timezone` (string, **required**): IANA timezone the meeting is scheduled in (recurrence follows this wall clock), e.g. "America/New_York".
- `recurrence` (string, *optional*): One of "none", "daily", "weekly", "monthly". Default "none".

**Returns:**

`AdapterOperationResult`: The scheduled series: uuid, shareUrl, startAt, nextOccurrenceAt, recurrence

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"voice","method":"scheduleMeeting","params":{"title":"Standup","groupId":"683f000000000000000000aa","startAt":"2026-08-04T13:00:00.000Z","durationMinutes":30,"timezone":"America/New_York","recurrence":"weekly"}}' | jq .
```

**Example response:**

```json
{
  "uuid": "ab12cd34ef",
  "shareUrl": "https://host.withmirra.com/meet/ab12cd34ef",
  "title": "Standup",
  "startAt": "2026-08-04T13:00:00.000Z",
  "nextOccurrenceAt": "2026-08-04T13:00:00.000Z",
  "durationMinutes": 30,
  "timezone": "America/New_York",
  "recurrence": "weekly"
}
```

### `cancelScheduledMeeting`

Cancel a scheduled meeting series (host only). Cancels every future occurrence. Use getCalendar first to find the meeting's uuid.

**Arguments:**

- `uuid` (string, **required**): The meeting's public uuid (10 characters, from getCalendar or the share link).

**Returns:**

`AdapterOperationResult`: Cancellation confirmation

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"voice","method":"cancelScheduledMeeting","params":{"uuid":"ab12cd34ef"}}' | jq .
```

**Example response:**

```json
{
  "uuid": "ab12cd34ef",
  "cancelled": true
}
```

### `createCalendarEvent`

Create a native calendar event (a plain entry: title, time, optional repeat and notes; no call attached). Use for blocks like "deep work Thursday 2 to 4" or appointments. For anything people should join, use scheduleMeeting instead.

**Arguments:**

- `title` (string, **required**): Event title.
- `groupId` (string, *optional*): Space the event belongs to. Omit for a personal event.
- `startAt` (string, **required**): Start, ISO date.
- `durationMinutes` (number, *optional*): Length in minutes, 5 to 1440. Default 60.
- `allDay` (boolean, *optional*): All-day event (no specific time). Default false.
- `timezone` (string, **required**): IANA timezone, e.g. "America/New_York".
- `recurrence` (string, *optional*): One of "none", "daily", "weekly", "monthly". Default "none".
- `notes` (string, *optional*): Optional notes, up to 2000 characters.

**Returns:**

`AdapterOperationResult`: The created event: eventId, title, startAt, durationMinutes, recurrence

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"voice","method":"createCalendarEvent","params":{"title":"Deep work","startAt":"2026-07-31T18:00:00.000Z","durationMinutes":120,"timezone":"America/New_York"}}' | jq .
```

**Example response:**

```json
{
  "eventId": "665f00000000000000000001",
  "title": "Deep work",
  "startAt": "2026-07-31T18:00:00.000Z",
  "durationMinutes": 120,
  "allDay": false,
  "timezone": "America/New_York",
  "recurrence": "none"
}
```

### `updateCalendarEvent`

Update a native calendar event the user owns. Only pass the fields being changed. Use getCalendar first to find the eventId.

**Arguments:**

- `eventId` (string, **required**): The event id from getCalendar.
- `title` (string, *optional*): New title.
- `startAt` (string, *optional*): New start, ISO date.
- `durationMinutes` (number, *optional*): New length in minutes, 5 to 1440.
- `allDay` (boolean, *optional*): All-day flag.
- `timezone` (string, *optional*): New IANA timezone.
- `recurrence` (string, *optional*): One of "none", "daily", "weekly", "monthly".
- `notes` (string, *optional*): New notes.

**Returns:**

`AdapterOperationResult`: The updated event

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"voice","method":"updateCalendarEvent","params":{"eventId":"665f00000000000000000001","startAt":"2026-07-31T19:00:00.000Z"}}' | jq .
```

**Example response:**

```json
{
  "eventId": "665f00000000000000000001",
  "title": "Deep work",
  "startAt": "2026-07-31T19:00:00.000Z",
  "durationMinutes": 120,
  "allDay": false,
  "timezone": "America/New_York",
  "recurrence": "none"
}
```

### `deleteCalendarEvent`

Delete a native calendar event the user owns. Meetings are cancelled with cancelScheduledMeeting, not this.

**Arguments:**

- `eventId` (string, **required**): The event id from getCalendar.

**Returns:**

`AdapterOperationResult`: Deletion confirmation

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"voice","method":"deleteCalendarEvent","params":{"eventId":"665f00000000000000000001"}}' | jq .
```

**Example response:**

```json
{
  "eventId": "665f00000000000000000001",
  "deleted": true
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
