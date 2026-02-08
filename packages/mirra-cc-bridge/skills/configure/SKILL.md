---
name: configure
description: Configure the Mirra bridge with your API key and chat destination
user_invocable: true
---

# Configure Mirra Bridge

Set up or reconfigure the Mirra CC Bridge. The configure script is located at `../../scripts/configure.js` relative to this skill's base directory.

## Step 1: Check current configuration

Read `~/.mirra/cc-bridge.json` to check the current state. If the file doesn't exist or has no `apiKey`, this is a fresh setup — go to **Fresh Setup** below.

If the config already has an `apiKey`, ask the user what they want to change using AskUserQuestion with these options:
- **Re-authenticate** — Get a new API key via browser login
- **Change working directory** — Update the default working directory
- **Change chat destination** — Select a different chat to send output to
- **Reconfigure everything** — Re-authenticate and change all settings

Then follow the appropriate section below.

## Fresh Setup (no existing config)

Run the configure script with `--work-dir` and `--skip-chat` to prevent hanging on interactive prompts after browser auth:

```bash
node <base_directory>/../../scripts/configure.js --work-dir "<cwd>" --skip-chat
```

Use a **5-minute timeout** since browser auth takes time. Do NOT retry if the command is still running.

After it completes, read `~/.mirra/cc-bridge.json` to confirm the `apiKey` was saved. Then:

1. Tell the user the working directory was set to the current directory. Ask if they'd like to change it — if yes, follow **Change Working Directory** below.
2. Follow **Change Chat Destination** below to let the user pick where output is sent.

## Re-authenticate

Run the configure script with `--reconfigure` plus the current working directory and group ID to preserve them:

```bash
node <base_directory>/../../scripts/configure.js --reconfigure --work-dir "<currentWorkDir>" --group-id "<currentGroupId>"
```

Use a **5-minute timeout**. This opens the browser exactly once for re-authentication. Do NOT retry — the browser auth requires user interaction.

## Change Working Directory

Ask the user for the new working directory path. Then directly update `~/.mirra/cc-bridge.json` by reading it, changing the `defaultWorkDir` field, and writing it back. No need to run the configure script.

## Change Chat Destination

1. First, fetch the available chats:

```bash
node <base_directory>/../../scripts/configure.js --skip-auth --list-chats
```

This outputs a JSON array of `{groupId, name, type}` objects.

2. Parse the JSON output and present the options to the user using AskUserQuestion (show chat name and type for each option).

3. After the user selects a chat, run:

```bash
node <base_directory>/../../scripts/configure.js --skip-auth --work-dir "<currentWorkDir>" --group-id "<selectedGroupId>"
```

## Reconfigure Everything

Run the configure script with `--reconfigure`, `--work-dir`, and `--skip-chat` to prevent hanging on prompts after auth:

```bash
node <base_directory>/../../scripts/configure.js --reconfigure --work-dir "<currentWorkDir>" --skip-chat
```

Use a **5-minute timeout**. After it completes:

1. Tell the user the working directory is currently set to `<currentWorkDir>`. Ask if they'd like to change it — if yes, follow **Change Working Directory** above.
2. Follow **Change Chat Destination** above to let the user pick a chat.

## CLI Flags Reference

| Flag | Description |
|------|-------------|
| `--skip-auth` | Reuse existing API key (no browser auth) |
| `--reconfigure` | Force browser re-auth (skip "Reconfigure?" prompt) |
| `--work-dir <path>` | Set working directory without prompting |
| `--group-id <id>` | Set chat destination without prompting |
| `--list-chats` | Output available chats as JSON array and exit |
| `--skip-chat` | Skip the interactive chat selection prompt |
| `--manual` | Prompt for API key in terminal instead of browser |

## Critical Rules

- **Never run the script multiple times for authentication.** Browser auth opens a browser window each time — multiple runs = multiple windows.
- **Always use a 5-minute timeout** when browser auth is involved (fresh setup or re-authenticate).
- **Prefer direct config file edits** for simple changes like working directory.
- **Always read the config file first** to know the current state before deciding what to do.
