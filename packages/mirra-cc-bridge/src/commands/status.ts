/**
 * Status command - show bridge status and active sessions
 */

import chalk from 'chalk';
import { loadConfig, isConfigured, getConfigPath } from '../config';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CLAUDE_SETTINGS_FILE = join(homedir(), '.claude', 'settings.json');

/**
 * Check if Claude Code hooks are configured
 */
function checkHooksConfigured(): boolean {
  if (!existsSync(CLAUDE_SETTINGS_FILE)) {
    return false;
  }

  try {
    const content = readFileSync(CLAUDE_SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(content);

    // Check if our hooks are present
    const hasPostMessage = settings.hooks?.PostMessage?.some(
      (h: any) => h.command?.includes('mirra-cc-bridge')
    );
    const hasPostToolUse = settings.hooks?.PostToolUse?.some(
      (h: any) => h.command?.includes('mirra-cc-bridge')
    );

    return hasPostMessage && hasPostToolUse;
  } catch {
    return false;
  }
}

/**
 * Show bridge status
 */
export async function showStatus(): Promise<void> {
  console.log(chalk.gray('\n' + '─'.repeat(50)));
  console.log(chalk.bold('  MIRRA BRIDGE STATUS'));
  console.log(chalk.gray('─'.repeat(50)));

  const config = loadConfig();

  // Configuration status
  console.log(chalk.gray('\n[config]'));
  if (config?.apiKey) {
    console.log(
      chalk.green('  [+] api_key:  ') +
        `${config.apiKey.substring(0, 10)}...`
    );
  } else {
    console.log(chalk.red('  [-] api_key:  ') + 'not configured');
  }

  if (config?.userId) {
    console.log(chalk.green('  [+] user_id:  ') + config.userId);
  } else {
    console.log(chalk.gray('  [?] user_id:  ') + 'not set');
  }

  if (config?.defaultWorkDir) {
    console.log(chalk.green('  [+] work_dir: ') + config.defaultWorkDir);
  }

  // Hooks status
  console.log(chalk.gray('\n[hooks]'));
  if (checkHooksConfigured()) {
    console.log(chalk.green('  [+] claude_code: configured'));
  } else {
    console.log(chalk.red('  [-] claude_code: not configured'));
    console.log(chalk.gray('      run: mirra-cc-bridge setup-hooks'));
  }

  // Tunnel status (uses API key, no separate config needed)
  console.log(chalk.gray('\n[tunnel]'));
  if (config?.apiKey) {
    console.log(chalk.green('  [+] mirra:    ') + 'ready (uses API key)');
  } else {
    console.log(chalk.gray('  [-] mirra:    not configured'));
    console.log(chalk.gray('      run: mirra-cc-bridge setup'));
  }

  // PC Resource status
  console.log(chalk.gray('\n[resource]'));
  if (config?.pcResourceId) {
    console.log(chalk.green('  [+] registered: ') + config.pcResourceId);
  } else {
    console.log(chalk.gray('  [?] registered: no'));
    console.log(chalk.gray('      run: mirra-cc-bridge register'));
  }

  // Server status (check if running by trying to connect)
  console.log(chalk.gray('\n[server]'));
  const port = config?.server?.port || 3847;
  try {
    const http = await import('http');
    await new Promise<void>((resolve, reject) => {
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error('Not healthy'));
        }
      });
      req.on('error', reject);
      req.setTimeout(1000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
    console.log(chalk.green('  [+] status:   ') + `running on port ${port}`);
  } catch {
    console.log(chalk.gray('  [-] status:   ') + 'not running');
    console.log(chalk.gray('      run: mirra-cc-bridge start'));
  }

  // Overall status
  console.log(chalk.gray('\n' + '─'.repeat(50)));

  const configured = !!config?.apiKey;
  const hooksOk = checkHooksConfigured();
  const resourceOk = !!config?.pcResourceId;

  console.log(chalk.bold('\nCapabilities:'));
  console.log(
    hooksOk
      ? chalk.green('  [+] Output sync') + chalk.gray(' - Claude Code output will sync to Mirra')
      : chalk.yellow('  [-] Output sync') + chalk.gray(' - Run: mirra-cc-bridge setup-hooks')
  );
  console.log(
    resourceOk
      ? chalk.green('  [+] Remote control') + chalk.gray(' - Can receive commands from Mirra')
      : chalk.yellow('  [-] Remote control') + chalk.gray(' - Run: mirra-cc-bridge register')
  );

  if (configured && hooksOk && resourceOk) {
    console.log(chalk.green.bold('\n> Fully configured'));
    console.log(chalk.gray('  Two-way communication ready'));
    console.log(chalk.gray('  Start the bridge: mirra-cc-bridge start'));
  } else if (configured && hooksOk) {
    console.log(chalk.yellow.bold('\n> Partially configured'));
    console.log(chalk.gray('  Output sync ready, remote control not configured'));
  } else {
    console.log(chalk.yellow.bold('\n> Setup incomplete'));
    if (!configured) {
      console.log(chalk.gray('  Run: mirra-cc-bridge configure'));
    }
  }
  console.log('');
}
