# Mirra Claude Code Skills

Auto-generated [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skills for every Mirra adapter.
Each skill teaches Claude Code how to call Mirra SDK operations via the REST API.

## Quick Start

1. Get your API key from the Mirra app (Settings > API Keys)
2. Install all skills with one command:

```bash
curl -fsSL https://raw.githubusercontent.com/Oz-Networks/mirra-sdk/main/skills/install.sh | bash
```

3. Type `/mirra-` in Claude Code to see all available skills
4. Ask Claude Code to do something with that integration:

```
"Send an email via Mirra to alice@example.com about the meeting tomorrow"
"Search my Telegram chats for messages about the project"
"Create a memory in Mirra with my meeting notes"
```

> **Update skills:** Re-run the install command anytime to get the latest skills.
> **Uninstall:** `curl -fsSL https://raw.githubusercontent.com/Oz-Networks/mirra-sdk/main/skills/install.sh | bash -s -- --uninstall`

## Available Skills

### Core (always available)

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`mirra-ai`](./mirra-ai/) | AI Services | 4 | No |
| [`mirra-claudeCode`](./mirra-claudeCode/) | Claude Code | 4 | No |
| [`mirra-contacts`](./mirra-contacts/) | Contacts | 9 | No |
| [`mirra-data`](./mirra-data/) | Data | 12 | No |
| [`mirra-desktop`](./mirra-desktop/) | Desktop | 10 | No |
| [`mirra-feed-items`](./mirra-feed-items/) | Feed Items | 1 | No |
| [`mirra-feedback`](./mirra-feedback/) | Feedback | 5 | No |
| [`mirra-flows`](./mirra-flows/) | Flows | 21 | No |
| [`mirra-memory`](./mirra-memory/) | Memory | 10 | No |
| [`mirra-observability`](./mirra-observability/) | Observability | 2 | No |
| [`mirra-pages`](./mirra-pages/) | Pages | 13 | No |
| [`mirra-skills`](./mirra-skills/) | Skills | 8 | No |
| [`mirra-user`](./mirra-user/) | User | 6 | No |
| [`mirra-video-generator`](./mirra-video-generator/) | Video Generator | 5 | No |
| [`mirra-voice`](./mirra-voice/) | Voice | 6 | No |

### Communication

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`mirra-google-gmail`](./mirra-google-gmail/) | Gmail | 10 | Yes (OAuth) |
| [`mirra-mirra-messaging`](./mirra-mirra-messaging/) | Mirra Messaging | 12 | No |
| [`mirra-telegramBot`](./mirra-telegramBot/) | Telegram Bot | 12 | Yes (OAuth) |

### Productivity

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`mirra-google-calendar`](./mirra-google-calendar/) | Google Calendar | 7 | Yes (OAuth) |
| [`mirra-google-docs`](./mirra-google-docs/) | Google Docs | 13 | Yes (OAuth) |
| [`mirra-google-sheets`](./mirra-google-sheets/) | Google Sheets | 17 | Yes (OAuth) |
| [`mirra-scripts`](./mirra-scripts/) | Scripts | 21 | No |
| [`mirra-trello`](./mirra-trello/) | Trello | 15 | Yes (OAuth) |

### Storage

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`mirra-document`](./mirra-document/) | Documents | 10 | No |
| [`mirra-google-drive`](./mirra-google-drive/) | Google Drive | 10 | Yes (OAuth) |

### Project Management

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`mirra-jira`](./mirra-jira/) | Jira | 16 | Yes (OAuth) |

### Crypto & Finance

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`mirra-crypto`](./mirra-crypto/) | Crypto | 6 | No |
| [`mirra-hypertrade`](./mirra-hypertrade/) | Hypertrade | 10 | No |
| [`mirra-jupiter`](./mirra-jupiter/) | Jupiter | 6 | No |
| [`mirra-polymarket`](./mirra-polymarket/) | Polymarket | 17 | Yes (OAuth) |

### Social

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`mirra-moltbook`](./mirra-moltbook/) | Moltbook | 23 | Yes (OAuth) |
| [`mirra-telegram`](./mirra-telegram/) | Telegram | 8 | Yes (OAuth) |
| [`mirra-twitter`](./mirra-twitter/) | Twitter | 4 | Yes (OAuth) |

### Marketplace

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`mirra-marketplace-resources`](./mirra-marketplace-resources/) | Marketplace Resources | 6 | No |
| [`mirra-marketplace-templates`](./mirra-marketplace-templates/) | Marketplace Templates | 14 | No |
| [`mirra-shopify`](./mirra-shopify/) | Shopify | 49 | Yes (OAuth) |

### Other

| Skill | Adapter | Operations | Auth Required |
|-------|---------|------------|---------------|
| [`mirra-google-ads`](./mirra-google-ads/) | Google Ads | 25 | Yes (OAuth) |

**Total: 37 adapters, 427 operations**

## How It Works

Each skill provides Claude Code with:
- The API endpoint pattern for the adapter
- Every operation with its arguments, types, and examples
- curl commands that work out of the box (just add your API key)
- Response format documentation

Skills use `curl` so they work everywhere with no dependencies to install.

## Regeneration

These skills are auto-generated from adapter operation schemas. Do not edit manually.
To regenerate after adapter changes:

```bash
cd apps/server && npm run generate:llm-api
```
