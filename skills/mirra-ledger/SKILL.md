---
name: mirra-ledger
description: "The team work-ledger ritual for agents on a Mirra space: track agreed work, propose discoveries (then ask in chat), relay approvals, close what ships with a page a teammate can actually open, and publish ONE narrated update card per work burst — led by a picture, revised, never stacked. Rides the Mirra items adapter / MCP work-ledger tools."
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
4. **Close what ships, with receipts AND a closeout.** `closeItem` when the
   work is done — attach artifacts (PR, page, deploy) so the team can see what
   was produced, and write a `closeout`: the short "how it actually landed"
   paragraph (what changed, any caveat, what to watch). The closeout lives on
   the item — rendered in its detail view, exported to the repo — so the
   release-note detail has a home and the card stays a one-line standup. For a
   long-running item that has real news but nothing to close (a deal moving
   stages, a multi-week build hitting a milestone), `noteItem` adds a progress
   note without changing status.
5. **Publish the burst, revise the card.** After each working session:
   `getCurrentUpdateCard` → if a card from this burst exists, rewrite ONE
   standup covering the whole burst (old + new) → `publishUpdate`. Twenty
   sessions in an afternoon should read as one card that kept getting better.
6. **The card is a standup, not release notes.** Fill three slots —
   `shipped` (what landed, ≤3 lines), `next` (what you're on now, ≤2), and
   `needsYou` (a question or ask for the team, ≤2). **One line per OUTCOME,
   not per change** — four changes to one screen are ONE line — each ≤140
   chars with no line break inside it. If you need a second sentence to
   explain HOW something was done, that sentence belongs in the item's
   closeout, not on the card. Say the outcome and what it unlocks; never root
   causes, file names, or implementation detail. An optional one-line
   `headline` leads the card. Attach an item to a line with `itemKey` and the
   line deep-links to it. Use `recipientBodies` when one teammate needs a
   tailored version (only they see it, as prose instead of slots). The caps are
   enforced server-side — a wall of ten bullets is rejected, with the error
   naming the closeout as where the detail goes.
7. **Name things for humans.** Item titles and artifact titles render
   directly on teammates' home feeds — write them the way you'd say them
   aloud: "The fix, on GitHub", "Live on production", "Setup guide". Never
   commit hashes, conventional-commit prefixes (`fix(scope): …`), slugs,
   raw URLs, or timestamps. The `itemKey` slug is machine identity, never
   shown to people — don't write titles to match it.
8. **Attach only what a person can open — and make one when there isn't one.**
   Artifacts are tap targets on teammates' phones. Every link must show them
   something meaningful in a browser: the published page, the mockup or
   image, the PR or commit, the deploy, the doc. Never API routes or
   endpoints, code file paths, localhost URLs, or anything that renders raw
   JSON. **Most work has no viewable surface** — an API change, a refactor, a
   migration, a config tweak — and a PR is a viewable surface only for the
   developers on the team. For those, spend two minutes and **publish a page**
   (`createPage`, `mirra-pages`), then attach it as `kind: "page"`. That page
   is the receipt: the one artifact the non-developers on the team can open
   and understand. Never close real work with nothing attached.
9. **Lead with a picture.** A card with a picture gets looked at; a card
   without one gets scrolled past, however well it is written. Once an
   outcome has a page, name that page as the line's `heroPageUrl` and the
   card face *becomes* the page. The first line that declares one wins the
   face, so order your lines by what matters most. The page has to be one
   you already published and attached — the server checks, because a picture
   of work is evidence, not illustration. See **Make the picture** below.

## Two ways to call

**Claude Code / any agent with a Mirra API key** — SDK resource calls:

```bash
curl -s -X POST "${API_URL:-https://api.fxn.world}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -H "X-Scope: group" -H "X-Group-Id: ${MIRRA_GROUP_ID}" \
  -d '{ "resourceId": "items", "method": "<operation>", "params": { ...args } }' | jq .
```

Ledger ops never take a groupId argument — the space comes from the scope
headers above when you hold a plain user API key (find the groupId once via
`mirra-messaging getGroups`), or from the credential itself for MCP keys and
Mirra-hosted flows (omit the headers there). Writes without a group scope
are rejected as personal-scope, and the server verifies your human is an
active member of the target space.

**claude.ai / Claude via the Mirra MCP connector** — the same ops surface as
persona tools: `track_work_item` (createItem / proposeItem via
`needs_approval`), `update_work_item` (openItem via `action: "approve"`,
closeItem via `action: "complete"` with a `closeout`), `add_work_note`
(noteItem), `list_work_items`, and `publish_status_update` (the standup ritual
— `shipped` / `next` / `needs_from_team` — with the revise guard built in).
There the hero is called `picture_page_url` on a line, and artifacts are
`links`; everything under **Make the picture** applies unchanged.

## Operations (resourceId `items`)

| Op | When | Key args |
|---|---|---|
| `createItem` | Team-agreed work → `open`, owned by you | `title`, `source?` (where decided), `artifacts?` |
| `proposeItem` | Out-of-scope discovery → `proposed` | `title`, `source?` (what you were doing), `artifacts?` |
| `openItem` | Approval relayed to you: `proposed → open` | `itemKey`, `source?` (where approved) |
| `closeItem` | Work shipped: `open → done` | `itemKey`, `closeout?` (how it landed — write it!), `artifacts?` (attach the output — publish a page if there isn't one) |
| `noteItem` | Progress on an open/proposed item; no status change | `itemKey`, `note` |
| `listItems` | Read the ledger; find itemKeys | `status?` |
| `getCurrentUpdateCard` | ALWAYS before publishing | — |
| `publishUpdate` | The burst standup | `headline?`, `shipped?`/`next?`/`needsYou?` (`[{ text, itemKey?, heroPageUrl? }]`), `recipientBodies?` (`[{ username \| userId, body }]`), `artifacts?` |

Slot caps: `shipped` ≤3, `next` ≤2, `needsYou` ≤2; each line ≤140 chars, one
outcome, no line break inside it. Over-cap errors name the closeout as where the
detail belongs. (`defaultBody` still works as a legacy prose body — capped at
60 words, deprecated — but prefer slots.)

Artifacts everywhere are `[{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]`.
Always set `title`, in plain language (contract rule 7): "The fix, on GitHub",
not "commit 2c3fe3ab"; "Live on production", not "Hetzner deploy 2026-07-24 00:23 UTC".
And only URLs a person can open and see something (contract rule 8): the PR,
the page, the image — never an API route path or an endpoint that returns JSON.
When the work has no viewable surface, publish a page and attach that — see
**Make the picture**.

## Close with a closeout

The detail that used to bloat the card goes here, on the item:

```bash
... -d '{ "resourceId": "items", "method": "closeItem", "params": {
      "itemKey": "042-add-retry-logic-to-auth-refresh",
      "closeout": "Auth refresh now retries with backoff and recovers the session silently on spotty networks. The mobile OTA can drop its client-side workaround. Caveat: retries cap at 3, then fall back to the sign-in screen as before.",
      "artifacts": [{ "kind": "pr", "url": "https://github.com/acme/app/pull/118", "title": "The fix, on GitHub" }]
    } }'
```

## Make the picture

**Do this while you are closing the item, not while you are publishing the
card.** By publish time the burst is over and there is nothing to make a page
out of but the sentence you just wrote. The page belongs to the *outcome*, so
it is authored once, at `closeItem`, and it keeps working: `heroPageUrl` points
at a live page, so editing the page updates every card that shows it.

Two minutes, three calls:

```bash
# 1. Publish the poster. Start from poster.jsx in this skill's directory —
#    change the four strings at the top, leave the frame alone.
... -d '{ "resourceId": "pages", "method": "createPage", "params": {
      "path": "/store-removal",
      "title": "The store is gone",
      "code": "<the JSX, with your four strings>"
    } }'
# → { id: "665…", url: "https://anthony.withmirra.com/store-removal", … }

# 2. Attach it to the item as the receipt (rule 8).
... -d '{ "resourceId": "items", "method": "closeItem", "params": {
      "itemKey": "046-remove-the-store-and-marketplace",
      "closeout": "The store, the marketplace and every screen that reached them are gone — 179,644 lines and one migration. Nothing else regressed. Watch: `users.developer` is NOT the API-key flag, so key issuance is unaffected.",
      "artifacts": [
        { "kind": "page", "url": "https://anthony.withmirra.com/store-removal", "title": "What came out" },
        { "kind": "pr",   "url": "https://github.com/acme/app/pull/121", "title": "The removal, on GitHub" }
      ]
    } }'

# 3. Name it as the line's hero when you publish (see the ritual below).
```

**Design it for the frame, because the frame is brutal.** The page is
screenshotted at 900×540 and shown at roughly a third of that on a phone. Body
text at 14px lands as five pixels of grey. So: one statement set very large
(158px for a number, ~104px for a few words), one caption at 47px, labels at
26px, nothing else. `poster.jsx` in this skill's directory is that layout with
the sizes already set — it is a template to fill in, not an example to admire.

**What makes a good one.** Say the outcome the way you would say it out loud,
not the way a changelog would: *"The store is gone"*, not *"Removed store and
marketplace modules"*. If there is a number that lands — lines removed, hours
saved, a rate that moved — that number is the statement and the words are the
caption. If there isn't, the outcome itself is the statement. Never a list.

**A picture is not always a poster.** If the work already produced something
worth looking at — a real dashboard, a report with the actual numbers in it, a
comparison of two options for a `needsYou` ask — publish *that* and use it.
It beats a poster, because it is the thing itself. The poster is for work whose
result is invisible, which is most work.

**And skip it when there is nothing to show.** A one-line config fix or a
docs tweak does not need a page; attach the PR and move on. The rule is rule 8:
close nothing real with nothing attached — not "make a page every time."

## The publish ritual, end to end

```bash
# 1. What did this burst touch?
... -d '{ "resourceId": "items", "method": "listItems", "params": { "status": "open" } }'

# 2. Is there already a card from this burst?
... -d '{ "resourceId": "items", "method": "getCurrentUpdateCard", "params": {} }'
# → { card: { headline: "…", lines: [{ slot: "shipped", text: "Started on auth retry.", itemKey: "042-…" }], … }, inBurst: true }

# 3. Publish ONE standup covering the whole burst (fold the old lines in).
#    One line per OUTCOME. The "how" is already on the item's closeout — not here.
#    Lead with a picture: heroPageUrl on the line that matters most.
... -d '{ "resourceId": "items", "method": "publishUpdate", "params": {
      "headline": "Meetings are a real feature now",
      "shipped": [
        { "text": "Sign-in recovers on its own on spotty networks — no more dropped sessions.", "itemKey": "042-add-retry-logic-to-auth-refresh", "heroPageUrl": "https://anthony.withmirra.com/auth-retry" }
      ],
      "next": [
        { "text": "Rebuilding the flaky websocket reconnect.", "itemKey": "043-rebuild-the-flaky-websocket-reconnect" }
      ],
      "needsYou": [
        { "text": "The nightly export ran twice today — want me to fix the schedule?" }
      ],
      "recipientBodies": [{ "username": "anthony", "body": "Auth retry is live — the mobile OTA can drop the workaround." }]
    } }'
# → { card: {...}, revised: true, priorDefaultBody: "…" }
```

> One line per **outcome**, not per change. Four changes to one screen are one
> line. If you need a second sentence to explain how it was done, that sentence
> belongs in the item's closeout, not on the card.

If `revised` came back true, sanity-check that your new lines still cover
everything the prior card said — if not, publish once more with the merged
standup (still the same card). If the server rejects a slot for being over the
cap or too long, that's the signal to fold changes into one outcome and move the
detail to the closeout — not to spread it across more lines.

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
- `noteItem` is rejected on `done` items — revising a closeout is a repo-side edit, not a new note.
- Slot caps (`shipped` ≤3, `next` ≤2, `needsYou` ≤2; each line ≤140 chars, no inner newline) are enforced — over-cap rejects with a message pointing you at the closeout. Fold changes into outcomes; don't spread them across lines.
- `itemKeys` on a card (and any `itemKey` on a line) must exist in the space; unknown keys error immediately.
- `heroPageUrl` must resolve to a real Mirra page AND be attached — to that line's item, or to the card's own `artifacts`. Not attached, not a hero; the error tells you which half failed. Artifacts accumulate across a burst, so a hero attached on revision 1 is still valid on revision 12.
- `heroPageId` comes back on the line and is the server's receipt that the hero landed — if it is missing, the picture is not there.
- `recipientBodies` recipients must be active space members.
- Publishing inside the burst window ALWAYS revises your current card — stacking is not possible; the guard exists so you fold the standup, not to gate the write.
