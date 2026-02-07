/**
 * Tunnel management - connects to Mirra's tunnel service for remote access
 *
 * Uses WebSocket connection to Mirra's server instead of ngrok.
 * No external dependencies or account signup required.
 */

import chalk from 'chalk';
import WebSocket from 'ws';
import { loadConfig } from './config';

// Tunnel message types (must match server)
enum TunnelMessageType {
  CONNECT = 'tunnel:connect',
  CONNECTED = 'tunnel:connected',
  DISCONNECT = 'tunnel:disconnect',
  PING = 'tunnel:ping',
  PONG = 'tunnel:pong',
  HTTP_REQUEST = 'tunnel:http_request',
  HTTP_RESPONSE = 'tunnel:http_response',
  ERROR = 'tunnel:error',
}

interface TunnelMessage {
  type: TunnelMessageType;
  timestamp: number;
}

interface TunnelConnectedMessage extends TunnelMessage {
  type: TunnelMessageType.CONNECTED;
  userId: string;
  tunnelUrl: string;
}

interface TunnelHttpRequest extends TunnelMessage {
  type: TunnelMessageType.HTTP_REQUEST;
  requestId: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: string;
}

interface TunnelHttpResponse extends TunnelMessage {
  type: TunnelMessageType.HTTP_RESPONSE;
  requestId: string;
  statusCode: number;
  headers: Record<string, string>;
  body?: string;
}

// Active WebSocket connection
let ws: WebSocket | null = null;
let tunnelUrl: string | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let localPort: number = 3847;
let tunnelName: string | null = null; // Name for this tunnel instance
let authFailed: boolean = false; // Track if auth has failed (unrecoverable)

// Handler for incoming HTTP requests from the tunnel
type RequestHandler = (
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: string
) => Promise<{ statusCode: number; headers: Record<string, string>; body?: string }>;

let requestHandler: RequestHandler | null = null;

/**
 * Set the handler for incoming HTTP requests
 */
export function setRequestHandler(handler: RequestHandler): void {
  requestHandler = handler;
}

export interface TunnelOptions {
  port: number;
  name?: string;  // Optional name for this tunnel (for multi-tunnel identification)
}

/**
 * Connect to Mirra's tunnel service
 */
