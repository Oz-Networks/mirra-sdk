---
name: channels
description: "Use Mirra to the places a space publishes to — its corporate x, blog, newsletter — and the drafted copy waiting to go out to them. use listchannels to see what this space.... Covers all Space Channels SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Space Channels

The places a space publishes to — its corporate X, blog, newsletter — and the drafted copy waiting to go out to them. Use listChannels to see what this space publishes to and which channels are healthy, then createDraftSet to file per-channel copy drafted from a burst update card; a teammate reviews and approves it in the app before anything is sent. After you actually post, record the outcome with markDraftSent (which attaches the live post back to the update card that produced it) or markDraftFailed (which flags the channel as needing reconnection). These ops never post anything themselves. The space is taken from your credential, not from arguments.

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
    "resourceId": "channels",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/channels/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `listChannels` | The channels this space publishes to, with the per-channel limits you must draft within (characte... |
| `createDraftSet` | File drafted copy for review, one draft per channel. Nothing is sent — a teammate edits, approves... |
| `getDraftSet` | Read one draft set, including which drafts are queued for sending. Call this when you receive a c... |
| `listPendingDraftSets` | Draft sets in this space still awaiting review or partially sent. Useful for a nightly reminder f... |
| `claimDraftForDispatch` | Take exclusive ownership of one queued draft before you post it. Call this immediately before sen... |
| `markDraftSent` | Record that you posted one draft. This also attaches the live post back to the update card it cam... |
| `markDraftFailed` | Record that a post failed. Also writes the reason onto the channel itself, which is what surfaces... |

## Operation Details

### `listChannels`

The channels this space publishes to, with the per-channel limits you must draft within (character cap, whether a title is required). Call this before drafting — a channel that is disabled or carrying lastError should not get copy written for it.

**Returns:**

`AdapterOperationResult`: Returns: channels (the space registry), descriptors (per-type limits and voice hints)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"channels","method":"listChannels","params":{}}' | jq .
```

**Example response:**

```json
{
  "channels": [
    {
      "id": "ch_1",
      "type": "twitter",
      "label": "@fxn",
      "enabled": true,
      "healthy": true
    }
  ]
}
```

### `createDraftSet`

File drafted copy for review, one draft per channel. Nothing is sent — a teammate edits, approves and presses Send, which calls you back to do the posting. Idempotent per source card revision: calling twice for the same card returns the existing set rather than making a second one. IMPORTANT: bail out before calling this when the triggering event has revised:true, or every revision of a burst card re-drafts the same work.

**Arguments:**

- `sourceCardId` (string, **required**): The update card this copy was drafted from (cardId from the items.update.published event)
- `drafts` (array, **required**): One per channel: [{ channelId, channelType, channelLabel, title?, body }]. channelId/type/label come from listChannels. Respect each channel's character cap — an over-length draft cannot be approved. Do NOT attach pictures here: the source card's hero is added automatically to every channel that takes one, and a reviewer can swap or remove it.
- `skipPoster` (boolean, *optional*): Set true to file these as text-only, without the source card's hero picture. Only pass this if the team has decided its posts should not carry pictures.

**Returns:**

`AdapterOperationResult`: Returns: setId, created (false when this call matched an existing set), draftCount

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"channels","method":"createDraftSet","params":{"sourceCardId":"6a64b5923657f98c84d1531c","drafts":[{"channelId":"ch_1","channelType":"twitter","channelLabel":"@fxn","body":"Spaces can now hold their own credentials."}]}}' | jq .
```

**Example response:**

```json
{
  "setId": "6a6600112233445566778899",
  "created": true,
  "draftCount": 1
}
```

### `getDraftSet`

Read one draft set, including which drafts are queued for sending. Call this when you receive a channels.send.requested event — it tells you exactly what a person approved and what the final edited copy says.

**Arguments:**

- `setId` (string, **required**): The draft set id (from the send event)

**Returns:**

`AdapterOperationResult`: Returns: set (with drafts and their statuses), stale (true if the source card has been revised since drafting)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"channels","method":"getDraftSet","params":{"setId":"6a6600112233445566778899"}}' | jq .
```

**Example response:**

```json
{
  "stale": false
}
```

### `listPendingDraftSets`

Draft sets in this space still awaiting review or partially sent. Useful for a nightly reminder flow.

**Returns:**

`AdapterOperationResult`: Returns: sets, count

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"channels","method":"listPendingDraftSets","params":{}}' | jq .
```

**Example response:**

```json
{
  "count": 1
}
```

### `claimDraftForDispatch`

Take exclusive ownership of one queued draft before you post it. Call this immediately before sending, and post ONLY when it returns claimed:true — a false means another dispatch run already has this draft, or somebody cancelled it, and posting anyway is how a space publishes the same announcement twice. Filtering on status:"queued" yourself is not enough: two runs can read that at the same moment and both post. This is a single atomic database claim, so exactly one caller wins.

**Arguments:**

- `setId` (string, **required**): The draft set id
- `draftId` (string, **required**): draftId of the draft you are about to post
- `dispatchToken` (string, *optional*): The draft's dispatchToken, exactly as getDraftSet returned it. Identifies this attempt — pass the same value to markDraftSent/markDraftFailed. Omit only when the draft has none

**Returns:**

`AdapterOperationResult`: Returns: claimed (post only if true), reason (why it was refused, when false)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"channels","method":"claimDraftForDispatch","params":{"setId":"6a6600112233445566778899","draftId":"d-1","dispatchToken":"tok-1"}}' | jq .
```

**Example response:**

```json
{
  "claimed": true
}
```

### `markDraftSent`

Record that you posted one draft. This also attaches the live post back to the update card it came from, so the card later reads "shipped this, and here is where we said so". Deduped on url — a retried dispatch adds one link, not two.

**Arguments:**

- `setId` (string, **required**): The draft set id
- `channelId` (string, **required**): Which channel was posted to
- `sentUrl` (string, **required**): Permalink to the live post
- `dispatchToken` (string, *optional*): The token you claimed this draft with. Rejected if the draft has since been taken back or sent again, which stops a run that hung from stamping "sent" over somebody's recovery

**Returns:**

`AdapterOperationResult`: Returns: setId, status (the set's status after this draft settled)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"channels","method":"markDraftSent","params":{"setId":"6a6600112233445566778899","channelId":"ch_1","sentUrl":"https://x.com/fxn/status/1"}}' | jq .
```

**Example response:**

```json
{
  "setId": "6a6600112233445566778899",
  "status": "sent"
}
```

### `markDraftFailed`

Record that a post failed. Also writes the reason onto the channel itself, which is what surfaces the Reconnect prompt in the app — and is the only trace that survives once the draft set is deleted. Always call this on failure rather than swallowing the error.

**Arguments:**

- `setId` (string, **required**): The draft set id
- `channelId` (string, **required**): Which channel failed
- `error` (string, **required**): What went wrong, in words a teammate can act on
- `dispatchToken` (string, *optional*): The token you claimed this draft with. Rejected if the attempt has been superseded

**Returns:**

`AdapterOperationResult`: Returns: setId, status (the set's status after this draft settled)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"channels","method":"markDraftFailed","params":{"setId":"6a6600112233445566778899","channelId":"ch_1","error":"The X token was revoked"}}' | jq .
```

**Example response:**

```json
{
  "setId": "6a6600112233445566778899",
  "status": "partiallySent"
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
