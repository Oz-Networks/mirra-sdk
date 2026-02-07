# Mirra Claude Code Bridge

A Claude Code plugin that bridges your coding sessions to the Mirra mobile app. Control Claude Code from your phone via text messages and voice calls.

## Features

- **Remote Control** - Start and manage Claude Code sessions from your phone
- **Session Resume** - Browse recent sessions and pick up where you left off
- **Permission Prompts** - Approve or deny tool usage with a single tap
- **Execution Details** - See what Claude did with step-by-step cards
- **Memory Notes** - Rolling session logs stored in your Mirra knowledge graph
- **Multi-turn Conversations** - Send follow-up prompts naturally
- **Secure Tunnel** - Auto-provisioned tunnel, no ngrok or port forwarding needed

## Install

Add the Mirra marketplace and install the plugin:

```bash
claude plugin marketplace add https://github.com/Oz-Networks/mirra-sdk.git
claude plugin install mirra-cc-bridge
```

Restart Claude Code for the plugin to load.

## Quick Start

### 1. Configure

Run inside Claude Code:

```
/mirra-cc-bridge:configure
```

This walks you through:
- Authenticating with Mirra (opens your browser, or enter an API key manually)
- Choosing which chat receives Claude Code output
- Saving configuration to `~/.mirra/cc-bridge.json`

### 2. Start the bridge

```
/mirra-cc-bridge:start
```

This starts a local server and opens a secure tunnel. The bridge:
- Registers your PC as a Mirra resource
- Connects via a persistent tunnel (no port forwarding needed)
- Configures authentication automatically
- Logs startup status so you can confirm everything connected

The bridge runs in the background for the duration of your Claude Code session.

### 3. Check status

```
/mirra-cc-bridge:status
```

Shows configuration state, hook registration, tunnel connectivity, and active sessions.

## Commands

| Command | Description |
|---------|-------------|
| `/mirra-cc-bridge:configure` | Set up API key and chat destination |
| `/mirra-cc-bridge:start` | Start the bridge server and tunnel |
| `/mirra-cc-bridge:status` | Show bridge and connection status |

## API Endpoints

Once running, the bridge exposes these endpoints (via tunnel):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (unauthenticated) |
| `GET` | `/sessions` | List active managed sessions |
| `POST` | `/sessions` | Spawn a new Claude Code session |
| `POST` | `/sessions/resume` | Resume an existing Claude Code session |
| `GET` | `/sessions/:id` | Get session details |
| `POST` | `/sessions/:id/input` | Send follow-up input to a session |
| `DELETE` | `/sessions/:id` | Kill a session |
| `GET` | `/claude-sessions` | List resumable sessions from `~/.claude/projects` |
| `POST` | `/respond` | Respond to a permission prompt (allow/deny) |

All endpoints except `/health` require a Bearer token, which is configured automatically during setup.

## How It Works

```
Your Phone (Mirra App)
    |
    v
Mirra Cloud
    |
    v
Secure Tunnel  --->  Bridge Server (localhost:3847)
                          |
                          v
                     Claude Code CLI (--resume / new session)
```

1. **Configure** registers your Mirra API key and picks a chat destination
2. **Start** launches the bridge server, opens a tunnel, and registers your PC as a Mirra resource
3. **From your phone**, send a message to start a new Claude Code session or resume an existing one
4. **Claude's output** syncs back to Mirra as rich cards (code blocks, diffs, file trees)
5. **Permission prompts** appear as tappable Allow/Deny buttons
6. **Session memory** is stored as notes in your Mirra knowledge graph for context across sessions

## Requirements

- Node.js 18+
- Claude Code CLI installed
- Mirra account ([getmirra.app](https://getmirra.app))

## Documentation

For detailed setup instructions, troubleshooting, and advanced usage:

**[docs.getmirra.app/docs/claude-code](https://docs.getmirra.app/docs/claude-code)**

## License

MIT
