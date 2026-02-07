#!/usr/bin/env node

/**
 * Hook handler entry point for Claude Code plugin
 *
 * Called by hooks.json when Claude Code fires Notification, PostToolUse, or Stop events.
 * Delegates to the main handleHook() function.
 */

import { handleHook } from '../commands/hook';

const event = process.argv[2];
const args = process.argv.slice(3);

if (!event) {
  console.error('Usage: hook-handler.js <event> [args...]');
  process.exit(1);
}

handleHook(event, args).catch((error) => {
  // Silent failure for hooks - don't disrupt Claude Code
  console.error(error.message);
  process.exit(1);
});
