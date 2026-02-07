# Mirra Claude Code Bridge

A Claude Code plugin that bridges your coding sessions to the Mirra mobile app. Control Claude Code from your phone via text messages and voice calls.

## Features

- **Remote Control** — Start and manage Claude Code sessions from your phone
- **Permission Prompts** — Approve or deny tool usage with a single tap
- **Execution Details** — See what Claude did with step-by-step cards
- **Session Resume** — Pick up where you left off from the session list
- **Multi-turn Conversations** — Send follow-up prompts naturally
- **Secure Tunnel** — No ngrok or port forwarding needed

## Install

Add the Mirra marketplace and install the plugin:

```bash
claude plugin marketplace add https://github.com/Oz-Networks/mirra-sdk.git
claude plugin install mirra-cc-bridge
```

Then restart Claude Code for the plugin to load.

## Setup

Once installed, configure the bridge from within Claude Code:

```
/mirra-cc-bridge:configure
```

This will:
1. Authenticate with Mirra (opens your browser or accepts a manual API key)
2. Let you choose which chat receives Claude Code output
3. Save configuration to `~/.mirra/cc-bridge.json`

Then start the bridge:

```
/mirra-cc-bridge:start
```

## Requirements

- Node.js 18+
- Claude Code CLI installed
- Mirra account ([getmirra.app](https://getmirra.app))

## Slash Commands

| Command | Description |
|---------|-------------|
| `/mirra-cc-bridge:configure` | Set up API key and chat destination |
| `/mirra-cc-bridge:start` | Start the bridge server |
| `/mirra-cc-bridge:status` | Show bridge and connection status |

## How It Works

```
Your Phone  <---->  Mirra Cloud  <---->  Your PC (Claude Code)
```

1. The plugin registers hooks that sync Claude Code activity to Mirra
2. The bridge server connects your PC via a secure tunnel
3. Send prompts from the Mirra app to start or resume Claude Code sessions
4. Claude's output appears as rich cards on your phone
5. Tap Allow/Deny for permission prompts, or reply to continue

## Documentation

For detailed setup instructions, troubleshooting, and advanced usage:

**[docs.getmirra.app/docs/claude-code](https://docs.getmirra.app/docs/claude-code)**

## License

MIT
