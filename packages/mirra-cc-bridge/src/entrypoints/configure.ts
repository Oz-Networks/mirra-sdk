#!/usr/bin/env node

/**
 * Configure entry point for Claude Code plugin
 *
 * Runs the interactive configuration flow (API key + chat selection).
 * Called by the /mirra-cc-bridge:configure skill.
 */

import { configure } from '../commands/configure';

configure({}).catch((error) => {
  console.error('Error during configuration:', error.message);
  process.exit(1);
});
