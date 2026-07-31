---
name: ledger
description: "The team work-ledger ritual for agents on a Mirra space: track agreed work, propose discoveries (then ask in chat), share drafts for comment while the work is still open, close what ships with a closeout and what exists, and publish an update card ONLY when a burst produces news — led by a picture, revised, never stacked; a routine burst publishes nothing. Rides the Mirra items adapter / MCP work-ledger tools."
allowed-tools: Read, Write, Bash(curl:*, jq:*)
---

# Mirra Ledger

Your team shares one **work ledger** per Mirra space: items with status
(`open` / `proposed` / `done`), an owner, and artifact links. Everyone's home
feed renders it. Humans never edit the ledger in the app — **agents write it**,
one per teammate, through canonical ops. Your writes are attributed to your
human via your credential; you cannot write as anyone else.

The companion surface is the **update card**: when a burst of work produces
news, you publish a short narrative FOR your teammates' feeds. One card per
burst — revised in place as the burst continues, never stacked — and none at
all when the burst was routine. → *What makes a card*

## The contract

One line each. The sections below carry the detail.

1. **Decide, then do.** Work enters the ledger only after the team agreed to it
   — on a call (the call pipeline extracts items automatically) or in chat.
   Never invent scope.
2. **Discoveries are proposals.** `proposeItem`, then ask the team in the space
   chat. Don't sit on it, don't start it. → *The proposal flow*
3. **Approvals travel through humans.** Nothing watches chat for you. When the
   team says yes, the item's owner tells *their own* agent, and that agent
   flips it with `openItem`, citing where the decision happened. A human can
   also decide it directly in the app now, in which case it is already `open`
   (or `done`, if they declined) before you next look. → *Pick up decisions*
4. **Share drafts while they are still drafts.** A prototype, a mockup, two
   options to choose between: publish it as a page and attach it with
   `noteItem` while the item is open. → *Share a draft for comment*
5. **Note real news on long-running work.** Same op, different job — a deal
   moving stages, a multi-week build hitting a milestone. No status change.
6. **Close what ships, with a closeout and what exists.** `closeItem` with
   the short "how it actually landed" paragraph plus the artifacts the work
   actually produced — the PR, the doc, the dashboard itself. →
   *Close with a closeout*
7. **Attach only what a person can open — and manufacture a page only for
   news.** A page's one job is to be looked at, so build one only when the
   close is going on a card, or when you are sharing a draft for comment.
   A routine close needs no page. → *Three jobs a page does*
8. **Name things for humans.** Titles render on teammates' phones: "The fix, on
   GitHub", never `fix(auth): …`, a commit hash, a raw URL, or a timestamp. The
   `itemKey` slug is machine identity and is never shown to people.
9. **Publish news, not bursts.** A card exists only when the burst produced
   something you would say to the team out loud, unprompted. When it did:
   `getCurrentUpdateCard` → rewrite ONE standup covering the whole burst
   (old + new) → `publishUpdate`, revised in place, never stacked. When it
   didn't: your ledger writes are the finish — publish nothing. →
   *What makes a card*
10. **The card is a standup, not release notes.** One OUTCOME per line, and
    every line must be news on its own — the slot caps are ceilings, not
    quotas. If you need a second sentence to explain HOW, it belongs in the
    closeout. → *The publish ritual*
11. **Lead with a picture.** A card with a picture gets looked at; a card
    without one gets scrolled past, however well it is written. →
    *Three jobs a page does*
12. **Start by picking up what got decided.** Items you own — and questions you
    asked, even on items you don't own — may have been decided or answered while
    you were gone. Read the rollup at the top of `.mirra/items/INDEX.md`, or
    `getItem` a specific one. → *Pick up decisions*
13. **Ask on the record when you are blocked.** `requestDecision` puts ONE
    question (≤140 chars) on the open item, where the team sees it in their
    waiting lane. Then go and do something else: there is nothing to wait on and
    nothing to poll, and the answer arrives in a later session. →
    *Ask a question mid-work*

## What makes a card

The card is the team's attention channel, and attention is spent by volume: a
feed of routine cards teaches teammates that cards are skippable, and then they
skip the one that mattered. The ledger already records everything — closeouts,
notes, artifacts, the repo mirror — so the card adds nothing by repeating it.
The card exists to say the few things a teammate should not have to go looking
for.

**The bar: would you say it to the team out loud, unprompted, if you were all
in one room?** If you would only say it when someone asked "what did you do
today?", it is a closeout, not a card.

What clears the bar:

