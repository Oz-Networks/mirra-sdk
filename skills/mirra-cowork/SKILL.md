---
name: mirra-cowork
description: "Cowork with another person's Claude Code over a shared Mirra group chat. Post questions, poll for replies on a cadence you set, and hand off follow-ups. Rides the Mirra Messaging adapter — no extra integration to install."
allowed-tools: Read, Write, Bash(curl:*, jq:*)
---

# Mirra Cowork

Two (or more) people, each running their own Claude Code on their own machine and repo,
sharing **one Mirra group chat as a back-channel**. Each person's Claude posts into the
chat and polls it on a cadence the human chooses. The humans are the *co-betweens*: they
set the cadence, watch the exchange in the Mirra app, and decide what their Claude follows
up on.

This is not a new integration — it's a usage pattern over the existing **Mirra Messaging**
adapter. The channel is a normal Mirra group chat, so both people see everything natively
in Messenger and can jump in at any time.

**Use it when** you're collaborating with someone who also codes with Claude Code — a
different repo, a different company, a shared problem — and you keep manually relaying
questions and answers between your two agents. Cowork turns that relay into a loop.

```
  Your machine                    Mirra                    Their machine
  ┌───────────┐   sendMessage   ┌─────────────┐  poll     ┌───────────┐
  │ Claude    │ ──────────────▶ │ group chat  │ ◀──────── │ Claude    │
  │ Code (you)│ ◀────────────── │ (the channel)│ ─────────▶│ Code (them)│
  └───────────┘   getRecent...  └─────────────┘  reply    └───────────┘
        ▲            both humans watch / inject in the app        ▲
        └──── you set the cadence and the follow-up signal ───────┘
```

## Prerequisites

- Your **Mirra API key** (each person uses their own). Generate in the Mirra app → Settings → API Keys.
- `API_URL`: defaults to `https://api.fxn.world` (only change for a custom server).
- A shared Mirra **group** that both people belong to — this is the cowork channel. Set it up once (below).

## Call pattern

Every operation is one POST. Same shape as `/mirra-mirra-messaging` — see that skill for
the full argument reference of any messaging operation.

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ "resourceId": "mirra-messaging", "method": "<operation>", "params": { ...args } }' | jq .
```

## One-time: pick the channel

Find or create the shared group and record its `groupId` — you pass it on every call.

```bash
# Find an existing shared conversation and copy its groupId
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "x-api-key: ${API_KEY}" -H "Content-Type: application/json" \
  -d '{ "resourceId": "mirra-messaging", "method": "getGroups", "params": {} }' \
  | jq '.messages? // .groups? // .'
```

If there isn't one yet, create it and add the other person (or just invite them in the app).
For the exact arguments of `createGroup` / `addMembers`, see `/mirra-mirra-messaging`.

Save the `groupId` somewhere the loop can read it — the loop prompt, or the cursor file below.

## The three moves

The whole pattern is three messaging calls. Only these two need precise arguments; both are verified:

**1. Post a question** — `sendMessage`

```bash
-d '{ "resourceId": "mirra-messaging", "method": "sendMessage",
      "params": {
        "groupId": "<CHANNEL_ID>",
        "content": "Does your webhook flow fire on orders/create yet? Mine is green after the fix.",
        "automation": { "source": "claude-code", "isAutomated": true }
      } }'
```

`automation` is optional but recommended — it tags the message as agent-sent so you (and the
other side) can tell CC posts from human chatter. Use `replyToMessageId` to thread an answer
under a specific question.

**2. Poll for new messages** — `getRecentMessages`

```bash
-d '{ "resourceId": "mirra-messaging", "method": "getRecentMessages",
      "params": { "groupId": "<CHANNEL_ID>", "startDate": "<CURSOR_ISO>", "limit": 50 } }'
```

Returns `{ messages: [...] }` newest-first, each flat: `messageId`, `senderUsername`,
`text`, `timestamp`, `isFromMe`. `startDate` is your cursor — pass the newest `timestamp`
you've already handled so you only get what's new. `isFromMe` lets you ignore your own posts.

**3. Reply** — `sendMessage` again, with `replyToMessageId: <the message's messageId>` to thread it.

## The follow-up signal (you define it)

Cowork deliberately does **not** treat every new message as a task — the humans are in the
channel too, chatting. When you start the loop, tell Claude **what counts as a follow-up**.
It's a plain-language trigger, whatever suits you:

- *"Only act on a message that contains the phrase `I'll follow up on that.`"* — either
  human types that to hand the previous question to their Claude.
- *"Only act on messages that @mention me, or that end in a question mark."*
- *"Summarize anything new every poll, but only draft a reply when a message starts with `cc:`."*

The point is that a human keeps a hand on the wheel; Claude acts only on the agreed signal.
Nothing is filtered structurally, so you can change the convention any time just by telling Claude.

## Run the loop (cadence is yours)

Use the built-in **`/loop`** skill (or just ask Claude to repeat every N minutes). Give it
three things: the channel `groupId`, the follow-up signal, and the cadence. Example kickoff:

> Use `/mirra-cowork`. Channel groupId is `abc123`. Every **3 minutes**, poll for new
> messages. For any new message from the other person containing **"I'll follow up on that"**,
> treat the question it refers to as a task: do the work in this repo, then post a concise
> reply threaded under it. Keep a cursor file so you never reprocess a message, and tell me
> each time you post. Stop when I say **"stop cowork"** or after 20 idle polls.

**Persist a cursor** so restarts and re-polls don't double-process. A small JSON file
(e.g. `.mirra-cowork.json` in the repo, git-ignored) is plenty:

```json
{ "groupId": "abc123", "cursor": "2026-07-08T21:14:10.103Z", "seen": ["<messageId>", "..."] }
```

Read it at the top of each loop; after handling a poll, set `cursor` to the newest
`timestamp` you processed and append handled `messageId`s to `seen` (dedupe the boundary
message, since `startDate` can re-include it).

## Notes

- **Everyone sees it.** The channel is a real Mirra chat — both humans watch in the app and
  can inject context or corrections mid-loop. That's a feature, not a leak.
- **Keep replies tight.** This is agent-to-agent; context is expensive on both ends. Post
  conclusions, not transcripts. For code, share a snippet, a gist, or a branch/commit ref
  rather than dumping large files into chat.
- **Always give the loop an off-switch** — a stop phrase, an idle-poll cap, or a max
  duration — so it winds down on its own.
- **Cadence.** A few minutes is almost always right. Polling every few seconds just burns
  API calls and your context window; the other person's Claude isn't answering that fast anyway.
- For anything beyond post/poll/reply (searching history, group admin, editing a message),
  reach for `/mirra-mirra-messaging` — cowork is just an orchestration layer over it.
