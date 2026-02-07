---
name: start
description: Start the Mirra bridge server to enable remote control of Claude Code from your phone
user_invocable: true
---

# Start Mirra Bridge

Start the Mirra CC Bridge server. This connects your Claude Code session to the Mirra mobile app, enabling remote control via text and voice.

## Steps

1. **Run the server as a background process** using `run_in_background: true` on the Bash tool. The script is at `../../scripts/server.js` relative to this skill's base directory:

```bash
node <base_directory>/../../scripts/server.js
```

2. **Wait a few seconds**, then read the output file to check if the server started successfully. Look for the `> Ready` line and the tunnel URL.

3. **Report the connection status** to the user — show the tunnel URL and whether hooks/resource registration succeeded.

## Important

- The server is long-running. You MUST use `run_in_background: true` so it doesn't block the conversation.
- If the server exits immediately with "Setup incomplete", the user needs to run `/mirra-cc-bridge:configure` first.
- If another instance is already running (port in use), suggest checking with `/mirra-cc-bridge:status`.