- Something finished that a teammate should now look at, use, or respond to —
  a project ready for review, materials prepped for a client.
- The world changed the team's state — a part arrived and work is unblocked, a
  client scheduled, a deal moved stages.
- A milestone you would genuinely announce.

What does not: optimizations, refactors, fixes, polish (closeout only);
progress that changes nobody's plans (`noteItem`); operational routine — a
call happened, a deploy ran — which is recorded elsewhere already. A quiet day
on the feed is the system working, not a gap: "what did they do yesterday?" is
a question the ledger answers.

Once a card exists, every line still has to clear the bar on its own. Routine
closes do not ride along as filler — a news line drowns in its own card. And
`next` earns its line only when what you are doing next *changed* in a way
that affects someone; "still working on X" is pulse, and the ledger is the
pulse.

> **This overturns the previous trigger, in writing.** An earlier version of
> this skill fired the card on cadence — "a working burst ends → publish ONE
> standup card" — and warned that teammates seeing stale or empty feeds costs
> trust in the whole system. Overturned 2026-07-31: that rule filled the feed
> with routine and trained teammates to skip cards, which is the more
> expensive way to lose trust. The burst machinery (one card, revised in
> place, never stacked) is unchanged — it governs how a card behaves when
> news happens, not whether one is owed. Do not reintroduce the per-burst
> trigger or the empty-feed warning without overturning this paragraph.

## Three jobs a page does

A page turns up in three different moments. They run together easily, because
two of them produce the same thing — a URL you attach — and the third one
*reuses* a URL you already attached.

| Job | When | The page is | How |
|---|---|---|---|
| **Draft** | the moment the thing exists | the thing itself — the prototype, the mockup, the two options | `noteItem` + `artifacts`; the item stays open |
| **Receipt** | the work landed AND it is news | evidence that invisible work happened — usually a poster | `closeItem` + `artifacts` |
| **Picture** | you publish the card | whichever attached page should be the card's face | `heroPageUrl` on a line |

The third is a **role, not a kind of page**. Any page already attached can play
it: a draft on a `needsYou` line makes the ask arrive as the prototype; a
receipt on a `shipped` line makes it arrive as the poster. The first line that
names one wins the face, so order your lines by what matters most. The page has
to be one you already published and attached — to that line's item, or to the
card's own `artifacts` — because a picture of work is evidence, not decoration.
The server checks.

And most closes need no page at all. **Attach what exists; manufacture
nothing**: a routine close carries its closeout and whatever the work already
produced — the PR, the doc, the dashboard itself. You build a page only when
the close is news (it is going on a card, and the page is its face) or when
you are sharing a draft for comment. Making work *easy to view* is only worth
doing for work that *ought to be viewed* — for everything else the closeout is
the record, and that is rule 7 now, not "make a page every time". (The old
form of rule 7 — "never close real work with nothing attached" — is overturned
with the cadence trigger; see *What makes a card*.)

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
| `getItem` | ONE item in full — notes, the decision, the open question, and the discussion thread | `itemKey` |
| `requestDecision` | You are blocked on a human call mid-work (open items only) | `itemKey`, `question` (≤140 chars) |
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

**Reading the comments back.** Use the pages ops — `listFeedback` for what is
outstanding, `resolveFeedback` once you have actually made a change:

```bash
curl -s -X POST "${API_URL:-https://api.fxn.world}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -H "X-Scope: group" -H "X-Group-Id: ${MIRRA_GROUP_ID}" \
  -d '{ "resourceId": "pages", "method": "listFeedback", "params": { "path": "/checkout-v2" } }'
```

Each comment tells you what the person wrote and which element they clicked, so
answer the specific thing. Resolve them as you go and say what you changed, in
chat or in your next note. (`mirra:feedback` is a different thing — the bug and
feature-request tracker — and has nothing to do with page comments.)

The item stays open through all of this. When the work does land, close it with
a closeout as usual; the draft you published is already attached, and you can
add the receipt alongside it.

## Make the receipt (the poster)

**Only for a close that is news** — a close going on a card. A routine close
takes no poster; its closeout is the record. When the close does clear the bar:

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
# 0. The bar, before anything: did this burst produce news — something you
#    would say to the team out loud, unprompted? If not, STOP. Your ledger
#    writes are the finish, and publishing nothing is the correct finish.
#    → What makes a card

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
mirra:cowork pattern — but there is no standing listener.)

A proposal can also be settled by a human tapping Approve or "Not doing it" in
the app, without anyone relaying it to you. That is why rule 12 exists: the item
may already be `open` — or `done` with `resolution: "declined"` — by the time you
next look at it. `done` on its own does not mean shipped; check `resolution`.

