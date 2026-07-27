---
name: mirra-ledger
description: "The team work-ledger ritual for agents on a Mirra space: track agreed work, propose discoveries (then ask in chat), share drafts for comment while the work is still open, close what ships with a page a teammate can actually open, and publish ONE narrated update card per work burst — led by a picture, revised, never stacked. Rides the Mirra items adapter / MCP work-ledger tools."
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

One line each. The sections below carry the detail.

1. **Decide, then do.** Work enters the ledger only after the team agreed to it
   — on a call (the call pipeline extracts items automatically) or in chat.
   Never invent scope.
2. **Discoveries are proposals.** `proposeItem`, then ask the team in the space
   chat. Don't sit on it, don't start it. → *The proposal flow*
3. **Approvals travel through humans.** Nothing watches chat for you. When the
   team says yes, the item's owner tells *their own* agent, and that agent
   flips it with `openItem`, citing where the decision happened.
4. **Share drafts while they are still drafts.** A prototype, a mockup, two
   options to choose between: publish it as a page and attach it with
   `noteItem` while the item is open. → *Share a draft for comment*
5. **Note real news on long-running work.** Same op, different job — a deal
   moving stages, a multi-week build hitting a milestone. No status change.
6. **Close what ships, with receipts AND a closeout.** `closeItem` with
   artifacts and the short "how it actually landed" paragraph. →
   *Close with a closeout*
7. **Attach only what a person can open — and make one when there isn't one.**
   Most work has no viewable surface, so publish a page and attach that. Never
   close real work with nothing attached. → *Three jobs a page does*
8. **Name things for humans.** Titles render on teammates' phones: "The fix, on
   GitHub", never `fix(auth): …`, a commit hash, a raw URL, or a timestamp. The
   `itemKey` slug is machine identity and is never shown to people.
9. **Publish the burst, revise the card.** `getCurrentUpdateCard` → rewrite ONE
   standup covering the whole burst (old + new) → `publishUpdate`. Twenty
   sessions in an afternoon should read as one card that kept getting better.
10. **The card is a standup, not release notes.** One OUTCOME per line. If you
    need a second sentence to explain HOW, it belongs in the closeout. →
    *The publish ritual*
11. **Lead with a picture.** A card with a picture gets looked at; a card
    without one gets scrolled past, however well it is written. →
    *Three jobs a page does*

## Three jobs a page does

A page turns up in three different moments. They run together easily, because
two of them produce the same thing — a URL you attach — and the third one
*reuses* a URL you already attached.

| Job | When | The page is | How |
|---|---|---|---|
| **Draft** | the moment the thing exists | the thing itself — the prototype, the mockup, the two options | `noteItem` + `artifacts`; the item stays open |
| **Receipt** | the work landed | evidence that invisible work happened — usually a poster | `closeItem` + `artifacts` |
| **Picture** | you publish the card | whichever attached page should be the card's face | `heroPageUrl` on a line |

The third is a **role, not a kind of page**. Any page already attached can play
it: a draft on a `needsYou` line makes the ask arrive as the prototype; a
receipt on a `shipped` line makes it arrive as the poster. The first line that
names one wins the face, so order your lines by what matters most. The page has
to be one you already published and attached — to that line's item, or to the
card's own `artifacts` — because a picture of work is evidence, not decoration.
The server checks.

And skip the page entirely when there is nothing to show. A one-line config fix
or a docs tweak just needs its PR. The rule is rule 7 — close nothing real with
nothing attached — not "make a page every time".

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
Mirra-hosted flows (omit the headers there). Writes without a group scope are
rejected as personal-scope, and the server verifies your human is an active
member of the target space.

**claude.ai / Claude via the Mirra MCP connector** — the same ops, named the
way a person would say them:

| SDK op | MCP tool |
|---|---|
| `createItem` / `proposeItem` | `track_work_item` (set `needs_approval` for a proposal) |
| `openItem` / `noteItem` / `closeItem` | `update_work_item` (`action: "approve"` / `"note"` / `"complete"`) |
| `listItems` | `list_work_items` |
| `publishUpdate` | `publish_status_update` |

Three arguments are renamed there and nothing else changes: `artifacts` →
`links`, `heroPageUrl` → `picture_page_url`, `needsYou` → `needs_from_team`.

## Operations (resourceId `items`)

