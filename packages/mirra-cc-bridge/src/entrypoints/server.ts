#!/usr/bin/env node

/**
 * Server entry point for Claude Code plugin
 *
 * Starts the bridge HTTP server with tunnel connection.
 * Called by the /mirra-cc-bridge:start skill.
 */

import { startServer } from '../commands/start';

const port = process.env.MIRRA_BRIDGE_PORT || '3847';

startServer({ port }).catch((error) => {
  console.error('Error starting server:', error.message);
  process.exit(1);
});