## Pick up decisions

Start here when you return to a space. Two reads, cheapest first:

```bash
# 1. The rollup — one file, every item, no fan-out. In a linked repo:
#    .mirra/items/INDEX.md → "## Waiting on a decision" and "## Recently decided"
#    (also mirrored at /workspace/items/INDEX.md)

# 2. The full record for one item — notes, the decision, any open question, and
#    the discussion thread in one call.
... -d '{ "resourceId": "items", "method": "getItem", "params": {
      "itemKey": "043-rebuild-the-flaky-websocket-reconnect" } }'
# → { status: "done", resolution: "declined", decidedBy: { name: "Merle" },
#     decidedAt: "…", notes: [ … the reason they gave … ], discussion: [ … ] }
```

What to look for, and what it means:

- `resolution: "approved"` → the item is `open`. It is yours to do now.
- `resolution: "declined"` → the item is `done` and the work is NOT wanted. Do
  not start it, and do not reopen it to "check" — the decider's reason is in
  `notes`. Read it before proposing anything adjacent.
- `needsDecision` absent on an item where you left a question → somebody
  answered. The answer is a comment in the discussion thread.
- `resolution` absent on a `done` item → it shipped the ordinary way.

Scope is "items you own **or** questions you asked" — a question you left on
someone else's item still comes back to you.

## Ask a question mid-work

For the call only a human can make, on work already agreed and in flight. Not
for scope (that is a proposal) and not for anything you could decide yourself.

```bash
... -d '{ "resourceId": "items", "method": "requestDecision", "params": {
      "itemKey": "042-add-retry-logic-to-auth-refresh",
      "question": "Cap retries at 3 and fall back to sign-in, or keep trying with longer backoff?" } }'
```

The question joins the team's waiting lane as a row on the item. Then:

- **Move on.** This is fire-and-forget by design. There is no op that waits for
  the answer, no poll interval, and no doorbell — asking and then spinning is the
  one wrong way to use it. Do other work, or end the session cleanly.
- **One question per item.** A second `requestDecision` REPLACES the first, so
  don't use it as a scratchpad. Ask the one thing that is actually blocking.
- **≤140 chars**, because it renders as one row on a teammate's phone. Background
  goes in a `noteItem`; the question is the question.
- **It pages nobody.** No push, no named recipient — it addresses the item, not a
  person. If something genuinely needs one human's attention now, that is your
  human's job in chat, not yours.
- If you are blocked so hard you cannot continue, say so in the space chat as
  well (`mirra-messaging`) — the question is the durable record, chat is how a
  person finds out today.

## Rules the server enforces (don't fight them)

- Owner and actor are stamped from your credential — args can't override them.
- Ledger writes need an active group membership; group scope is pinned server-side.
- `openItem` only from `proposed`; `closeItem` only from `open` — anything else errors with the item's actual status.
- `requestDecision` only on `open` items — a `proposed` item is already waiting on a decision, and a `done` one is finished.
- Any status change CLEARS the decision and any open question. So an item declined, reopened by a git push, then genuinely shipped never still reads "declined" — and never claim a resolution you read before a transition you also saw.
- You cannot decide on the team's behalf. There is no agent op that stamps a `resolution`; only a human in the app can, and a git push that flips `status:` stamps none (there is no decider to name). Frontmatter decision fields in `.mirra/items/*.md` are a read-only mirror — editing them is inert.
- `noteItem` is rejected on `done` items — revising a closeout is a repo-side edit, not a new note.
- Slot caps (`shipped` ≤3, `next` ≤2, `needsYou` ≤2; each line ≤140 chars, no inner newline) are enforced — over-cap rejects with a message pointing you at the closeout. Fold changes into outcomes; don't spread them across lines.
- `itemKeys` on a card (and any `itemKey` on a line) must exist in the space; unknown keys error immediately.
- `heroPageUrl` must resolve to a real Mirra page AND be attached — to that line's item, or to the card's own `artifacts`. Not attached, not a picture; the error tells you which half failed. Any slot can carry one, and artifacts accumulate across a burst, so a page attached on revision 1 is still valid on revision 12.
- `heroPageId` comes back on the line and is the server's receipt that the picture landed — if it is missing, the picture is not there.
- `recipientBodies` recipients must be active space members.
- Publishing inside the burst window ALWAYS revises your current card — stacking is not possible; the guard exists so you fold the standup, not to gate the write.
