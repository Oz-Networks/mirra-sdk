# Mirra for Claude Code

A [Claude Code plugin](https://code.claude.com/docs/en/plugins): the team work-ledger,
pages your teammates can comment on, and every Mirra integration as a skill.

## Install

1. Get your API key from the Mirra app (Settings > API Keys)
2. Add the marketplace and install the plugin:

```bash
claude plugin marketplace add Oz-Networks/mirra-sdk
claude plugin install mirra@mirra
```

3. Type `/mirra:` in Claude Code to see every skill
4. Ask Claude Code to do something with that integration:

```
"Send an email via Mirra to alice@example.com about the meeting tomorrow"
"Search my Telegram chats for messages about the project"
"Create a memory in Mirra with my meeting notes"
```

**Updates land on their own.** Claude Code refreshes the marketplace in the
background at session start, and the plugin declares no pinned `version`, so
every published commit is picked up without you re-running anything.

> **Uninstall:** `claude plugin uninstall mirra@mirra`

## Skill names

Skills are namespaced by the plugin, so the `mirra-` prefix is gone from the
names themselves: `mirra-ledger` is now `/mirra:ledger`, `mirra-google-gmail` is
`/mirra:google-gmail`. The bare `/ledger` also works when nothing else has
claimed that name.

> Upgrading from the old `curl … install.sh` skills? Remove them first —
> `curl -fsSL https://raw.githubusercontent.com/Oz-Networks/mirra-sdk/main/skills/install.sh | bash -s -- --uninstall`
> — or you will have both copies loaded, with the stale one shadowing the fresh one.

## Available Skills

### Core (always available)

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`/mirra:ai`](./skills/ai/) | AI Services | 5 | No |
| [`/mirra:contacts`](./skills/contacts/) | Contacts | 9 | No |
| [`/mirra:dashboards`](./skills/dashboards/) | Dashboards | 8 | No |
| [`/mirra:data`](./skills/data/) | Data | 14 | No |
| [`/mirra:desktop`](./skills/desktop/) | Desktop | 10 | No |
| [`/mirra:feed-items`](./skills/feed-items/) | Feed Items | 2 | No |
| [`/mirra:feedback`](./skills/feedback/) | Feedback | 5 | No |
| [`/mirra:flows`](./skills/flows/) | Flows | 21 | No |
| [`/mirra:memory`](./skills/memory/) | Memory | 10 | No |
| [`/mirra:observability`](./skills/observability/) | Observability | 2 | No |
| [`/mirra:pages`](./skills/pages/) | Pages | 15 | No |
| [`/mirra:skills`](./skills/skills/) | Skills | 8 | No |
| [`/mirra:channels`](./skills/channels/) | Space Channels | 6 | No |
| [`/mirra:user`](./skills/user/) | User | 6 | No |
| [`/mirra:video-generator`](./skills/video-generator/) | Video Generator | 5 | No |
| [`/mirra:voice`](./skills/voice/) | Voice | 12 | No |
| [`/mirra:items`](./skills/items/) | Work Items | 8 | No |
| [`/mirra:workspace`](./skills/workspace/) | Workspace | 1 | No |

### Communication

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`/mirra:google-gmail`](./skills/google-gmail/) | Gmail | 10 | Yes (OAuth) |
| [`/mirra:messaging`](./skills/messaging/) | Mirra Messaging | 13 | No |
| [`/mirra:telegram-bot`](./skills/telegram-bot/) | Telegram Bot | 14 | Yes (OAuth) |

### Productivity

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`/mirra:github`](./skills/github/) | GitHub | 10 | No |
| [`/mirra:google-calendar`](./skills/google-calendar/) | Google Calendar | 7 | Yes (OAuth) |
| [`/mirra:google-docs`](./skills/google-docs/) | Google Docs | 13 | Yes (OAuth) |
| [`/mirra:google-sheets`](./skills/google-sheets/) | Google Sheets | 17 | Yes (OAuth) |
| [`/mirra:scripts`](./skills/scripts/) | Scripts | 16 | No |
| [`/mirra:trello`](./skills/trello/) | Trello | 15 | Yes (OAuth) |