| Op | When | Key args |
|---|---|---|
| `createItem` | Team-agreed work → `open`, owned by you | `title`, `source?` (where decided), `artifacts?` |
| `proposeItem` | Out-of-scope discovery → `proposed` | `title`, `source?` (what you were doing), `artifacts?` |
| `openItem` | Approval relayed to you: `proposed → open` | `itemKey`, `source?` (where approved) |
| `noteItem` | Progress or a draft on open/proposed work; no status change. **The only op that attaches without closing** | `itemKey`, `note`, `artifacts?` |
| `closeItem` | Work shipped: `open → done` | `itemKey`, `closeout?` (how it landed — write it!), `artifacts?` |
| `listItems` | Read the ledger; find itemKeys | `status?` |
| `getCurrentUpdateCard` | ALWAYS before publishing | — |
| `publishUpdate` | The burst standup | `headline?`, `shipped?`/`next?`/`needsYou?` (`[{ text, itemKey?, heroPageUrl? }]`), `recipientBodies?` (`[{ username \| userId, body }]`), `artifacts?` |

Slot caps: `shipped` ≤3, `next` ≤2, `needsYou` ≤2; each line ≤140 chars, one
outcome, no line break inside it. (`defaultBody` is a deprecated legacy prose
body — prefer slots.)

Artifacts everywhere are `[{ kind: "pr"|"page"|"deploy"|"doc"|"image"|"url", url, title? }]`.
Every one must be something a teammate can open in a browser and *see*: a page,
a mockup, an image, a PR or commit, a deploy, a doc. Never an API route, a code
file path, a localhost URL, or anything that renders raw JSON. Titles follow
rule 8. Artifacts accumulate across ops, so a draft attached with `noteItem` is
still attached when you close the item.

## Close with a closeout

The detail that used to bloat the card goes here, on the item — rendered in its
detail view and exported to the repo:

```bash
... -d '{ "resourceId": "items", "method": "closeItem", "params": {
      "itemKey": "042-add-retry-logic-to-auth-refresh",
      "closeout": "Auth refresh now retries with backoff and recovers the session silently on spotty networks. The mobile OTA can drop its client-side workaround. Caveat: retries cap at 3, then fall back to the sign-in screen as before.",
      "artifacts": [{ "kind": "pr", "url": "https://github.com/acme/app/pull/118", "title": "The fix, on GitHub" }]
    } }'
```

## Share a draft for comment

Teammates can pin comments directly onto a Mirra page — click an element, leave
a note — so a prototype shared as a page comes back as specific feedback on
specific parts, instead of "looks good". That makes a page the fastest way to
get a reaction, not just a way to prove something landed.

So publish one **the moment the thing exists**, not at the end. A mockup, a
prototype, a draft plan, two options you want decided between: that is exactly
what people can react to, and feedback collected after shipping is not feedback.

```bash
# 1. Publish the thing itself — the prototype, not a poster about it. Send the
#    same group scope headers you use for the ledger: comments mirror into THAT
#    space's workspace, and a personally-scoped page mirrors somewhere your
#    teammates' agents are not looking.
... -d '{ "resourceId": "pages", "method": "createPage", "params": {
      "path": "/checkout-v2", "title": "Checkout, second pass", "code": "<the JSX>" } }'

# 2. Attach it to the OPEN item with a note. noteItem is the only op that
#    attaches anything without closing the work.
... -d '{ "resourceId": "items", "method": "noteItem", "params": {
      "itemKey": "051-rebuild-the-checkout-flow",
      "note": "Second pass at checkout is up — the address step is now one screen. Comments welcome on the page, especially the payment step.",
      "artifacts": [{ "kind": "page", "url": "https://anthony.withmirra.com/checkout-v2", "title": "Checkout, second pass" }]
    } }'

# 3. Say it wants eyes, in the space chat (mirra-messaging), and say what you
#    need decided. A page nobody knows about collects no comments.
```

**Reading the comments back.** There is no items or pages op for them yet. Each
comment is mirrored into the space's workspace — one file per comment, plus a
rolled-up index of the open ones for that page:

```
/workspace/feedback/<page-slug>/OPEN.md
```

Read it with `mirra-workspace`, and answer in chat or in your next note as you
handle each one. (`mirra-feedback` is a different thing — the bug and
feature-request tracker — and has nothing to do with page comments.)

The item stays open through all of this. When the work does land, close it with
a closeout as usual; the draft you published is already attached, and you can
add the receipt alongside it.

## Make the receipt (the poster)

**Do this while you are closing the item, not while you are publishing the
card.** By publish time the burst is over and there is nothing to make a page
out of but the sentence you just wrote. The page belongs to the *outcome*, so it
is authored once, at `closeItem`, and it keeps working: a `heroPageUrl` points
at a live page, so editing the page updates every card that shows it.

