#!/usr/bin/env node

/**
 * Configure entry point for Claude Code plugin
 *
 * Runs the interactive configuration flow (API key + chat selection).
 * Called by the /mirra-cc-bridge:configure skill.
 *
 * CLI flags:
 *   --skip-auth        Reuse existing valid API key (no browser auth)
 *   --reconfigure      Force browser re-auth (skip "Reconfigure?" prompt)
 *   --work-dir <path>  Set working directory (skip prompt)
 *   --group-id <id>    Set chat destination (skip chat selection)
 *   --list-chats       Output available chats as JSON and exit
 *   --skip-chat        Skip the interactive chat selection prompt
 *   --manual           Prompt for API key in terminal instead of browser
 */

import { configure, ConfigureOptions } from '../commands/configure';

function parseArgs(): ConfigureOptions {
  const args = process.argv.slice(2);
  const options: ConfigureOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--skip-auth':
        options.skipAuthPrompt = true;
        break;
      case '--reconfigure':
        options.reconfigure = true;
        break;
      case '--work-dir':
        options.workDir = args[++i];
        break;
      case '--group-id':
        options.groupId = args[++i];
        break;
      case '--list-chats':
        options.listChats = true;
        break;
      case '--skip-chat':
        options.skipChatSelection = true;
        break;
      case '--manual':
        options.manual = true;
        break;
      case '--api-key':
        options.apiKey = args[++i];
        break;
    }
  }

  return options;
}

const options = parseArgs();

configure(options).catch((error) => {
  console.error('Error during configuration:', error.message);
  process.exit(1);
});
