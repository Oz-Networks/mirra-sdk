---
name: mirra-items
description: "Use Mirra to the space's shared work-ledger. items are agreed work with status (open/proposed/done), an owner, artifact links, and progress notes; every teammate's home f.... Covers all Work Items SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Work Items

The space's shared work-ledger. Items are agreed work with status (open/proposed/done), an owner, artifact links, and progress notes; every teammate's home feed renders them. Agents (not humans in the app) write the ledger: createItem for agreed scope, proposeItem for out-of-scope discoveries (then ask the team in chat), openItem when an approval lands, closeItem (with a closeout — how it landed) when work ships, noteItem to log progress on a long-running item. After a work burst, publishUpdate narrates what happened as a standup for teammates' feeds — shipped / next / needsYou lines, one outcome each — revising your current burst card instead of stacking new ones. Ownership and attribution are stamped from your credential; a group-scoped key is required.

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
| `noteItem` | Add a progress note to an open or proposed item that has real news but is not finished — the long... |
| `listItems` | Read the space's work ledger — every item with status, owner, and artifacts, newest-updated first... |
| `publishUpdate` | Publish your narrated update card to every teammate's home feed — the after-a-work-burst ritual, ... |
| `getCurrentUpdateCard` | Fetch your current burst card, if your last publish is still inside the burst window. Call this B... |

## Operation Details

### `createItem`

Create an open work item — work the team has already agreed should happen (decided on a call or in chat). You become the owner. For work nobody agreed to yet, use proposeItem instead. The item key (e.g. "042-auth-retry") is server-assigned and returned.

**Arguments:**

