---
name: mirra-ledger
description: "The team work-ledger ritual for agents on a Mirra space: track agreed work, propose discoveries (then ask in chat), relay approvals, close what ships, and publish ONE narrated update card per work burst — revise, never stack. Rides the Mirra items adapter / MCP work-ledger tools."
allowed-tools: Read, Write, Bash(curl:*, jq:*)
---

# Mirra Ledger

Your team shares one **work ledger** per Mirra space: items with status
(`open` / `proposed` / `done`), an owner, and artifact links. Everyone's home
feed renders it. Humans never edit the ledger in the app — **agents write it**,
one per teammate, through canonical ops. Your writes are attributed to your
human via your credential; you cannot write as anyone else.

The companion surface is the **update card**: after a burst of work you publish
a short narrative FOR your teammates' feeds. One card per burst — revised in
place as the burst continues, never stacked.

## The contract

1. **Decide, then do.** Work enters the ledger only after the team agreed to it
   — on a call (the call pipeline extracts items automatically) or in chat.
   Never invent scope.
2. **Discoveries are proposals.** Found something out of scope ("we should
   rebuild X")? `proposeItem`, then **post the question to the space chat**
   with your context so the team can decide. Don't sit on it, don't start it.
3. **Approvals travel through humans.** Nothing watches chat for you. When the
   team says yes to a proposal, the item's owner tells *their own* agent, and
   that agent flips it with `openItem`, citing where the decision happened.
   (Within a single run you may long-poll chat for a quick reply — the
   mirra-cowork pattern — but there is no standing listener.)
4. **Close what ships, with receipts.** `closeItem` when the work is done —
   self-declared, but attach artifacts (PR, page, deploy) so the team can see
   what was produced.
5. **Publish the burst, revise the card.** After each working session:
   `getCurrentUpdateCard` → if a card from this burst exists, rewrite ONE
   narrative covering the whole burst (old + new) → `publishUpdate`. Twenty
   sessions in an afternoon should read as one card that kept getting better.
6. **Write for the reader.** The card body is not a changelog — say what
   happened and what it means for the teammate reading it. Use
   `recipientBodies` when one teammate needs a tailored version (only they
   see it).

## Two ways to call

**Claude Code / any agent with a Mirra API key** — SDK resource calls:

```bash
curl -s -X POST "${API_URL:-https://api.fxn.world}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ "resourceId": "items", "method": "<operation>", "params": { ...args } }' | jq .
```

The space is pinned by your credential's group scope — you never pass a
groupId. A personal (non-group) key is rejected: ask whoever runs Mirra on
your team for a group-scoped key.

**claude.ai / Claude via the Mirra MCP connector** — the same ops surface as
persona tools: `track_work_item` (createItem / proposeItem via
`needs_approval`), `update_work_item` (openItem via `action: "approve"`,
closeItem via `action: "complete"`), `list_work_items`, and
`publish_status_update` (the publish ritual with the revise guard built in).

## Operations (resourceId `items`)

| Op | When | Key args |
|---|---|---|
| `createItem` | Team-agreed work → `open`, owned by you | `title`, `source?` (where decided), `artifacts?` |
| `proposeItem` | Out-of-scope discovery → `proposed` | `title`, `source?` (what you were doing), `artifacts?` |
| `openItem` | Approval relayed to you: `proposed → open` | `itemKey`, `source?` (where approved) |
| `closeItem` | Work shipped: `open → done` | `itemKey`, `artifacts?` (attach the output!) |
| `listItems` | Read the ledger; find itemKeys | `status?` |
| `getCurrentUpdateCard` | ALWAYS before publishing | — |
| `publishUpdate` | The burst narrative | `defaultBody`, `itemKeys?`, `recipientBodies?` (`[{ username \| userId, body }]`), `artifacts?` |

Artifacts everywhere are `[{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]`.

## The publish ritual, end to end

```bash
# 1. What did this burst touch?
... -d '{ "resourceId": "items", "method": "listItems", "params": { "status": "open" } }'

# 2. Is there already a card from this burst?
... -d '{ "resourceId": "items", "method": "getCurrentUpdateCard", "params": {} }'
# → { card: { defaultBody: "Started on auth retry (042).", itemKeys: [...] }, inBurst: true }

# 3. Publish ONE narrative covering the whole burst (fold the old body in):
... -d '{ "resourceId": "items", "method": "publishUpdate", "params": {
      "defaultBody": "Shipped auth retry (042) — token refreshes survive flaky networks now. Started the websocket rebuild (043).",
      "itemKeys": ["042-add-retry-logic-to-auth-refresh", "043-rebuild-the-flaky-websocket-reconnect"],
      "recipientBodies": [{ "username": "anthony", "body": "Auth retry is live — the mobile OTA can drop the workaround." }]
    } }'
# → { card: {...}, revised: true, priorDefaultBody: "Started on auth retry (042)." }
```

If `revised` came back true, sanity-check that your new body still covers
everything `priorDefaultBody` said — if not, publish once more with the
merged narrative (still the same card).

## The proposal flow, end to end

```bash
# 1. Propose the discovery
... -d '{ "resourceId": "items", "method": "proposeItem", "params": {
      "title": "Rebuild the flaky websocket reconnect logic",
      "source": "found while closing 042-auth-retry" } }'
# → item_key 043-...

# 2. Ask the team in the space chat (mirra-messaging), WITH your context:
... -d '{ "resourceId": "mirra-messaging", "method": "sendMessage", "params": {
      "groupId": "<your space groupId>",
      "content": "Proposal 043: rebuild the flaky websocket reconnect. Found it while closing 042 — reconnects drop silently after ~3 retries. ~1 day. Yes/no?" } }'

# 3. STOP. The decision comes back through a human. When your human relays a
#    yes (to the item's owner's agent — maybe not you):
... -d '{ "resourceId": "items", "method": "openItem", "params": {
      "itemKey": "043-rebuild-the-flaky-websocket-reconnect",
      "source": "approved in space chat 2026-07-23" } }'
```

## Rules the server enforces (don't fight them)

- Owner and actor are stamped from your credential — args can't override them.
- Ledger writes need an active group membership; group scope is pinned server-side.
- `openItem` only from `proposed`; `closeItem` only from `open` — anything else errors with the item's actual status.
- `itemKeys` on a card must exist in the space; unknown keys error immediately.
- `recipientBodies` recipients must be active space members.
- Publishing inside the burst window ALWAYS revises your current card — stacking is not possible; the guard exists so you fold narratives, not to gate the write.
