/**
 * Auth Flow - WebSocket-based browser authentication
 *
 * Provides a seamless OAuth-style authentication flow:
 * 1. Opens WebSocket to Mirra server
 * 2. Receives session token and auth URL
 * 3. Opens browser to auth URL
 * 4. Waits for credentials to be pushed via WebSocket
 *
 * This eliminates the need for users to manually copy API keys.
 */

import WebSocket from 'ws';
import chalk from 'chalk';

// Try to import 'open' for browser opening, fall back gracefully
let openBrowser: ((url: string) => Promise<void>) | null = null;
try {
  // Dynamic import to handle missing dependency
  const openModule = require('open');
  openBrowser = openModule.default || openModule;
} catch {
  // 'open' not installed - will show URL for manual opening
}

/**
 * Auth message types from server
 */
enum AuthMessageType {
  SESSION_CREATED = 'auth:session_created',
  SUCCESS = 'auth:success',
  ERROR = 'auth:error',
  EXPIRED = 'auth:expired',
}

/**
 * Result of successful authentication
 */
export interface AuthResult {
  apiKey: string;
  userId: string;
  email?: string;
}

/**
 * Options for the auth flow
 */
export interface AuthFlowOptions {
  /** Custom API base URL (defaults to MIRRA_API_URL or https://api.fxn.world) */
  apiBaseUrl?: string;
  /** Timeout in milliseconds (defaults to 15 minutes) */
  timeoutMs?: number;
  /** Whether to automatically open browser (defaults to true) */
  openBrowser?: boolean;
}

const DEFAULT_OPTIONS: Required<AuthFlowOptions> = {
  apiBaseUrl: process.env.MIRRA_API_URL || 'https://api.fxn.world',
  timeoutMs: 15 * 60 * 1000, // 15 minutes
  openBrowser: true,
};

/**
 * Run the WebSocket-based authentication flow
 *
 * @param options - Configuration options
 * @returns Authentication result with API key and user info
 * @throws Error if authentication fails or times out
 */
export async function runWebSocketAuthFlow(
  options: AuthFlowOptions = {}
): Promise<AuthResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Build WebSocket URL
  const wsUrl = opts.apiBaseUrl
    .replace('https://', 'wss://')
    .replace('http://', 'ws://') + '/tunnel/auth/ws';

  console.log(chalk.gray('Connecting to Mirra authentication service...'));

  return new Promise((resolve, reject) => {
    let ws: WebSocket;
    let timeoutHandle: NodeJS.Timeout;
    let authUrl: string | null = null;
    let resolved = false;
    let browserAlreadyOpened = false;

    const cleanup = () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };

    const handleReject = (error: Error) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(error);
      }
    };

    const handleResolve = (result: AuthResult) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };

    try {
      ws = new WebSocket(wsUrl);

      // Set up timeout
      timeoutHandle = setTimeout(() => {
        handleReject(new Error('Authentication timed out. Please try again.'));
      }, opts.timeoutMs);

      ws.on('open', () => {
        console.log(chalk.gray('Connected, waiting for session...'));
      });

      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());

          switch (message.type) {
            case AuthMessageType.SESSION_CREATED:
              authUrl = message.authUrl;

              // Only open the browser once, even if multiple SESSION_CREATED
              // messages arrive (e.g., due to WebSocket reconnection/instability)
              if (!browserAlreadyOpened) {
                browserAlreadyOpened = true;

                console.log('');
                console.log(chalk.cyan.bold('  Authentication required'));
                console.log('');

                // Try to open browser
                if (opts.openBrowser && openBrowser) {
                  try {
                    console.log(chalk.gray('  Opening browser...'));
                    await openBrowser(authUrl!);
                    console.log(chalk.green('  ✓ Browser opened'));
                  } catch {
                    console.log(chalk.yellow('  Could not open browser automatically.'));
                    console.log('');
                    console.log(chalk.white('  Please open this URL in your browser:'));
                    console.log(chalk.cyan(`  ${authUrl}`));
                  }
                } else {
                  console.log(chalk.white('  Please open this URL in your browser:'));
                  console.log('');
                  console.log(chalk.cyan(`  ${authUrl}`));
                }

                console.log('');
                console.log(chalk.gray('  Waiting for authorization...'));
                console.log(chalk.gray(`  (Session expires in ${Math.floor(message.expiresIn / 60)} minutes)`));
                console.log('');
              }
              break;

            case AuthMessageType.SUCCESS:
              console.log(chalk.green.bold('  ✓ Authentication successful!'));
              console.log('');
              handleResolve({
                apiKey: message.apiKey,
                userId: message.userId,
                email: message.email,
              });
              break;

            case AuthMessageType.ERROR:
              console.log(chalk.red(`  ✗ Authentication failed: ${message.message}`));
              handleReject(new Error(message.message || 'Authentication failed'));
              break;

            case AuthMessageType.EXPIRED:
              console.log(chalk.yellow('  ⚠ Session expired. Please try again.'));
              handleReject(new Error('Authentication session expired'));
              break;

            default:
              // Unknown message type - ignore
              break;
          }
        } catch (e) {
          // Malformed message - ignore
        }
      });

      ws.on('error', (error) => {
        console.log(chalk.red(`  Connection error: ${error.message}`));
        handleReject(new Error(`Connection failed: ${error.message}`));
      });

      ws.on('close', (code, reason) => {
        if (!resolved) {
          if (code === 1000) {
            // Normal close after success - ignore
          } else if (code === 4002) {
            handleReject(new Error('Authentication session expired'));
          } else if (code === 4003) {
            handleReject(new Error('Too many pending authentication requests'));
          } else {
            handleReject(new Error(`Connection closed unexpectedly (code: ${code})`));
          }
        }
      });
    } catch (error: any) {
      handleReject(new Error(`Failed to connect: ${error.message}`));
    }
  });
}

/**
 * Check if browser opening is available
 */
export function canOpenBrowser(): boolean {
  return openBrowser !== null;
}
