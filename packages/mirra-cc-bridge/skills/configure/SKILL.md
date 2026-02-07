---
name: configure
description: Configure the Mirra bridge with your API key and chat destination
user_invocable: true
---

# Configure Mirra Bridge

Set up the Mirra CC Bridge with your API key and select which chat to send Claude Code output to.

Run the configure script, which is located at `../../scripts/configure.js` relative to this skill's base directory. For example:

```bash
node <base_directory>/../../scripts/configure.js
```

This will:
1. Authenticate with Mirra (via browser or manual API key entry)
2. Let you choose a chat destination for Claude Code output
3. Save configuration to `~/.mirra/cc-bridge.json`
