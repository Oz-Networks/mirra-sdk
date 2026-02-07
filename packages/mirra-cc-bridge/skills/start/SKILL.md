---
name: start
description: Start the Mirra bridge server to enable remote control of Claude Code from your phone
user_invocable: true
---

# Start Mirra Bridge

Start the Mirra CC Bridge server. This connects your Claude Code session to the Mirra mobile app, enabling remote control via text and voice.

Run the following command and report the output to the user:

```bash
node ~/.claude/plugins/mirra-cc-bridge/scripts/server.js
```

If the server fails to start, check:
1. Is the bridge configured? If not, suggest running the `/mirra-cc-bridge:configure` skill first.
2. Is another instance already running? Check with `/mirra-cc-bridge:status`.