export async function startTunnel(portOrOptions: number | TunnelOptions): Promise<string> {
  const config = loadConfig();

  if (!config?.apiKey) {
    throw new Error('API key not configured. Run `mirra-cc-bridge configure` first.');
  }

  // Handle both old signature (port: number) and new signature (options: TunnelOptions)
  const options: TunnelOptions = typeof portOrOptions === 'number'
    ? { port: portOrOptions }
    : portOrOptions;

  localPort = options.port;
  tunnelName = options.name || null;
  authFailed = false; // Reset auth state for new connection attempt

  // Determine WebSocket URL
  const baseUrl = process.env.MIRRA_API_URL || 'https://api.fxn.world';
  const wsUrl = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/tunnel/ws';

  console.log(chalk.gray('Connecting to Mirra tunnel service...'));

  return new Promise((resolve, reject) => {
    try {
      ws = new WebSocket(wsUrl);

      const connectionTimeout = setTimeout(() => {
        if (ws) {
          ws.close();
          ws = null;
        }
        reject(new Error('Connection timeout'));
      }, 30000);

      ws.on('open', () => {
        console.log(chalk.gray('WebSocket connected, authenticating...'));

        // Send connect message with API key and optional tunnel name
        const connectMsg: any = {
          type: TunnelMessageType.CONNECT,
          timestamp: Date.now(),
          apiKey: config.apiKey,
        };

        // Include tunnel name if provided (for multi-tunnel identification)
        if (tunnelName) {
          connectMsg.tunnelName = tunnelName;
        }

        ws!.send(JSON.stringify(connectMsg));
      });

      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString()) as TunnelMessage;

          switch (message.type) {
            case TunnelMessageType.CONNECTED: {
              const connectedMsg = message as TunnelConnectedMessage;
              tunnelUrl = connectedMsg.tunnelUrl;
              clearTimeout(connectionTimeout);
              console.log(chalk.green('[+] Tunnel connected'));
              console.log(chalk.gray(`    URL: ${tunnelUrl}`));
              resolve(tunnelUrl);
              break;
            }

            case TunnelMessageType.PING: {
              // Respond to keep-alive ping
              const pongMsg: TunnelMessage = {
                type: TunnelMessageType.PONG,
                timestamp: Date.now(),
              };
              ws!.send(JSON.stringify(pongMsg));
              break;
            }

            case TunnelMessageType.HTTP_REQUEST: {
              await handleHttpRequest(message as TunnelHttpRequest);
              break;
            }

            case TunnelMessageType.ERROR: {
              const errorMsg = message as any;
              console.error(chalk.red(`Tunnel error: ${errorMsg.message}`));
              if (errorMsg.code === 'AUTH_FAILED' || errorMsg.code === 'AUTH_REQUIRED') {
                authFailed = true;
                clearTimeout(connectionTimeout);
                ws?.close();
                console.error(chalk.red('\nAuthentication failed. Please reconfigure your API key:'));
                console.error(chalk.yellow('  mirra-cc-bridge configure\n'));
                reject(new Error('Authentication failed - check your API key'));
              }
              break;
            }
          }
        } catch (error) {
          console.error('Error processing tunnel message:', error);
        }
      });

      ws.on('close', (code, reason) => {
        console.log(chalk.gray(`Tunnel disconnected (${code})`));
        tunnelUrl = null;

        // Don't reconnect on auth failures or intentional close
        if (authFailed) {
          console.log(chalk.red('Not reconnecting due to authentication failure.'));
          console.log(chalk.yellow('Run `mirra-cc-bridge configure` to update your API key.\n'));
          return;
        }

        // Attempt reconnection if not intentionally closed
        if (code !== 1000) {
          scheduleReconnect();
        }
      });

      ws.on('error', (error) => {
        console.error(chalk.red('Tunnel WebSocket error:'), error.message);
        clearTimeout(connectionTimeout);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Handle an HTTP request coming through the tunnel
 */
async function handleHttpRequest(request: TunnelHttpRequest): Promise<void> {
  if (!ws) return;

  let response: TunnelHttpResponse;

  try {
    // If we have a custom handler, use it
    if (requestHandler) {
      const result = await requestHandler(
        request.method,
        request.path,
        request.headers,
        request.body
      );
      response = {
        type: TunnelMessageType.HTTP_RESPONSE,
        timestamp: Date.now(),
        requestId: request.requestId,
        statusCode: result.statusCode,
        headers: result.headers,
        body: result.body,
      };
    } else {
      // Default: proxy to local server
      const result = await proxyToLocalServer(request);
      response = {
        type: TunnelMessageType.HTTP_RESPONSE,
        timestamp: Date.now(),
        requestId: request.requestId,
        statusCode: result.statusCode,
        headers: result.headers,
        body: result.body,
      };
    }
  } catch (error: any) {
    response = {
      type: TunnelMessageType.HTTP_RESPONSE,
      timestamp: Date.now(),
      requestId: request.requestId,
      statusCode: 502,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Bad gateway', message: error.message }),
    };
  }

  ws.send(JSON.stringify(response));
}

/**
 * Proxy request to local Express server
 */
async function proxyToLocalServer(
  request: TunnelHttpRequest
): Promise<{ statusCode: number; headers: Record<string, string>; body?: string }> {
  const http = await import('http');

  return new Promise((resolve, reject) => {
    // Copy headers but recalculate Content-Length for the body
    // The server-side tunnel JSON.stringifies the body, which may change its length
    const headers = { ...request.headers };
    if (request.body) {
      // Set correct Content-Length for the actual body we're sending
      headers['content-length'] = Buffer.byteLength(request.body, 'utf8').toString();
    } else {
      // No body, remove Content-Length if present
      delete headers['content-length'];
    }

    const options = {
      hostname: 'localhost',
      port: localPort,
      path: request.path,
      method: request.method,
      headers,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(res.headers)) {
          if (typeof value === 'string') {
            headers[key] = value;
          } else if (Array.isArray(value)) {
            headers[key] = value.join(', ');
          }
        }
        resolve({
          statusCode: res.statusCode || 500,
          headers,
          body,
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (request.body) {
      req.write(request.body);
    }
    req.end();
  });
}

/**
 * Schedule a reconnection attempt
 */
function scheduleReconnect(): void {
  if (reconnectTimeout) return;

  console.log(chalk.gray('Reconnecting in 5 seconds...'));
  reconnectTimeout = setTimeout(async () => {
    reconnectTimeout = null;
    try {
      // Reconnect with same options (port and name)
      await startTunnel({ port: localPort, name: tunnelName || undefined });
    } catch (error: any) {
      console.error(chalk.red('Reconnection failed:'), error.message);
      scheduleReconnect();
    }
  }, 5000);
}

/**
 * Stop the tunnel connection
 */
export async function stopTunnel(): Promise<void> {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (ws) {
    try {
      ws.close(1000, 'Client stopping');
      ws = null;
      tunnelUrl = null;
      console.log(chalk.gray('Tunnel stopped'));
    } catch (error: any) {
      console.error(chalk.yellow(`Warning: Could not stop tunnel: ${error.message}`));
    }
  }
}

/**
 * Check if tunnel is active
 */
export function isTunnelActive(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

/**
 * Get the current tunnel URL
 */
export function getTunnelUrl(): string | null {
  return tunnelUrl;
}

/**
 * Get the current tunnel name
 */
export function getTunnelName(): string | null {
  return tunnelName;
}

// Legacy exports for compatibility (no longer needed with Mirra tunnel)
export function saveAuthToken(_authToken: string): void {
  // No-op - Mirra tunnel uses the existing API key, no separate auth token needed
  console.log(chalk.gray('Note: Mirra tunnel uses your API key for authentication'));
}