Two minutes, three calls:

```bash
# 1. Publish the poster. Start from poster.jsx in this skill's directory —
#    change the four strings at the top, leave the frame alone.
#    purpose:"poster" is REQUIRED and is not decoration: it is the only way
#    anything downstream can tell a picture from a page. Without it the poster
#    joins the artifacts library, where it reads as a document that turns out
#    to be a billboard when someone opens it.
... -d '{ "resourceId": "pages", "method": "createPage", "params": {
      "path": "/store-removal",
      "title": "The store is gone",
      "purpose": "poster",
      "code": "<the JSX, with your four strings>"
    } }'
# → { id: "665…", url: "https://anthony.withmirra.com/store-removal", … }

# 2. Attach it to the item as the receipt (rule 7).
... -d '{ "resourceId": "items", "method": "closeItem", "params": {
      "itemKey": "046-remove-the-store-and-marketplace",
      "closeout": "The store, the marketplace and every screen that reached them are gone — 179,644 lines and one migration. Nothing else regressed. Watch: `users.developer` is NOT the API-key flag, so key issuance is unaffected.",
      "artifacts": [
        { "kind": "page", "url": "https://anthony.withmirra.com/store-removal", "title": "What came out" },
        { "kind": "pr",   "url": "https://github.com/acme/app/pull/121", "title": "The removal, on GitHub" }
      ]
    } }'

# 3. Name it as a line's heroPageUrl when you publish the card.
```

**Design it for the frame, because the frame is brutal.** The page is
screenshotted at 900×540 and shown at roughly a third of that on a phone, where
body text at 14px lands as five pixels of grey. So: one statement set very
large, one short caption, nothing else. `poster.jsx` in this skill's directory
is that layout with the sizes and the character limits already set — a template
to fill in, not an example to admire. Its numbers are measured; don't re-derive
them and don't add body copy.

**What makes a good one.** Say the outcome the way you would say it out loud,
not the way a changelog would: *"The store is gone"*, not *"Removed store and
marketplace modules"*. If there is a number that lands — lines removed, hours
saved, a rate that moved — that number is the statement and the words are the
caption. If there isn't, the outcome itself is the statement. Never a list.

**A picture is not always a poster.** If the work already produced something
worth looking at — a real dashboard, a report with the actual numbers in it, a
comparison of two options for a `needsYou` ask — publish *that* and use it. It
beats a poster, because it is the thing itself. The poster is for work whose
result is invisible, which is most work.

That distinction is exactly what `purpose: "poster"` records, so set it on
posters and **only** on posters. A real dashboard used as a card's picture is
still a page someone will want to open again later; marking it a poster would
hide it from the library. The test is not "did this lead a card" — it is
"would anyone open this on its own?" If no, it is a poster.

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

Say the outcome and what it unlocks — never root causes, file names, or
implementation detail. Four changes to one screen are one line. An optional
one-line `headline` leads the card; an `itemKey` on a line makes it deep-link to
the item; `recipientBodies` gives one teammate a tailored version (only they see
it, as prose instead of slots).

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

(Within a single run you may long-poll chat for a quick reply — the
mirra-cowork pattern — but there is no standing listener.)

## Rules the server enforces (don't fight them)

- Owner and actor are stamped from your credential — args can't override them.
- Ledger writes need an active group membership; group scope is pinned server-side.
- `openItem` only from `proposed`; `closeItem` only from `open` — anything else errors with the item's actual status.
- `noteItem` is rejected on `done` items — revising a closeout is a repo-side edit, not a new note.
- Slot caps (`shipped` ≤3, `next` ≤2, `needsYou` ≤2; each line ≤140 chars, no inner newline) are enforced — over-cap rejects with a message pointing you at the closeout. Fold changes into outcomes; don't spread them across lines.
- `itemKeys` on a card (and any `itemKey` on a line) must exist in the space; unknown keys error immediately.
- `heroPageUrl` must resolve to a real Mirra page AND be attached — to that line's item, or to the card's own `artifacts`. Not attached, not a picture; the error tells you which half failed. Any slot can carry one, and artifacts accumulate across a burst, so a page attached on revision 1 is still valid on revision 12.
- `heroPageId` comes back on the line and is the server's receipt that the picture landed — if it is missing, the picture is not there.
- `recipientBodies` recipients must be active space members.
- Publishing inside the burst window ALWAYS revises your current card — stacking is not possible; the guard exists so you fold the standup, not to gate the write.