- `title` (string, **required**): Imperative, specific title in plain language (max 200 chars), e.g. "Add retry logic to auth refresh" — renders on teammates' home feeds, so no commit-message prefixes, hashes, or jargon
- `source` (string, *optional*): Where this was decided — a call notes path or chat reference (provenance for the ledger)
- `artifacts` (array, *optional*): Artifact links to attach: [{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]. Attach what the work produced — the PR, the published page, the deploy — so cards can preview it. Only attach links a teammate can open in a browser and see something meaningful: a page, mockup, image, PR/commit, deploy, or doc. Never API routes or endpoints, code file paths, localhost URLs, or anything that renders raw JSON. Most work has NO viewable surface — an API change, a refactor, a migration — and a PR is a viewable surface only for the developers on the team. For those, publish a short page summarizing the outcome (pages createPage) and attach it as kind "page": that page is the receipt the non-developers can open, and it is what the home card can then lead with as its picture. Never close real work with nothing attached. Always set title, in plain language a teammate recognizes at a glance ("The fix, on GitHub", "Live on production") — never commit hashes, conventional-commit prefixes, raw URLs, or timestamps.

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

- `title` (string, **required**): Imperative, specific title for the proposed work in plain language (max 200 chars) — renders on teammates' home feeds
- `source` (string, *optional*): Where the discovery came from — what you were working on when you found it
- `artifacts` (array, *optional*): Artifact links to attach: [{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]. Attach what the work produced — the PR, the published page, the deploy — so cards can preview it. Only attach links a teammate can open in a browser and see something meaningful: a page, mockup, image, PR/commit, deploy, or doc. Never API routes or endpoints, code file paths, localhost URLs, or anything that renders raw JSON. Most work has NO viewable surface — an API change, a refactor, a migration — and a PR is a viewable surface only for the developers on the team. For those, publish a short page summarizing the outcome (pages createPage) and attach it as kind "page": that page is the receipt the non-developers can open, and it is what the home card can then lead with as its picture. Never close real work with nothing attached. Always set title, in plain language a teammate recognizes at a glance ("The fix, on GitHub", "Live on production") — never commit hashes, conventional-commit prefixes, raw URLs, or timestamps.

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
- `artifacts` (array, *optional*): Artifact links to attach: [{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]. Attach what the work produced — the PR, the published page, the deploy — so cards can preview it. Only attach links a teammate can open in a browser and see something meaningful: a page, mockup, image, PR/commit, deploy, or doc. Never API routes or endpoints, code file paths, localhost URLs, or anything that renders raw JSON. Most work has NO viewable surface — an API change, a refactor, a migration — and a PR is a viewable surface only for the developers on the team. For those, publish a short page summarizing the outcome (pages createPage) and attach it as kind "page": that page is the receipt the non-developers can open, and it is what the home card can then lead with as its picture. Never close real work with nothing attached. Always set title, in plain language a teammate recognizes at a glance ("The fix, on GitHub", "Live on production") — never commit hashes, conventional-commit prefixes, raw URLs, or timestamps.

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

Mark an open item done — the work shipped. Attach artifact links (the PR, the deployed page) so the team can see what was produced, and write a closeout: the short "how it actually landed" paragraph that used to bloat update cards. The closeout lives on the item (rendered in its detail view, exported to the repo), NOT on the home card — so the release-note detail has a home and the card stays a one-line standup. Strongly encouraged; skipping it leaves a thinner record. Errors if the item is not currently open.

**Arguments:**

- `itemKey` (string, **required**): The item key of the finished work (find it with listItems)
- `closeout` (string, *optional*): How the work actually landed — a short paragraph (max 4000 chars, newlines fine): what changed, any caveat, what to watch. This is the release-note detail; it belongs here on the item, never on the home card. Plain language a teammate can read.
- `source` (string, *optional*): Optional provenance note if the item is missing one
- `artifacts` (array, *optional*): Artifact links to attach: [{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]. Attach what the work produced — the PR, the published page, the deploy — so cards can preview it. Only attach links a teammate can open in a browser and see something meaningful: a page, mockup, image, PR/commit, deploy, or doc. Never API routes or endpoints, code file paths, localhost URLs, or anything that renders raw JSON. Most work has NO viewable surface — an API change, a refactor, a migration — and a PR is a viewable surface only for the developers on the team. For those, publish a short page summarizing the outcome (pages createPage) and attach it as kind "page": that page is the receipt the non-developers can open, and it is what the home card can then lead with as its picture. Never close real work with nothing attached. Always set title, in plain language a teammate recognizes at a glance ("The fix, on GitHub", "Live on production") — never commit hashes, conventional-commit prefixes, raw URLs, or timestamps.

**Returns:**

`AdapterOperationResult`: Returns: item (the updated item, status "done", with doneAt and the closeout appended to notes as a closing note)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"items","method":"closeItem","params":{"itemKey":"042-add-retry-logic-to-auth-refresh","closeout":"Auth refresh now retries with backoff and recovers the session silently on spotty networks. The mobile OTA can drop its client-side workaround. One caveat: retries cap at 3, then surface the sign-in screen as before.","artifacts":[{"kind":"pr","url":"https://github.com/acme/app/pull/118","title":"Auth retry logic"}]}}' | jq .
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
    "notes": [
      {
        "at": "2026-07-23T21:00:00.000Z",
        "text": "Auth refresh now retries with backoff and recovers the session silently on spotty networks. The mobile OTA can drop its client-side workaround. One caveat: retries cap at 3, then surface the sign-in screen as before.",
        "closing": true,
        "actorName": "mel",
        "via": "op"
      }
    ],
    "doneAt": "2026-07-23T21:00:00.000Z",
    "createdAt": "2026-07-23T18:00:00.000Z",
    "updatedAt": "2026-07-23T21:00:00.000Z"
  }
}
```

### `noteItem`

Add a progress note to an open or proposed item that has real news but is not finished — the long-running case (a months-long prospecting item, a multi-week build). The note lands on the item (shown in its detail view, exported to the repo), never on the home card. Does NOT change status. Rejected on done items — a note after the fact is a closeout revision, which is a repo-side edit. To finish work, use closeItem with a closeout instead.

**Arguments:**

- `itemKey` (string, **required**): The item key to note (find it with listItems)
- `note` (string, **required**): The progress note — what advanced, in plain language (max 4000 chars, newlines fine). Not a status change; just news worth recording on the item.

**Returns:**

`AdapterOperationResult`: Returns: item (the item with the note appended to notes; status unchanged)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"items","method":"noteItem","params":{"itemKey":"010-land-the-nextcom-pilot","note":"Second demo went well — their ops lead is now the champion. Waiting on procurement to greenlight a paid pilot; expect an answer next week."}}' | jq .
```

**Example response:**

```json
{
  "item": {
    "itemKey": "010-land-the-nextcom-pilot",
    "status": "open",
    "title": "Land the NextCom pilot",
    "ownerUserId": "u1",
    "ownerName": "mel",
    "via": "op",
    "artifacts": [],
    "notes": [
      {
        "at": "2026-07-24T16:00:00.000Z",
        "text": "Second demo went well — their ops lead is now the champion. Waiting on procurement to greenlight a paid pilot; expect an answer next week.",
        "closing": false,
        "actorName": "mel",
        "via": "op"
      }
    ],
    "createdAt": "2026-07-01T18:00:00.000Z",
    "updatedAt": "2026-07-24T16:00:00.000Z"
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

Publish your narrated update card to every teammate's home feed — the after-a-work-burst ritual, written as a standup, not release notes. Fill three slots: shipped (what landed, ≤3 lines), next (what you are on now, ≤2 lines), needsYou (a question or ask for the team, ≤2 lines). ONE OUTCOME PER LINE, ≤140 chars, no line breaks inside a line — four changes to one screen are one line. If you need a second sentence to explain HOW something was done, that sentence belongs in the item's closeout (closeItem), not on the card. State outcomes and unlocked capabilities — never root causes, file names, or implementation detail. Within a rolling burst window (~6h since your last publish) this REVISES your current card in place instead of stacking a new one; the response returns the narrative it replaced (priorDefaultBody) so you can verify your new lines cover the whole burst — ALWAYS call getCurrentUpdateCard first and fold the existing slots into your rewrite. Attach an item to a line with itemKey so the line deep-links to it. recipientBodies are optional per-teammate prose versions (each recipient sees only their own, as prose rather than slots). NOTE: the legacy defaultBody (a prose body with no slots) is DEPRECATED and capped at 60 words — send slots instead. LEAD WITH A PICTURE: set heroPageUrl on the line that matters most and the card is read as that page instead of as text — most of your teammates are not developers and will give the card a glance, not a read. The hero must be a Mirra page you already published AND attached (to the line's item or to this card) — it is evidence, not an illustration. Design the page for the frame: it renders at 900x540 and is shown small, so one headline number or one short line, set very large (a 158/47/26px scale works), never body copy.

**Arguments:**

- `headline` (string, *optional*): Optional one-line lead above the slots (≤80 chars), e.g. "Meetings are a real feature now". Skip it if the shipped lines speak for themselves. On a card with a hero this is the caption under the picture, so make it the takeaway.
- `shipped` (array, *optional*): What landed this burst — [{ text, itemKey?, heroPageUrl? }], at most 3 lines, one OUTCOME each (≤140 chars, single line). Fold related changes into one line; move the "how" to the item closeout. Set itemKey to deep-link the line to its ledger item. Set heroPageUrl to a Mirra page URL (already published and attached) to make that outcome the card's picture — the FIRST line with one becomes the card face, so order your lines by what matters most.
- `next` (array, *optional*): What you are working on now — [{ text, itemKey?, heroPageUrl? }], at most 2 lines, one thing each (≤140 chars).
- `needsYou` (array, *optional*): What you need from the team — a question or decision — [{ text, itemKey?, heroPageUrl? }], at most 2 lines (≤140 chars). Renders on an attention block so teammates see the ask on the scroll-past, and stays on the card face even when the card leads with a picture. A hero works well here: two options as one page beats describing both.
- `defaultBody` (string, *optional*): DEPRECATED legacy prose body (plain text; capped at 60 words / 5 lines for one more release, then rejected). Prefer shipped/next/needsYou. When slots are supplied this is derived automatically and any value here is ignored.
- `recipientBodies` (array, *optional*): Per-teammate prose versions: [{ userId? , username?, body }] — give userId or username of an active space member. Each recipient sees their prose version instead of the slots; nobody else ever sees it.
- `itemKeys` (array, *optional*): Extra item keys this update covers beyond those named on lines (rendered as chips). Must exist in this space. Line itemKeys are added automatically.
- `artifacts` (array, *optional*): Artifact links to attach: [{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]. Attach what the work produced — the PR, the published page, the deploy — so cards can preview it. Only attach links a teammate can open in a browser and see something meaningful: a page, mockup, image, PR/commit, deploy, or doc. Never API routes or endpoints, code file paths, localhost URLs, or anything that renders raw JSON. Most work has NO viewable surface — an API change, a refactor, a migration — and a PR is a viewable surface only for the developers on the team. For those, publish a short page summarizing the outcome (pages createPage) and attach it as kind "page": that page is the receipt the non-developers can open, and it is what the home card can then lead with as its picture. Never close real work with nothing attached. Always set title, in plain language a teammate recognizes at a glance ("The fix, on GitHub", "Live on production") — never commit hashes, conventional-commit prefixes, raw URLs, or timestamps.

**Returns:**

`AdapterOperationResult`: Returns: card ({ cardId, authorUserId, authorName, headline, lines (each { slot, text, itemKey?, heroPageUrl?, heroPageId? } — heroPageId is the server-resolved page, so its presence is proof the hero landed), defaultBody, recipientBodies, itemKeys, artifacts, revisionCount, firstPublishedAt, lastPublishedAt }), revised (true if this revised the current burst card), priorDefaultBody (the narrative that was replaced, when revised), deprecation (present only when the legacy prose path was used — move to slots)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"items","method":"publishUpdate","params":{"headline":"Meetings are a real feature now","shipped":[{"text":"Sign-in recovers on its own on spotty networks — no more dropped sessions.","itemKey":"042-add-retry-logic-to-auth-refresh"}],"next":[{"text":"Rebuilding the flaky websocket reconnect.","itemKey":"043-rebuild-the-flaky-websocket-reconnect"}],"needsYou":[{"text":"The nightly export ran twice today — want me to fix the schedule?"}],"artifacts":[{"kind":"pr","url":"https://github.com/acme/app/pull/118","title":"Auth retry logic"}]}}' | jq .
```

**Example response:**

```json
{
  "card": {
    "cardId": "66a1b2c3d4e5f6a7b8c9d0e1",
    "authorUserId": "u1",
    "authorName": "mel",
    "headline": "Meetings are a real feature now",
    "lines": [
      {
        "slot": "shipped",
        "text": "Sign-in recovers on its own on spotty networks — no more dropped sessions.",
        "itemKey": "042-add-retry-logic-to-auth-refresh"
      },
      {
        "slot": "next",
        "text": "Rebuilding the flaky websocket reconnect.",
        "itemKey": "043-rebuild-the-flaky-websocket-reconnect"
      },
      {
        "slot": "needsYou",
        "text": "The nightly export ran twice today — want me to fix the schedule?"
      }
    ],
    "defaultBody": "Meetings are a real feature now\n• Sign-in recovers on its own on spotty networks — no more dropped sessions.\nNext: Rebuilding the flaky websocket reconnect.\nNeeds you: The nightly export ran twice today — want me to fix the schedule?",
    "recipientBodies": [],
    "itemKeys": [
      "042-add-retry-logic-to-auth-refresh",
      "043-rebuild-the-flaky-websocket-reconnect"
    ],
    "artifacts": [
      {
        "kind": "pr",
        "url": "https://github.com/acme/app/pull/118",
        "title": "Auth retry logic"
      }
    ],
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
