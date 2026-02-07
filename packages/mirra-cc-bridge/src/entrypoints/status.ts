#!/usr/bin/env node

/**
 * Status entry point for Claude Code plugin
 *
 * Shows bridge configuration and connection status.
 * Called by the /mirra-cc-bridge:status skill.
 */

import { showStatus } from '../commands/status';

showStatus().catch((error) => {
  console.error('Error showing status:', error.message);
  process.exit(1);
});
