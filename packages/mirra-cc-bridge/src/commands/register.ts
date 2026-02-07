/**
 * Register command - register this PC as a Mirra resource
 */

import chalk from 'chalk';
import * as readline from 'readline';
import * as os from 'os';
import { MirraSDK } from '@mirra-messenger/sdk';
import { loadConfig, setConfigValue, getOrCreateBridgeAuthToken } from '../config';
import { startTunnel, stopTunnel, getTunnelUrl } from '../tunnel';
import { getBasicResourceMethods, toSDKMethods } from '../resource-methods';

interface RegisterOptions {
  name?: string;
  tunnel?: string;
}

/**
 * Prompt for input
 */
function prompt(question: string, defaultValue?: string): Promise<string> {
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
 * Find existing Claude Code resources for this PC
 * This prevents duplicate resources when user reconfigures the bridge
 * Returns the resource to reuse (if any) and a list of all matching resources
 */
async function findExistingClaudeCodeResources(sdk: MirraSDK): Promise<{
  resourceToReuse: any | null;
  allMatching: any[];
}> {
  const hostname = os.hostname();
  const expectedNamePattern = `${hostname} - Claude Code`;

  try {
    // List all resources owned by the user
    const resources = await sdk.resources.list();

    // Filter for Claude Code resources that match this hostname
    // Match pattern: "{hostname} - Claude Code" or resources with Claude Code in description
    const matchingResources = (resources || []).filter((r: any) => {
      const name = r.name || '';
      const description = r.description || '';

      // Exact name match
      if (name === expectedNamePattern) {
        return true;
      }

      // Match resources that have this hostname and "Claude Code" in name
      if (name.includes(hostname) && name.toLowerCase().includes('claude code')) {
        return true;
      }

      // Match resources that mention this hostname in description and are Claude Code related
      if (description.includes(hostname) && description.toLowerCase().includes('claude code')) {
        return true;
      }

      return false;
    });

    if (matchingResources.length === 0) {
      return { resourceToReuse: null, allMatching: [] };
    }

    // Sort by createdAt (newest first) to prefer the most recent resource
    matchingResources.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return {
      resourceToReuse: matchingResources[0],
      allMatching: matchingResources,
    };
  } catch (error: any) {
    console.log(chalk.yellow(`  [!] Could not list existing resources: ${error.message}`));
    return { resourceToReuse: null, allMatching: [] };
  }
}

/**
 * Generate OpenAPI spec for the PC resource
 */
function generateOpenAPISpec(): object {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Mirra Claude Code Bridge',
      version: '1.0.0',
      description: 'Control Claude Code sessions on a local PC',
    },
    paths: {
      '/sessions': {
        get: {
          operationId: 'listSessions',
          summary: 'List active Claude Code sessions',
          responses: {
            '200': {
              description: 'List of sessions',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Session' },
                  },
                },
              },
            },
          },
        },
        post: {
          operationId: 'spawnSession',
          summary: 'Spawn a new Claude Code session',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['initialPrompt', 'recipientId'],
                  properties: {
                    workingDir: { type: 'string' },
                    initialPrompt: { type: 'string' },
                    recipientId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Session created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Session' },
                },
              },
            },
          },
        },
      },
      '/sessions/{sessionId}': {
        get: {
          operationId: 'getSession',
          summary: 'Get session details',
          parameters: [
            {
              name: 'sessionId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Session details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Session' },
                },
              },
            },
          },
        },
        delete: {
          operationId: 'killSession',
          summary: 'Kill a session',
          parameters: [
            {
              name: 'sessionId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Session killed' },
          },
        },
      },
      '/sessions/{sessionId}/input': {
        post: {
          operationId: 'sendInput',
          summary: 'Send input to a session',
          parameters: [
            {
              name: 'sessionId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['input'],
                  properties: {
                    input: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Input sent' },
          },
        },
      },
    },
    components: {
      schemas: {
        Session: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            workingDir: { type: 'string' },
            status: {
              type: 'string',
              enum: ['starting', 'running', 'stopped', 'error'],
            },
            createdAt: { type: 'string', format: 'date-time' },
            lastActivity: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  };
}

/**
 * Register this PC as a Mirra resource
 */
export async function registerPC(options: RegisterOptions): Promise<void> {
  console.log(chalk.gray('\nRegistering PC as Mirra resource...\n'));

  const config = loadConfig();
  if (!config?.apiKey) {
    throw new Error('Not configured. Run `mirra-cc-bridge configure` first.');
  }

  // Get PC name
  const defaultName = `${os.hostname()} - Claude Code`;
  const pcName = options.name || (await prompt('Name for this PC', defaultName));

  // Get tunnel URL
  console.log(chalk.gray('\nYou need a tunnel URL for the PC to be reachable.'));
  console.log(chalk.gray('  Run: ngrok http 3847'));
  console.log(chalk.gray('  Or use Cloudflare Tunnel\n'));

  const tunnelUrl = await prompt('Enter your tunnel URL (e.g., https://abc123.ngrok.io)');

  if (!tunnelUrl) {
    throw new Error('Tunnel URL is required for registration');
  }

  // Validate URL format
  if (!tunnelUrl.startsWith('http://') && !tunnelUrl.startsWith('https://')) {
    throw new Error('Tunnel URL must start with http:// or https://');
  }

  console.log(chalk.gray('\nRegistering with Mirra...'));

  const sdk = new MirraSDK({ apiKey: config.apiKey });
  const bridgeAuthToken = getOrCreateBridgeAuthToken();

  try {
    let resourceId = config.pcResourceId;

    // Check if already registered in local config
    if (resourceId) {
      console.log(chalk.yellow('PC already registered. Updating...'));

      // Update existing resource with methods including examples
      await sdk.resources.update({
        id: resourceId,
        endpoint: {
          baseUrl: tunnelUrl,
          authentication: 'bearer',
          methods: toSDKMethods(getBasicResourceMethods()),
        },
      });

      console.log(chalk.green('\n[+] PC resource updated'));
    } else {
      // Check for existing Claude Code resources on the server before creating a new one
      // This prevents duplicates when user reconfigures after deleting local config
      console.log(chalk.gray('Checking for existing Claude Code resources...'));
      const { resourceToReuse, allMatching } = await findExistingClaudeCodeResources(sdk);

      if (resourceToReuse) {
        const existingId: string = resourceToReuse.id || resourceToReuse._id;
        if (!existingId) {
          throw new Error('Found existing resource but could not extract ID');
        }
        resourceId = existingId;

        console.log(chalk.green('[+] Found existing Claude Code resource'));
        console.log(chalk.gray(`    Resource ID: ${existingId}`));
        console.log(chalk.gray(`    Name: ${resourceToReuse.name}`));

        // Warn about duplicates if more than one matching resource was found
        if (allMatching.length > 1) {
          console.log(chalk.yellow(`[!] Found ${allMatching.length} Claude Code resources for this PC`));
          console.log(chalk.yellow('    Using the most recent one. Consider cleaning up old resources.'));
        }

        // Save to local config
        setConfigValue('pcResourceId', existingId);

        // Update endpoint to current tunnel URL
        await sdk.resources.update({
          id: existingId,
          endpoint: {
            baseUrl: tunnelUrl,
            authentication: 'bearer',
            methods: toSDKMethods(getBasicResourceMethods()),
          },
        });

        console.log(chalk.green('\n[+] PC resource endpoint updated'));
      } else {
        // No existing resource found - create new resource with methods including examples
        const resource = await sdk.resources.create({
          name: pcName,
          description: `Claude Code on ${os.hostname()}`,
          resourceType: 'integration',
          category: 'development',
          isPrivate: true,
          endpoint: {
            baseUrl: tunnelUrl,
            authentication: 'bearer',
            methods: toSDKMethods(getBasicResourceMethods()),
          },
          pricing: { model: 'free' },
          openApiSpec: generateOpenAPISpec(),
        });

        // Save resource ID
        resourceId = resource.id;
        setConfigValue('pcResourceId', resourceId);

        console.log(chalk.green('\n[+] PC registered'));
        console.log(chalk.gray(`    resource_id: ${resourceId}`));
      }
    }

    if (!resourceId) {
      throw new Error('Failed to register or find resource');
    }

    // Install the resource for the user
    console.log(chalk.gray('\nInstalling resource...'));
    try {
      await sdk.resources.install(resourceId);
      console.log(chalk.green('[+] Resource installed'));
    } catch (e: any) {
      if (e.message?.includes('already installed')) {
        console.log(chalk.gray('    Already installed'));
      } else {
        console.log(chalk.yellow(`    Could not auto-install: ${e.message}`));
      }
    }

    // Configure authentication for the installation
    console.log(chalk.gray('\nConfiguring authentication...'));
    try {
      await sdk.resources.authenticate(resourceId, {
        type: 'bearer',
        credentials: { token: bridgeAuthToken },
      });
      console.log(chalk.green('[+] Authentication configured'));
    } catch (e: any) {
      console.log(chalk.yellow(`    Could not configure authentication: ${e.message}`));
    }

    console.log(chalk.green('\n> Registration complete.'));
    console.log(chalk.gray('\nRemote control enabled. Start the bridge with:'));
    console.log(chalk.white('  mirra-cc-bridge start'));
  } catch (error: any) {
    throw new Error(`Registration failed: ${error.message}`);
  }
}

interface RegisterWithTunnelOptions {
  name?: string;
  port?: number;
}

/**
 * Register this PC using the Mirra tunnel service
 * This starts a temporary tunnel to get the URL, registers the resource, then stops it
 */
export async function registerWithTunnel(options: RegisterWithTunnelOptions): Promise<void> {
  console.log(chalk.gray('Registering PC with Mirra tunnel...\n'));

  const config = loadConfig();
  if (!config?.apiKey) {
    throw new Error('Not configured. Run `mirra-cc-bridge configure` first.');
  }

  // Mirra tunnel uses the API key for authentication - no separate config needed

  const port = options.port || config.server?.port || 3847;

  // Start temporary tunnel to get URL
  console.log(chalk.gray('Starting temporary tunnel to get URL...'));
  let tunnelUrl: string;

  try {
    tunnelUrl = await startTunnel(port);
  } catch (error: any) {
    throw new Error(`Failed to start tunnel: ${error.message}`);
  }

  // Get PC name
  const defaultName = `${os.hostname()} - Claude Code`;
  const pcName = options.name || defaultName;

  console.log(chalk.gray('\nRegistering with Mirra...'));

  const sdk = new MirraSDK({ apiKey: config.apiKey });
  const bridgeAuthToken = getOrCreateBridgeAuthToken();

  try {
    let resourceId = config.pcResourceId;

    // Check if already registered in local config
    if (resourceId) {
      console.log(chalk.yellow('PC already registered. Updating endpoint...'));

      // Update existing resource with methods including examples
      await sdk.resources.update({
        id: resourceId,
        endpoint: {
          baseUrl: tunnelUrl,
          authentication: 'bearer',
          methods: toSDKMethods(getBasicResourceMethods()),
        },
      });

      console.log(chalk.green('\n[+] PC resource updated'));
    } else {
      // Check for existing Claude Code resources on the server before creating a new one
      // This prevents duplicates when user reconfigures after deleting local config
      console.log(chalk.gray('Checking for existing Claude Code resources...'));
      const { resourceToReuse, allMatching } = await findExistingClaudeCodeResources(sdk);

      if (resourceToReuse) {
        const existingId: string = resourceToReuse.id || resourceToReuse._id;
        if (!existingId) {
          throw new Error('Found existing resource but could not extract ID');
        }
        resourceId = existingId;

        console.log(chalk.green('[+] Found existing Claude Code resource'));
        console.log(chalk.gray(`    Resource ID: ${existingId}`));
        console.log(chalk.gray(`    Name: ${resourceToReuse.name}`));

        // Warn about duplicates if more than one matching resource was found
        if (allMatching.length > 1) {
          console.log(chalk.yellow(`[!] Found ${allMatching.length} Claude Code resources for this PC`));
          console.log(chalk.yellow('    Using the most recent one. Consider cleaning up old resources.'));
        }

        // Save to local config
        setConfigValue('pcResourceId', existingId);

        // Update endpoint to current tunnel URL
        await sdk.resources.update({
          id: existingId,
          endpoint: {
            baseUrl: tunnelUrl,
            authentication: 'bearer',
            methods: toSDKMethods(getBasicResourceMethods()),
          },
        });

        console.log(chalk.green('\n[+] PC resource endpoint updated'));
      } else {
        // No existing resource found - create new resource with methods including examples
        const resource = await sdk.resources.create({
          name: pcName,
          description: `Claude Code on ${os.hostname()}`,
          resourceType: 'integration',
          category: 'development',
          isPrivate: true,
          endpoint: {
            baseUrl: tunnelUrl,
            authentication: 'bearer',
            methods: toSDKMethods(getBasicResourceMethods()),
          },
          pricing: { model: 'free' },
          openApiSpec: generateOpenAPISpec(),
        });

        // Save resource ID
        resourceId = resource.id;
        setConfigValue('pcResourceId', resourceId);

        console.log(chalk.green('\n[+] PC registered'));
        console.log(chalk.gray(`    resource_id: ${resourceId}`));
      }
    }

    if (!resourceId) {
      throw new Error('Failed to register or find resource');
    }

    // Install the resource for the user
    console.log(chalk.gray('\nInstalling resource...'));
    try {
      await sdk.resources.install(resourceId);
      console.log(chalk.green('[+] Resource installed'));
    } catch (e: any) {
      if (e.message?.includes('already installed')) {
        console.log(chalk.gray('    Already installed'));
      } else {
        console.log(chalk.yellow(`    Could not auto-install: ${e.message}`));
      }
    }

    // Configure authentication for the installation
    console.log(chalk.gray('\nConfiguring authentication...'));
    try {
      await sdk.resources.authenticate(resourceId, {
        type: 'bearer',
        credentials: { token: bridgeAuthToken },
      });
      console.log(chalk.green('[+] Authentication configured'));
    } catch (e: any) {
      console.log(chalk.yellow(`    Could not configure authentication: ${e.message}`));
    }

    console.log(chalk.green('\n[+] Registration complete'));
    console.log(chalk.gray(`    tunnel:    ${tunnelUrl}`));
  } finally {
    // Stop the temporary tunnel
    console.log(chalk.gray('\nStopping temporary tunnel...'));
    await stopTunnel();
  }
}
