/**
 * Configure command - set up the bridge with API key and settings
 *
 * Authentication modes:
 * 1. Browser auth (default): Opens browser for OAuth-style login
 * 2. Manual: Prompts for API key in terminal
 * 3. Direct: API key provided via --api-key flag
 */

import chalk from 'chalk';
import * as readline from 'readline';
import { MirraSDK } from '@mirra-messenger/sdk';
import { loadConfig, saveConfig, getConfigPath, validateApiKey } from '../config';
import { BridgeConfig } from '../types';
import { runWebSocketAuthFlow, canOpenBrowser } from '../auth-flow';

interface ConfigureOptions {
  apiKey?: string;
  workDir?: string;
  manual?: boolean;
  /** When true, reuse valid cached auth without prompting */
  skipAuthPrompt?: boolean;
}

interface ChatOption {
  groupId: string;
  name: string;
  type: 'group' | 'direct';  // For display only
}

/**
 * Prompt for input.
 * In non-TTY environments (e.g., when run by Claude Code as a background process),
 * immediately returns the default value to avoid hanging on stdin.
 */
function prompt(question: string, defaultValue?: string): Promise<string> {
  // Non-TTY: return default immediately to prevent hanging
  if (!process.stdin.isTTY) {
    if (defaultValue) {
      console.log(chalk.gray(`  ${question}: ${defaultValue} (auto-selected, non-TTY)`));
    }
    return Promise.resolve(defaultValue || '');
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const displayQuestion = defaultValue
    ? `${question} [${defaultValue}]: `
    : `${question}: `;

  return new Promise((resolve) => {
    rl.question(displayQuestion, (answer) => {
      rl.close();
      resolve(answer || defaultValue || '');
    });
  });
}

/**
 * Create a new group via the Mirra SDK
 */
async function createNewGroup(apiKey: string): Promise<ChatOption | null> {
  const sdk = new MirraSDK({ apiKey }) as any;

  const name = await prompt('Enter group name');
  if (!name || name.trim().length === 0) {
    console.log(chalk.yellow('Group name cannot be empty'));
    return null;
  }

  const description = await prompt('Enter group description (optional)', '');

  try {
    console.log(chalk.gray('\nCreating group...'));
    const result = await sdk.mirraMessaging.createGroup({
      name: name.trim(),
      description: description.trim() || undefined,
      category: 'work', // Default for CC Bridge use case
    });

    if (result?.data?.groupId) {
      console.log(chalk.green(`\n[+] Created group: ${name.trim()}`));
      return {
        groupId: result.data.groupId,
        name: name.trim(),
        type: 'group',
      };
    } else {
      console.log(chalk.red('Failed to create group'));
      return null;
    }
  } catch (error: any) {
    console.log(chalk.red(`Error creating group: ${error.message}`));
    return null;
  }
}

/**
 * Fetch available chats from Mirra (all chats are groups internally)
 * Fetches both multi-person groups and 1-1 direct chats
 */
async function fetchChats(apiKey: string): Promise<ChatOption[]> {
  const sdk = new MirraSDK({ apiKey }) as any; // Cast to any for dynamic adapter access
  const chats: ChatOption[] = [];

  try {
    // Fetch multi-person groups
    const groupsResult = await sdk.mirraMessaging.getGroups({ limit: 50 });
    const groups = groupsResult?.data?.groups || [];

    for (const group of groups) {
      if (group.groupId) {
        chats.push({
          groupId: group.groupId,
          name: group.name || `Group ${group.groupId.substring(0, 8)}`,
          type: 'group',
        });
      }
    }

    // Fetch 1-1 direct chats (contacts with groupId)
    const contactsResult = await sdk.mirraMessaging.getContacts({ limit: 50, offset: 0 });
    const contacts = contactsResult?.data?.contacts || [];

    for (const contact of contacts) {
      if (contact.groupId) {
        chats.push({
          groupId: contact.groupId,
          name: contact.username || contact.name || `Chat ${contact.groupId.substring(0, 8)}`,
          type: 'direct',
        });
      }
    }
  } catch (error: any) {
    console.log(chalk.gray(`    Could not fetch chats: ${error.message}`));
  }

  return chats;
}

/**
 * Configure the bridge
 */
export async function configure(options: ConfigureOptions): Promise<void> {
  const existingConfig = loadConfig();

  // Get API key - three modes:
  // 1. --api-key flag: Use provided key directly
  // 2. --manual flag: Prompt for key in terminal
  // 3. Default: Browser-based OAuth flow
  let apiKey = options.apiKey;
  let userId: string | undefined;

  if (apiKey) {
    // API key provided via flag - use directly
    console.log(chalk.gray('Using provided API key...'));
  } else if (options.manual) {
    // Manual mode - prompt for API key
    apiKey = await prompt(
      'Enter your Mirra API key',
      existingConfig?.apiKey ? '(keep existing)' : undefined
    );

    if (apiKey === '(keep existing)' && existingConfig?.apiKey) {
      apiKey = existingConfig.apiKey;
    }
  } else {
    // Default: Browser-based authentication
    if (existingConfig?.apiKey) {
      // Validate the cached API key is still valid
      console.log(chalk.gray('Validating cached API key...'));
      const isValid = await validateApiKey(existingConfig.apiKey);

      if (isValid) {
        if (options.skipAuthPrompt) {
          // Non-interactive mode: reuse valid cached key without prompting
          apiKey = existingConfig.apiKey;
          userId = existingConfig.userId;
          console.log(chalk.green('  Cached API key is valid.'));
        } else {
          // Interactive mode: ask if they want to reconfigure
          const reconfigure = await prompt(
            'API key already configured and valid. Reconfigure? (y/N)',
            'n'
          );

          if (reconfigure.toLowerCase() !== 'y' && reconfigure.toLowerCase() !== 'yes') {
            apiKey = existingConfig.apiKey;
            userId = existingConfig.userId;
            console.log(chalk.gray('Keeping existing API key.'));
          }
        }
      } else {
        console.log(chalk.yellow('  Cached API key is no longer valid. Re-authenticating...'));
      }
    }

    // Run browser auth if we don't have a key yet
    if (!apiKey) {
      try {
        console.log(chalk.bold('\nAuthenticating with Mirra...\n'));

        if (!canOpenBrowser()) {
          console.log(chalk.yellow('Note: Browser auto-open not available. You\'ll need to copy the URL manually.\n'));
        }

        const result = await runWebSocketAuthFlow();
        apiKey = result.apiKey;
        userId = result.userId;

        if (result.email) {
          console.log(chalk.gray(`  Logged in as: ${result.email}\n`));
        }
      } catch (error: any) {
        console.log(chalk.yellow(`\nBrowser authentication failed: ${error.message}`));
        console.log(chalk.gray('Falling back to manual entry...\n'));

        apiKey = await prompt('Enter your Mirra API key');
      }
    }
  }

  if (!apiKey) {
    throw new Error('API key is required');
  }

  // Validate API key format
  if (!apiKey.startsWith('mirra_')) {
    console.log(chalk.yellow('Warning: API key should start with "mirra_"'));
  }

  // Save API key immediately so it survives if later steps fail.
  // This prevents re-triggering browser auth when configure is re-run
  // after a failure in chat selection or work directory prompting.
  const immediateConfig: BridgeConfig = {
    ...existingConfig,
    apiKey,
    userId: userId || existingConfig?.userId,
  };
  saveConfig(immediateConfig);

  // Get default working directory
  let workDir = options.workDir;
  if (!workDir) {
    workDir = await prompt(
      'Default working directory',
      existingConfig?.defaultWorkDir || process.cwd()
    );
  }

  // Fetch and select chat destination.
  // Wrapped in try/catch so failures here don't lose the already-saved API key.
  let groupId = existingConfig?.groupId;

  try {
    console.log(chalk.gray('\nFetching your chats...'));
    const chats = await fetchChats(apiKey);

    if (chats.length > 0) {
      console.log(chalk.gray('\nWhere should Claude Code output be sent?\n'));

      // Display chat options
      chats.forEach((chat, index) => {
        const typeLabel = chat.type === 'group' ? chalk.cyan('[group]') : chalk.gray('[direct]');
        const isCurrentSelection = chat.groupId === existingConfig?.groupId;
        const marker = isCurrentSelection ? chalk.green(' *') : '  ';
        console.log(`${marker}${index + 1}. ${typeLabel} ${chat.name}`);
      });

      // Add "create new group" option
      console.log(chalk.cyan('\n  [+] Create a new group'));
      console.log('');

      // Find current selection index for default
      const currentIndex = chats.findIndex((c) => c.groupId === existingConfig?.groupId);
      const defaultSelection = currentIndex >= 0 ? String(currentIndex + 1) : '1';

      const selection = await prompt('Select destination (or "new" to create)', defaultSelection);

      // Handle "new" selection
      if (selection.toLowerCase() === 'new' || selection === '+') {
        const newGroup = await createNewGroup(apiKey);
        if (newGroup) {
          groupId = newGroup.groupId;
        } else {
          console.log(chalk.yellow('Keeping existing selection'));
        }
      } else {
        const selectedIndex = parseInt(selection, 10) - 1;

        if (selectedIndex >= 0 && selectedIndex < chats.length) {
          const selectedChat = chats[selectedIndex];
          groupId = selectedChat.groupId;
          console.log(chalk.green(`\n[+] Selected: ${selectedChat.name}`));
        } else {
          console.log(chalk.yellow('Invalid selection, keeping existing'));
        }
      }
    } else {
      // No existing chats - offer to create one
      console.log(chalk.gray('    No existing chats found.'));
      const shouldCreate = await prompt('Create a new group? (y/N)', 'n');

      if (shouldCreate.toLowerCase() === 'y' || shouldCreate.toLowerCase() === 'yes') {
        const newGroup = await createNewGroup(apiKey);
        if (newGroup) {
          groupId = newGroup.groupId;
        }
      } else {
        console.log(chalk.gray('    You can set MIRRA_GROUP_ID manually later.'));
      }
    }
  } catch (error: any) {
    console.log(chalk.yellow(`\n  [!] Chat selection failed: ${error.message}`));
    console.log(chalk.gray('  API key was saved. You can re-run configure to select a chat destination.'));
  }

  // Save configuration with setupComplete flag
  const config: BridgeConfig = {
    ...existingConfig,
    apiKey,
    userId: userId || existingConfig?.userId,
    defaultWorkDir: workDir,
    groupId,
    setupComplete: true,
  };

  saveConfig(config);

  console.log(chalk.green('\n[+] Configuration saved'));
  console.log(chalk.gray(`    config:    ${getConfigPath()}`));
  console.log(
    chalk.gray(`    key:       ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`)
  );
  console.log(chalk.gray(`    dir:       ${workDir}`));
  if (groupId) {
    console.log(chalk.gray(`    group:     ${groupId.substring(0, 12)}...`));
  }
}
