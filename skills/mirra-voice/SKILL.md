---
name: mirra-voice
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