### Storage

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`/mirra:document`](./skills/document/) | Documents | 10 | No |
| [`/mirra:google-drive`](./skills/google-drive/) | Google Drive | 10 | Yes (OAuth) |

### Project Management

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`/mirra:jira`](./skills/jira/) | Jira | 16 | Yes (OAuth) |

### Crypto & Finance

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`/mirra:crypto`](./skills/crypto/) | Crypto | 6 | No |
| [`/mirra:hypertrade`](./skills/hypertrade/) | Hypertrade | 10 | No |
| [`/mirra:jupiter`](./skills/jupiter/) | Jupiter | 6 | No |
| [`/mirra:polymarket`](./skills/polymarket/) | Polymarket | 17 | Yes (OAuth) |

### Social

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`/mirra:telegram`](./skills/telegram/) | Telegram | 8 | Yes (OAuth) |
| [`/mirra:twitter`](./skills/twitter/) | Twitter | 4 | Yes (OAuth) |

### Other

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`/mirra:google-ads`](./skills/google-ads/) | Google Ads | 25 | Yes (OAuth) |

### Other

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`/mirra:shopify`](./skills/shopify/) | Shopify | 63 | Yes (OAuth) |

### Collaboration

Hand-authored orchestration skills (not tied to a single adapter):

| Skill | What it does |
|-------|--------------|
| [`/mirra:cowork`](./skills/cowork/) | Cowork with another person's Claude Code over a shared Mirra group chat. Post questions, wait for replies in near-real-time (long-poll), and hand off follow-ups. Rides the Mirra Messaging adapter — no extra integration to install. |
| [`/mirra:ledger`](./skills/ledger/) | The team work-ledger ritual for agents on a Mirra space: track agreed work, propose discoveries (then ask in chat), share drafts for comment while the work is still open, close what ships with a page a teammate can actually open, and publish ONE narrated update card per work burst — led by a picture, revised, never stacked. Rides the Mirra items adapter / MCP work-ledger tools. |
| [`/mirra:mirra`](./skills/mirra/) | START HERE for anything Mirra. Load this whenever the repo you're working in has a .mirra/ directory (it's linked to a Mirra team space), or your human mentions their Mirra space, teammates' updates, or the team ledger. Directs the ambient team rituals — record work in the shared ledger, publish update cards, ask the space before expanding scope — and indexes every detail-level mirra-* skill. |

**Total: 38 adapters, 437 operations, 3 collaboration skill(s)**

## How It Works

Each skill provides Claude Code with:
- The API endpoint pattern for the adapter
- Every operation with its arguments, types, and examples
- curl commands that work out of the box (just add your API key)
- Response format documentation

Skills use `curl` so they work everywhere with no dependencies to install.

## Regeneration

This whole directory is generated and wiped on each run — do not edit it.
Adapter skills come from operation schemas. Hand-authored skills live in
`tools/llm-api-generator/static-skills/` and are copied in verbatim.
A `static-skills/<skill>/PREAMBLE.md` with no SKILL.md beside it is inlined at the top of that *generated* skill instead — use it for guidance schemas cannot express.
Source directories keep the `mirra-` prefix (`static-skills/mirra-ledger/`); the prefix is stripped on the way out.
To regenerate after adapter or static-skill changes:

```bash
cd apps/server && npm run generate:llm-api
```

## Working in the monorepo

The published plugin tracks `Oz-Networks/mirra-sdk`, which lags this checkout by however
long it has been since the last sync. To run the skills you just edited, install this
directory as a local plugin — it loads as `mirra@skills-dir` under the same `mirra:` names:

```bash
./scripts/sync-mirra-plugin.sh          # install this checkout as a local plugin
./scripts/sync-mirra-plugin.sh --check  # report drift, change nothing (exits 1 if stale)
```
