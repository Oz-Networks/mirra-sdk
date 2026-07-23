---
name: mirra-items
description: "Use Mirra to the space's shared work-ledger. items are agreed work with status (open/proposed/done), an owner, and artifact links; every teammate's home feed renders them.... Covers all Work Items SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Work Items

The space's shared work-ledger. Items are agreed work with status (open/proposed/done), an owner, and artifact links; every teammate's home feed renders them. Agents (not humans in the app) write the ledger: createItem for agreed scope, proposeItem for out-of-scope discoveries (then ask the team in chat), openItem when an approval lands, closeItem when work ships. After a work burst, publishUpdate narrates what happened for teammates' feeds — it revises your current burst card instead of stacking new ones. Ownership and attribution are stamped from your credential; a group-scoped key is required.

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
    "resourceId": "items",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/items/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `createItem` | Create an open work item — work the team has already agreed should happen (decided on a call or i... |
| `proposeItem` | Propose work the team has NOT agreed to yet — an out-of-scope discovery ("we should rebuild X"). ... |
| `openItem` | Flip a proposed item to open — the team approved it (decided on a call or in chat, relayed to you... |
| `closeItem` | Mark an open item done — the work shipped. Attach artifact links (the PR, the deployed page) so t... |
| `listItems` | Read the space's work ledger — every item with status, owner, and artifacts, newest-updated first... |
| `publishUpdate` | Publish your narrated update card to every teammate's home feed — the after-a-work-burst ritual. ... |
| `getCurrentUpdateCard` | Fetch your current burst card, if your last publish is still inside the burst window. Call this B... |

## Operation Details

### `createItem`

Create an open work item — work the team has already agreed should happen (decided on a call or in chat). You become the owner. For work nobody agreed to yet, use proposeItem instead. The item key (e.g. "042-auth-retry") is server-assigned and returned.

**Arguments:**

- `title` (string, **required**): Imperative, specific title (max 200 chars), e.g. "Add retry logic to auth refresh"
- `source` (string, *optional*): Where this was decided — a call notes path or chat reference (provenance for the ledger)
- `artifacts` (array, *optional*): Artifact links to attach: [{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]. Attach what the work produced — the PR, the published page, the deploy — so cards can preview it.

**Returns:**

`AdapterOperationResult`: Returns: item ({ itemKey, status, title, ownerUserId, ownerName, source, via, artifacts, createdAt, updatedAt })

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"items","method":"createItem","params":{"title":"Add retry logic to auth refresh","source":"calls/2026/07/22-standup.md"}}' | jq .
```

**Example response:**

```json
{
  "item": {
    "itemKey": "042-add-retry-logic-to-auth-refresh",
    "status": "open",
    "title": "Add retry logic to auth refresh",
    "ownerUserId": "u1",
    "ownerName": "mel",
    "source": "calls/2026/07/22-standup.md",
    "via": "op",
    "artifacts": [],
    "createdAt": "2026-07-23T18:00:00.000Z",
    "updatedAt": "2026-07-23T18:00:00.000Z"
  }
}
```

### `proposeItem`

Propose work the team has NOT agreed to yet — an out-of-scope discovery ("we should rebuild X"). The item enters the ledger as `proposed` and waits for a decision. After proposing, post the question to the space chat (mirra-messaging sendMessage) with your context so the team can decide. When the owner relays approval, their agent flips it with openItem.

**Arguments:**

- `title` (string, **required**): Imperative, specific title for the proposed work (max 200 chars)
- `source` (string, *optional*): Where the discovery came from — what you were working on when you found it
- `artifacts` (array, *optional*): Artifact links to attach: [{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]. Attach what the work produced — the PR, the published page, the deploy — so cards can preview it.

**Returns:**

`AdapterOperationResult`: Returns: item ({ itemKey, status: "proposed", title, ownerUserId, ownerName, source, via, artifacts, createdAt, updatedAt })

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"items","method":"proposeItem","params":{"title":"Rebuild the flaky websocket reconnect logic","source":"found while closing 042-auth-retry"}}' | jq .
```

**Example response:**

```json
{
  "item": {
    "itemKey": "043-rebuild-the-flaky-websocket-reconnect",
    "status": "proposed",
    "title": "Rebuild the flaky websocket reconnect logic",
    "ownerUserId": "u1",
    "ownerName": "mel",
    "source": "found while closing 042-auth-retry",
    "via": "op",
    "artifacts": [],
    "createdAt": "2026-07-23T18:00:00.000Z",
    "updatedAt": "2026-07-23T18:00:00.000Z"
  }
}
```

### `openItem`

Flip a proposed item to open — the team approved it (decided on a call or in chat, relayed to you by your human). Record where the approval happened in source. Errors if the item is not currently proposed.

**Arguments:**

- `itemKey` (string, **required**): The item key, e.g. "043-rebuild-the-flaky-websocket-reconnect" (find it with listItems)
- `source` (string, *optional*): Where the approval was decided — chat thread or call reference
- `artifacts` (array, *optional*): Artifact links to attach: [{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]. Attach what the work produced — the PR, the published page, the deploy — so cards can preview it.

**Returns:**

`AdapterOperationResult`: Returns: item (the updated item, status "open")

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"items","method":"openItem","params":{"itemKey":"043-rebuild-the-flaky-websocket-reconnect","source":"approved in space chat 2026-07-23"}}' | jq .
```

**Example response:**

```json
{
  "item": {
    "itemKey": "043-rebuild-the-flaky-websocket-reconnect",
    "status": "open",
    "title": "Rebuild the flaky websocket reconnect logic",
    "ownerUserId": "u1",
    "ownerName": "mel",
    "source": "found while closing 042-auth-retry",
    "via": "op",
    "artifacts": [],
    "createdAt": "2026-07-23T18:00:00.000Z",
    "updatedAt": "2026-07-23T19:00:00.000Z"
  }
}
```

### `closeItem`

Mark an open item done — the work shipped. Attach artifact links (the PR, the deployed page) so the team can see what was produced. Errors if the item is not currently open.

**Arguments:**

- `itemKey` (string, **required**): The item key of the finished work (find it with listItems)
- `source` (string, *optional*): Optional provenance note if the item is missing one
- `artifacts` (array, *optional*): Artifact links to attach: [{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]. Attach what the work produced — the PR, the published page, the deploy — so cards can preview it.

**Returns:**

`AdapterOperationResult`: Returns: item (the updated item, status "done", with doneAt)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"items","method":"closeItem","params":{"itemKey":"042-add-retry-logic-to-auth-refresh","artifacts":[{"kind":"pr","url":"https://github.com/acme/app/pull/118","title":"Auth retry logic"}]}}' | jq .
```

**Example response:**

```json
{
  "item": {
    "itemKey": "042-add-retry-logic-to-auth-refresh",
    "status": "done",
    "title": "Add retry logic to auth refresh",
    "ownerUserId": "u1",
    "ownerName": "mel",
    "via": "op",
    "artifacts": [
      {
        "kind": "pr",
        "url": "https://github.com/acme/app/pull/118",
        "title": "Auth retry logic"
      }
    ],
    "doneAt": "2026-07-23T21:00:00.000Z",
    "createdAt": "2026-07-23T18:00:00.000Z",
    "updatedAt": "2026-07-23T21:00:00.000Z"
  }
}
```

### `listItems`

Read the space's work ledger — every item with status, owner, and artifacts, newest-updated first. Use it to find item keys before openItem/closeItem, to see what is open before starting work, and to gather item keys for publishUpdate.

**Arguments:**

- `status` (string, *optional*): Filter to one status: "open", "proposed", or "done" (default: all)

**Returns:**

`AdapterOperationResult`: Returns: items (array of { itemKey, status, title, ownerUserId, ownerName, source, via, artifacts, doneAt, createdAt, updatedAt }), count

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"items","method":"listItems","params":{"status":"open"}}' | jq .
```

**Example response:**

```json
{
  "items": [
    {
      "itemKey": "042-add-retry-logic-to-auth-refresh",
      "status": "open",
      "title": "Add retry logic to auth refresh",
      "ownerUserId": "u1",
      "ownerName": "mel",
      "via": "op",
      "artifacts": [],
      "createdAt": "2026-07-23T18:00:00.000Z",
      "updatedAt": "2026-07-23T18:00:00.000Z"
    }
  ],
  "count": 1
}
```

### `publishUpdate`

Publish your narrated update card to every teammate's home feed — the after-a-work-burst ritual. Within a rolling burst window (~6h since your last publish) this REVISES your current card in place instead of stacking a new one; the response returns the narrative it replaced (priorDefaultBody) so you can verify your new body covers the whole burst. ALWAYS call getCurrentUpdateCard first and fold the existing narrative into your rewrite. defaultBody is what everyone sees; recipientBodies are optional per-teammate versions (each recipient sees only their own). Reference the items you touched via itemKeys so the card renders them as chips.

**Arguments:**

- `defaultBody` (string, **required**): The narrative every teammate sees (markdown, max 8000 chars). Written FOR the reader: what happened, what it means for them.
- `recipientBodies` (array, *optional*): Per-teammate versions: [{ userId? , username?, body }] — give userId or username of an active space member. Each recipient sees their version instead of defaultBody; nobody else ever sees it.
- `itemKeys` (array, *optional*): Item keys this update covers (rendered as ledger chips). Must exist in this space.
- `artifacts` (array, *optional*): Artifact links to attach: [{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]. Attach what the work produced — the PR, the published page, the deploy — so cards can preview it.

**Returns:**

`AdapterOperationResult`: Returns: card ({ cardId, authorUserId, authorName, defaultBody, recipientBodies, itemKeys, artifacts, revisionCount, firstPublishedAt, lastPublishedAt }), revised (true if this revised the current burst card), priorDefaultBody (the narrative that was replaced, when revised)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"items","method":"publishUpdate","params":{"defaultBody":"Shipped auth retry (042) — token refreshes now survive flaky networks. Started on the websocket rebuild (043); reconnect state machine is sketched.","itemKeys":["042-add-retry-logic-to-auth-refresh","043-rebuild-the-flaky-websocket-reconnect"],"recipientBodies":[{"username":"anthony","body":"Auth retry is live — your mobile OTA can drop the workaround. Websocket rebuild underway."}]}}' | jq .
```

**Example response:**

```json
{
  "card": {
    "cardId": "66a1b2c3d4e5f6a7b8c9d0e1",
    "authorUserId": "u1",
    "authorName": "mel",
    "defaultBody": "Shipped auth retry (042) — token refreshes now survive flaky networks. Started on the websocket rebuild (043); reconnect state machine is sketched.",
    "recipientBodies": [
      {
        "userId": "u2",
        "body": "Auth retry is live — your mobile OTA can drop the workaround. Websocket rebuild underway."
      }
    ],
    "itemKeys": [
      "042-add-retry-logic-to-auth-refresh",
      "043-rebuild-the-flaky-websocket-reconnect"
    ],
    "artifacts": [],
    "revisionCount": 1,
    "firstPublishedAt": "2026-07-23T15:00:00.000Z",
    "lastPublishedAt": "2026-07-23T21:00:00.000Z"
  },
  "revised": true,
  "priorDefaultBody": "Started on auth retry (042)."
}
```

### `getCurrentUpdateCard`

Fetch your current burst card, if your last publish is still inside the burst window. Call this BEFORE publishUpdate: when a card comes back, fold its narrative into your rewrite so the revised card covers the whole burst (revise, never stack). Returns card: null when a fresh publish would start a new card.

**Returns:**

`AdapterOperationResult`: Returns: card (your in-burst card or null), inBurst (boolean), burstGapHours (the rolling window size)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"items","method":"getCurrentUpdateCard","params":{}}' | jq .
```

**Example response:**

```json
{
  "card": {
    "cardId": "66a1b2c3d4e5f6a7b8c9d0e1",
    "authorUserId": "u1",
    "authorName": "mel",
    "defaultBody": "Started on auth retry (042).",
    "recipientBodies": [],
    "itemKeys": [
      "042-add-retry-logic-to-auth-refresh"
    ],
    "artifacts": [],
    "revisionCount": 0,
    "firstPublishedAt": "2026-07-23T15:00:00.000Z",
    "lastPublishedAt": "2026-07-23T15:00:00.000Z"
  },
  "inBurst": true,
  "burstGapHours": 6
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
