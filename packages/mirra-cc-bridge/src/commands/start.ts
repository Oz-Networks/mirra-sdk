/**
 * Start command - launch the bridge HTTP server
 *
 * This server receives commands from the Mirra mobile app via the PC resource.
 * It manages Claude Code sessions and creates Flows for reply routing.
 */

import chalk from 'chalk';
import express, { Request, Response } from 'express';
import * as os from 'os';
import * as path from 'path';
import { MirraSDK } from '@mirra-messenger/sdk';
import {
  loadConfig,
  setConfigValue,
  storePermissionResponse,
  getOrCreateBridgeAuthToken,
  validateBridgeAuthToken,
  cleanupStaleSessionMemoryMappings,
} from '../config';
import { SessionManager } from '../session-manager';
import { SpawnSessionRequest, SendInputRequest, SessionResponse, RespondRequest, ResumeSessionRequest } from '../types';
import { startTunnel, stopTunnel, getTunnelUrl, getTunnelName } from '../tunnel';
import { getResourceMethods, toSDKMethods } from '../resource-methods';
import { listClaudeCodeSessions, ClaudeCodeSessionEntry } from '../claude-sessions';

interface StartOptions {
  port: string;
  tunnel?: boolean;
}

/**
 * Format a date as a relative time string (e.g., "2h ago", "3d ago")
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

let sessionManager: SessionManager;

// Cached router script ID (fetched once per bridge session)
let cachedRouterScriptId: string | undefined;

/**
 * Find the Claude Code Router system script
 * Uses listMarketplaceScripts with system filter to find it
 */
async function findClaudeCodeRouterScript(sdk: MirraSDK): Promise<string> {
  // Return cached ID if available
  if (cachedRouterScriptId) {
    return cachedRouterScriptId;
  }

  const sdkAny = sdk as any;

  // Search for the system script by name
  const result = await sdkAny.scripts.listMarketplaceScripts({
    name: 'Claude Code Router',
    system: true,
    limit: 1,
  });

  const scripts = result?.data?.scripts || result?.scripts || [];

  if (scripts.length === 0) {
    throw new Error(
      'Claude Code Router system script not found. Please ensure it is deployed.'
    );
  }

  // The script ID is in _id field
  const scriptId = scripts[0]._id || scripts[0].id;
  if (!scriptId) {
    throw new Error('Claude Code Router script found but has no ID');
  }

  cachedRouterScriptId = scriptId;
  console.log(chalk.gray(`  Found Claude Code Router script: ${scriptId}`));

  return scriptId;
}

/**
 * Create the Express app with routes
 */
function createApp(): express.Application {
  const app = express();
  app.use(express.json());

  // Health check (unauthenticated - needed for tunnel health checks)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Authentication middleware for all other routes
  // Validates the bearer token from resourceInstallation.authentication
  app.use((req: Request, res: Response, next) => {
    // Skip auth for health check (already handled above)
    if (req.path === '/health') {
      return next();
    }

    const authHeader = req.headers.authorization;

    // Check for bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(chalk.yellow(`[Auth] Missing or invalid Authorization header for ${req.method} ${req.path}`));
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Bearer token required. Ensure the resource installation has valid authentication configured.',
      });
      return;
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    if (!validateBridgeAuthToken(token)) {
      console.log(chalk.yellow(`[Auth] Invalid token for ${req.method} ${req.path}`));
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid bearer token.',
      });
      return;
    }

    next();
  });

  // List sessions
  app.get('/sessions', (_req: Request, res: Response) => {
    const sessions = sessionManager.listSessions();
    res.json(sessions);
  });

  // Spawn a new session
  app.post('/sessions', async (req: Request, res: Response) => {
    try {
      const body = req.body as SpawnSessionRequest;

      if (!body.initialPrompt) {
        res.status(400).json({ error: 'initialPrompt is required' });
        return;
      }

      const config = loadConfig();

      // GroupId resolution priority:
      // 1. Explicitly provided in request body (from calling context - e.g., the group where user sent the message)
      // 2. Context header from Mirra platform (x-mirra-group-id)
      // 3. Configured default groupId (fallback)
      const contextGroupId = req.headers['x-mirra-group-id'] as string | undefined;
      const groupId = body.groupId || contextGroupId || config?.groupId;

      if (!groupId) {
        res.status(400).json({
          error: 'groupId is required. Either provide it in the request, ensure the platform provides context, or run `mirra-cc-bridge configure` to set a default.'
        });
        return;
      }

      // Log which source the groupId came from for debugging
      const groupIdSource = body.groupId ? 'request' : (contextGroupId ? 'header' : 'config');
      console.log(chalk.gray(`[spawnSession] Using groupId from ${groupIdSource}: ${groupId.substring(0, 20)}...`));

      const workingDir = body.workingDir || config?.defaultWorkDir || process.cwd();

      const session = await sessionManager.spawnSession({
        workingDir,
        initialPrompt: body.initialPrompt,
        groupId,
      });

      // Build link data for the caller to use in the originating context
      const sessionName = path.basename(workingDir) || 'Claude Code';
      const linkData = {
        linkType: 'chat' as const,
        url: `myapp://chat/${groupId}`,
        label: `Claude Code - ${sessionName}`,
        description: 'View session responses',
        icon: 'terminal',
        entityRef: {
          groupId,
        },
      };

      const response: SessionResponse = {
        id: session.id,
        workingDir: session.workingDir,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
        flowId: session.flowId,
        link: linkData,
        // Include as structuredData for automatic propagation through execute_code
        structuredData: [{
          displayType: 'link',
          templateId: 'session_output_link',
          data: linkData,
        }],
      };

      console.log('[spawnSession] Response with structuredData:', JSON.stringify(response.structuredData, null, 2));
      res.status(201).json(response);
    } catch (error: any) {
      console.error(chalk.red('Error spawning session:'), error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Resume an existing Claude Code session
  app.post('/sessions/resume', async (req: Request, res: Response) => {
    try {
      const body = req.body as ResumeSessionRequest;

      if (!body.claudeSessionId) {
        res.status(400).json({ error: 'claudeSessionId is required' });
        return;
      }

      if (!body.prompt) {
        res.status(400).json({ error: 'prompt is required' });
        return;
      }

      const config = loadConfig();

      // GroupId resolution: request body → context header → config default
      const contextGroupId = req.headers['x-mirra-group-id'] as string | undefined;
      const groupId = body.groupId || contextGroupId || config?.groupId;

      if (!groupId) {
        res.status(400).json({
          error: 'groupId is required. Either provide it in the request, ensure the platform provides context, or run `mirra-cc-bridge configure` to set a default.'
        });
        return;
      }

      const session = await sessionManager.resumeExternalSession({
        claudeSessionId: body.claudeSessionId,
        prompt: body.prompt,
        groupId,
        workingDir: body.workingDir,
      });

      // Build link data
      const sessionName = path.basename(session.workingDir) || 'Claude Code';
      const linkData = {
        linkType: 'chat' as const,
        url: `myapp://chat/${groupId}`,
        label: `Claude Code - ${sessionName}`,
        description: 'View session responses',
        icon: 'terminal',
        entityRef: { groupId },
      };

      const response: SessionResponse = {
        id: session.id,
        workingDir: session.workingDir,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
        flowId: session.flowId,
        link: linkData,
        structuredData: [{
          displayType: 'link',
          templateId: 'session_output_link',
          data: linkData,
        }],
      };

      res.status(201).json(response);
    } catch (error: any) {
      console.error(chalk.red('Error resuming session:'), error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Get session details
  app.get('/sessions/:id', (req: Request, res: Response) => {
    const session = sessionManager.getSession(req.params.id);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const response: SessionResponse = {
      id: session.id,
      workingDir: session.workingDir,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      lastActivity: session.lastActivity.toISOString(),
      flowId: session.flowId,
    };

    res.json(response);
  });

  // Send input to a session
  app.post('/sessions/:id/input', async (req: Request, res: Response) => {
    try {
      const body = req.body as SendInputRequest;

      if (!body.input) {
        res.status(400).json({ error: 'input is required' });
        return;
      }

      await sessionManager.sendInput(req.params.id, body.input);
      res.json({ success: true });
    } catch (error: any) {
      // Check if this is a "session not found" error
      if (error.message?.includes('not found')) {
        res.status(404).json({
          error: error.message,
          suggestion: 'The session may have ended or expired. Create a new session with POST /sessions.',
          availableSessions: sessionManager.listSessions().map(s => ({
            id: s.id,
            status: s.status,
            workingDir: s.workingDir,
          })),
        });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Kill a session
  app.delete('/sessions/:id', async (req: Request, res: Response) => {
    try {
      await sessionManager.killSession(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  // List resumable Claude Code sessions (from ~/.claude/projects)
  app.get('/claude-sessions', (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const projectPath = req.query.projectPath as string | undefined;
      const search = req.query.search as string | undefined;

      const sessions = listClaudeCodeSessions({ limit, projectPath, search });

      // Format as structured data for mobile app
      const structuredData = {
        displayType: 'list' as const,
        templateId: 'claude_sessions_list',
        data: {
          items: sessions.map(s => ({
            id: s.id,
            title: s.summary,
            subtitle: `${s.projectName}${s.gitBranch ? ` (${s.gitBranch})` : ''} - ${s.messageCount} messages`,
            icon: 'terminal',
            badge: formatTimeAgo(new Date(s.modifiedAt)),
            badgeVariant: 'default' as const,
            metadata: {
              sessionId: s.id,
              projectPath: s.projectPath,
              projectName: s.projectName,
              gitBranch: s.gitBranch,
              messageCount: s.messageCount,
              createdAt: s.createdAt,
              modifiedAt: s.modifiedAt,
              firstPrompt: s.firstPrompt,
            },
          })),
        },
        interactions: {
          allowSelection: true,
          primaryAction: 'resume',
        },
      };

      res.json({
        sessions,
        structuredData: [structuredData],
      });
    } catch (error: any) {
      console.error(chalk.red('Error listing Claude Code sessions:'), error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Respond to a permission prompt
  // Called by Flow when user selects Allow/Deny in mobile app
  app.post('/respond', async (req: Request, res: Response) => {
    try {
      const body = req.body as RespondRequest;

      if (!body.sessionId) {
        res.status(400).json({ error: 'sessionId is required' });
        return;
      }

      if (!body.selection) {
        res.status(400).json({ error: 'selection is required' });
        return;
      }

      const { sessionId, selection } = body;

      // Map the selection to a permission response
      const action = selection.action || selection.id;
      if (!['allow', 'allow_always', 'deny'].includes(action)) {
        res.status(400).json({ error: `Invalid action: ${action}. Must be allow, allow_always, or deny` });
        return;
      }

      // Check if this is a local session (by checking if we have a matching managed session)
      const managedSession = sessionManager.getSession(sessionId);

      if (managedSession) {
        // Managed session - send response directly to pty
        await sessionManager.sendUserResponse(sessionId, {
          sessionId,
          action: action as 'allow' | 'allow_always' | 'deny',
          tool: selection.metadata?.tool,
          command: selection.metadata?.command,
          filePath: selection.metadata?.filePath,
        });
        console.log(chalk.gray(`[Managed Session ${sessionId}] Permission response: ${action}`));
      } else {
        // Local session - store response for hook polling
        const requestId = selection.metadata?.requestId;
        if (requestId) {
          const stored = storePermissionResponse(requestId, action as 'allow' | 'allow_always' | 'deny');
          if (stored) {
            console.log(chalk.gray(`[Local Session ${sessionId}] Permission response stored: ${action} (requestId: ${requestId})`));
          } else {
            console.log(chalk.yellow(`[Local Session ${sessionId}] Could not store response - request not found or expired`));
            res.status(404).json({ error: 'Permission request not found or expired' });
            return;
          }
        } else {
          console.log(chalk.yellow(`[Local Session ${sessionId}] No requestId provided - cannot route response`));
          res.status(400).json({ error: 'requestId is required for local session responses' });
          return;
        }
      }

      res.json({ success: true, action });
    } catch (error: any) {
      console.error(chalk.red('Error responding to permission prompt:'), error.message);
      res.status(500).json({ error: error.message });
    }
  });

  return app;
}

/**
 * Update the resource endpoint with a new tunnel URL
 */
async function updateResourceEndpoint(
  sdk: MirraSDK,
  resourceId: string,
  tunnelUrl: string
): Promise<void> {
  try {
    await sdk.resources.update({
      id: resourceId,
      endpoint: {
        baseUrl: tunnelUrl,
        authentication: 'bearer',
        methods: toSDKMethods(getResourceMethods()),
      },
    });
    console.log(chalk.green('[+] Resource endpoint updated'));
  } catch (error: any) {
    console.log(chalk.yellow(`[!] Could not update resource endpoint: ${error.message}`));
  }
}

/**
 * Ensure the resource installation has the current auth token configured
 */
async function ensureAuthenticationConfigured(
  sdk: MirraSDK,
  resourceId: string
): Promise<void> {
  const bridgeAuthToken = getOrCreateBridgeAuthToken();

  try {
    await sdk.resources.authenticate(resourceId, {
      type: 'bearer',
      credentials: { token: bridgeAuthToken },
    });
    console.log(chalk.green('[+] Resource authentication verified'));
  } catch (error: any) {
    console.log(chalk.yellow(`[!] Could not update authentication: ${error.message}`));
  }
}

/**
 * Validate that all required setup is complete (basic config check)
 */
function validateBasicSetup(config: ReturnType<typeof loadConfig>): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!config?.apiKey) {
    missing.push('API key not configured');
  }

  return { valid: missing.length === 0, missing };
}

/**
 * Verify the PC resource exists on the server
 * Returns the resource if it exists, null otherwise
 */
async function verifyResourceExists(sdk: MirraSDK, resourceId: string): Promise<any | null> {
  try {
    const resource = await sdk.resources.get(resourceId);
    return resource;
  } catch (error: any) {
    // Resource doesn't exist or access denied
    console.log(chalk.yellow(`  [!] Resource ${resourceId} not found on server`));
    return null;
  }
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
 * Check if the resource is installed for the user
 */
async function verifyResourceInstalled(sdk: MirraSDK, resourceId: string): Promise<boolean> {
  try {
    // Use the installations list endpoint to check
    const sdkAny = sdk as any;
    const result = await sdkAny.resources.call({
      resourceId: 'resources',
      method: 'checkInstallation',
      params: { resourceId },
    });
    return result?.data?.installed === true;
  } catch {
    // If we can't check, try to install
    return false;
  }
}

/**
 * Ensure the resource is installed for the user
 */
async function ensureResourceInstalled(sdk: MirraSDK, resourceId: string): Promise<boolean> {
  try {
    await sdk.resources.install(resourceId);
    console.log(chalk.green('  [+] Resource installed'));
    return true;
  } catch (error: any) {
    if (error.message?.includes('already installed')) {
      return true;
    }
    console.log(chalk.yellow(`  [!] Could not install resource: ${error.message}`));
    return false;
  }
}

/**
 * Generate OpenAPI spec for the PC resource
 */
function generateOpenAPISpec(tunnelUrl: string): object {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Mirra Claude Code Bridge',
      version: '1.0.0',
      description: 'Control Claude Code sessions on a local PC',
    },
    servers: [{ url: tunnelUrl }],
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
                  schema: { type: 'array' },
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
                  required: ['initialPrompt'],
                  properties: {
                    workingDir: { type: 'string' },
                    initialPrompt: { type: 'string' },
                    groupId: { type: 'string', required: false, description: 'Target group ID. Falls back to bridge configured default.' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Session created' },
          },
        },
      },
      '/sessions/resume': {
        post: {
          operationId: 'resumeSession',
          summary: 'Resume an existing Claude Code session',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['claudeSessionId', 'prompt'],
                  properties: {
                    claudeSessionId: { type: 'string', description: 'Session UUID from GET /claude-sessions' },
                    prompt: { type: 'string', description: 'What to work on next' },
                    groupId: { type: 'string', description: 'Target group ID. Falls back to bridge configured default.' },
                    workingDir: { type: 'string', description: 'Project directory (from session metadata.projectPath)' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Session resumed' },
          },
        },
      },
      '/sessions/{sessionId}': {
        delete: {
          operationId: 'killSession',
          summary: 'Kill a session',
          parameters: [
            { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } },
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
            { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['input'],
                  properties: { input: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Input sent' },
          },
        },
      },
      '/claude-sessions': {
        get: {
          operationId: 'listClaudeCodeSessions',
          summary: 'List resumable Claude Code sessions',
          parameters: [
            { name: 'limit', in: 'query', required: false, schema: { type: 'number' } },
            { name: 'projectPath', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'List of resumable sessions with structured data for mobile rendering',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      sessions: { type: 'array' },
                      structuredData: { type: 'array' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/respond': {
        post: {
          operationId: 'respond',
          summary: 'Respond to a permission prompt',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['sessionId', 'selection'],
                  properties: {
                    sessionId: { type: 'string' },
                    selection: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Response sent' },
          },
        },
      },
    },
  };
}

/**
 * Auto-register this PC as a Mirra resource if not already registered
 * This enables users to call spawnSession from Mirra to start sessions on this PC
 *
 * IMPORTANT: This function checks for existing Claude Code resources on the server
 * before creating a new one. This prevents duplicate resources when users reconfigure
 * the bridge after deleting their local config.
 */
async function autoRegisterIfNeeded(
  sdk: MirraSDK,
  tunnelUrl: string
): Promise<string | undefined> {
  const config = loadConfig();

  // Already registered - just update the endpoint
  if (config?.pcResourceId) {
    return config.pcResourceId;
  }

  console.log(chalk.gray('Checking for existing Claude Code resources...'));

  // Check for existing Claude Code resources before creating a new one
  // This prevents duplicates when user reconfigures after deleting local config
  const { resourceToReuse, allMatching } = await findExistingClaudeCodeResources(sdk);

  if (resourceToReuse) {
    const resourceId = resourceToReuse.id || resourceToReuse._id;

    console.log(chalk.green('  [+] Found existing Claude Code resource'));
    console.log(chalk.gray(`      Resource ID: ${resourceId}`));
    console.log(chalk.gray(`      Name: ${resourceToReuse.name}`));

    // Warn about duplicates if more than one matching resource was found
    if (allMatching.length > 1) {
      console.log(chalk.yellow(`  [!] Found ${allMatching.length} Claude Code resources for this PC`));
      console.log(chalk.yellow('      Using the most recent one. Consider cleaning up old resources.'));
      console.log(chalk.gray('      Duplicate resource IDs:'));
      for (const r of allMatching.slice(1)) {
        console.log(chalk.gray(`        - ${r.id || r._id} (${r.name})`));
      }
    }

    // Save resource ID to local config
    setConfigValue('pcResourceId', resourceId);

    // Update endpoint to current tunnel URL
    try {
      await sdk.resources.update({
        id: resourceId,
        endpoint: {
          baseUrl: tunnelUrl,
          authentication: 'bearer',
          methods: toSDKMethods(getResourceMethods()),
        },
      });
      console.log(chalk.green('  [+] Resource endpoint updated'));
    } catch (e: any) {
      console.log(chalk.yellow(`  [!] Could not update endpoint: ${e.message}`));
    }

    // Get or create the bridge auth token and update authentication
    const bridgeAuthToken = getOrCreateBridgeAuthToken();

    // Ensure the resource is installed
    try {
      await sdk.resources.install(resourceId);
      console.log(chalk.green('  [+] Resource installation verified'));
    } catch (e: any) {
      if (!e.message?.includes('already installed')) {
        console.log(chalk.yellow(`  [!] Could not verify installation: ${e.message}`));
      }
    }

    // Update authentication with current token
    try {
      await sdk.resources.authenticate(resourceId, {
        type: 'bearer',
        credentials: { token: bridgeAuthToken },
      });
      console.log(chalk.green('  [+] Resource authentication updated'));
    } catch (e: any) {
      console.log(chalk.yellow(`  [!] Could not update authentication: ${e.message}`));
    }

    return resourceId;
  }

  // No existing resource found - create a new one
  console.log(chalk.gray('No existing resource found. Auto-registering PC as Mirra resource...'));

  try {
    const pcName = `${os.hostname()} - Claude Code`;

    // Get or create the bridge auth token
    const bridgeAuthToken = getOrCreateBridgeAuthToken();

    // Create new resource with all required fields and examples
    const resource = await sdk.resources.create({
      name: pcName,
      description: `Claude Code on ${os.hostname()}. Allows remote control of Claude Code sessions.`,
      resourceType: 'integration',
      category: 'development',
      isPrivate: true,
      endpoint: {
        baseUrl: tunnelUrl,
        authentication: 'bearer',
        methods: toSDKMethods(getResourceMethods()),
      },
      pricing: { model: 'free' },
      openApiSpec: generateOpenAPISpec(tunnelUrl),
    });

    // Extract the resource ID from the response
    // The SDK returns a Resource object with an id field
    const resourceId = (resource as any)?.id || (resource as any)?._id;

    if (!resourceId) {
      console.log(chalk.yellow('  [!] Resource created but no ID returned'));
      console.log(chalk.gray('      Response:'), JSON.stringify(resource, null, 2));
      return undefined;
    }

    // Save resource ID
    setConfigValue('pcResourceId', resourceId);

    console.log(chalk.green('  [+] PC registered as Mirra resource'));
    console.log(chalk.gray(`      Resource ID: ${resourceId}`));

    // Auto-install the resource for the user
    try {
      await sdk.resources.install(resourceId);
      console.log(chalk.green('  [+] Resource auto-installed'));
    } catch (e: any) {
      if (e.message?.includes('already installed')) {
        // Already installed - fine
      } else {
        console.log(chalk.yellow(`  [!] Could not auto-install: ${e.message}`));
      }
    }

    // Authenticate the installation with the bearer token
    try {
      await sdk.resources.authenticate(resourceId, {
        type: 'bearer',
        credentials: { token: bridgeAuthToken },
      });
      console.log(chalk.green('  [+] Resource authentication configured'));
    } catch (e: any) {
      console.log(chalk.yellow(`  [!] Could not configure authentication: ${e.message}`));
    }

    return resourceId;
  } catch (error: any) {
    console.log(chalk.yellow(`  [!] Auto-registration failed: ${error.message}`));
    if (error.response?.data) {
      console.log(chalk.gray('      Server response:'), JSON.stringify(error.response.data, null, 2));
    }
    console.log(chalk.gray('      You can manually register with: mirra-cc-bridge register'));
    return undefined;
  }
}

/**
 * Start the bridge server
 */
export async function startServer(options: StartOptions): Promise<void> {
  const port = parseInt(options.port, 10);
  let config = loadConfig();

  // Register global error handlers early to catch any unexpected async errors during startup
  process.on('uncaughtException', (error) => {
    console.error(chalk.red('[!] Uncaught exception:'), error.message);
    console.error(chalk.gray('    Stack:'), error.stack?.split('\n').slice(0, 3).join('\n    '));
  });

  process.on('unhandledRejection', (reason: any) => {
    console.error(chalk.red('[!] Unhandled promise rejection:'), reason?.message || reason);
    if (reason?.stack) {
      console.error(chalk.gray('    Stack:'), reason.stack.split('\n').slice(0, 3).join('\n    '));
    }
  });

  // ============================================================================
  // GATE 1: Basic Config Validation
  // ============================================================================
  console.log(chalk.gray('Validating configuration...'));

  const { valid, missing } = validateBasicSetup(config);

  if (!valid) {
    console.error(chalk.red.bold('\nSetup incomplete. Cannot start bridge.\n'));
    console.log(chalk.bold('Missing requirements:'));
    for (const item of missing) {
      console.log(chalk.yellow(`  [-] ${item}`));
    }
    console.log(chalk.gray('\nRun the setup wizard to configure everything:'));
    console.log(chalk.white('  mirra-cc-bridge setup\n'));
    console.log(chalk.gray('Or configure individual components:'));
    console.log(chalk.gray('  mirra-cc-bridge configure    - Set API key'));
    console.log(chalk.gray('  mirra-cc-bridge setup-hooks  - Configure Claude Code hooks'));
    console.log(chalk.gray('  mirra-cc-bridge register     - Register PC as Mirra resource\n'));
    process.exit(1);
  }

  let sdk: MirraSDK;
  try {
    sdk = new MirraSDK({ apiKey: config!.apiKey! });
  } catch (error: any) {
    console.error(chalk.red(`\nFailed to initialize SDK: ${error.message}`));
    console.log(chalk.gray('Your API key may be invalid. Try reconfiguring:'));
    console.log(chalk.white('  mirra-cc-bridge configure\n'));
    process.exit(1);
  }

  // ============================================================================
  // GATE 2: Start Tunnel (required for resource registration)
  // ============================================================================
  // Generate a tunnel name based on hostname for multi-tunnel identification
  const tunnelDisplayName = `${os.hostname()} - Claude Code`;
  console.log(chalk.gray(`Starting tunnel as "${tunnelDisplayName}"...`));

  let tunnelUrl: string | null = null;
  try {
    tunnelUrl = await startTunnel({ port, name: tunnelDisplayName });
  } catch (error: any) {
    console.error(chalk.red(`\nFailed to start tunnel: ${error.message}`));
    console.log(chalk.gray('The tunnel is required for the bridge to work.'));
    console.log(chalk.gray('Please check your network connection and try again.\n'));
    process.exit(1);
  }

  // ============================================================================
  // GATE 3: Verify/Create PC Resource
  // ============================================================================
  console.log(chalk.gray('Verifying PC resource...'));

  let pcResourceId = config!.pcResourceId;
  let resourceExists = false;

  // Check if resource ID in config actually exists on server
  if (pcResourceId) {
    const existingResource = await verifyResourceExists(sdk, pcResourceId);
    if (existingResource) {
      resourceExists = true;
      console.log(chalk.green('  [+] Resource verified on server'));
    } else {
      // Resource ID in config is stale - clear it
      console.log(chalk.yellow('  [!] Stale resource ID in config - will create new resource'));
      setConfigValue('pcResourceId', undefined as any);
      pcResourceId = undefined;
    }
  }

  // Create resource if it doesn't exist
  if (!pcResourceId) {
    pcResourceId = await autoRegisterIfNeeded(sdk, tunnelUrl);
    if (pcResourceId) {
      resourceExists = true;
    }
  }

  // GATE: Cannot proceed without a valid resource
  if (!pcResourceId || !resourceExists) {
    console.error(chalk.red.bold('\nFailed to create PC resource. Cannot start bridge.\n'));
    console.log(chalk.gray('Try running: mirra-cc-bridge register'));
    await stopTunnel();
    process.exit(1);
  }

  // ============================================================================
  // GATE 4: Ensure Resource is Installed
  // ============================================================================
  console.log(chalk.gray('Verifying resource installation...'));

  const installed = await ensureResourceInstalled(sdk, pcResourceId);
  if (!installed) {
    console.error(chalk.red.bold('\nFailed to install resource. Cannot start bridge.\n'));
    await stopTunnel();
    process.exit(1);
  }

  // ============================================================================
  // GATE 5: Update Resource Endpoint with Tunnel URL
  // ============================================================================
  console.log(chalk.gray('Updating resource endpoint...'));
  await updateResourceEndpoint(sdk, pcResourceId, tunnelUrl);

  // ============================================================================
  // GATE 6: Ensure Authentication is Configured
  // ============================================================================
  console.log(chalk.gray('Verifying authentication...'));
  await ensureAuthenticationConfigured(sdk, pcResourceId);

  // Reload config to get updated values
  config = loadConfig();

  // Initialize session manager with API key and PC resource ID
  // SessionManager creates per-session Flows for remotely spawned sessions
  sessionManager = new SessionManager(config!.apiKey!, pcResourceId);

  // Clean up stale memory note mappings (older than 30 days)
  const removedMappings = cleanupStaleSessionMemoryMappings();
  if (removedMappings > 0) {
    console.log(chalk.gray(`  Cleaned up ${removedMappings} stale session memory mappings`));
  }

  // Create and start Express app
  const app = createApp();

  const server = app.listen(port, () => {
    console.log(chalk.green('[+]') + ` Server listening on port ${port}`);
    console.log(chalk.gray(`    Local:  http://localhost:${port}`));
    if (tunnelUrl) {
      console.log(chalk.gray(`    Tunnel: ${tunnelUrl}`));
    }
  });

  // Save port to config
  setConfigValue('server', { port });

  // Log endpoints
  console.log(chalk.gray('\nEndpoints:'));
  console.log(chalk.gray('  GET  /health             health check'));
  console.log(chalk.gray('  GET  /sessions           list active sessions'));
  console.log(chalk.gray('  POST /sessions           spawn session'));
  console.log(chalk.gray('  POST /sessions/resume    resume existing CC session'));
  console.log(chalk.gray('  GET  /sessions/:id       get session'));
  console.log(chalk.gray('  POST /sessions/:id/input send input'));
  console.log(chalk.gray('  DELETE /sessions/:id     kill session'));
  console.log(chalk.gray('  GET  /claude-sessions    list resumable CC sessions'));
  console.log(chalk.gray('  POST /respond            respond to permission prompt'));

  // Show connection status
  console.log(chalk.bold('\nConnection Status:'));
  console.log(chalk.green('  [+] Hooks configured') + chalk.gray(' - Claude Code output syncs to Mirra'));
  console.log(chalk.green('  [+] Tunnel connected') + chalk.gray(` - ${tunnelUrl}`));
  if (pcResourceId) {
    console.log(chalk.green('  [+] PC registered') + chalk.gray(' - Can spawn sessions and receive replies from Mirra'));
  } else {
    console.log(chalk.yellow('  [-] PC not registered') + chalk.gray(' - Remote spawn disabled'));
  }

  console.log(chalk.green.bold('\n> Ready'));
  if (pcResourceId) {
    console.log(chalk.gray('  Two-way communication enabled for remotely spawned sessions'));
  } else {
    console.log(chalk.gray('  One-way sync enabled (Claude Code → Mirra)'));
  }
  console.log(chalk.gray('  Ctrl+C to stop\n'));

  // Handle shutdown
  const shutdown = async () => {
    console.log(chalk.gray('\n\nShutting down...'));

    // Stop tunnel first
    if (getTunnelUrl()) {
      await stopTunnel();
    }

    // Kill all managed sessions (this also cleans up their Flows)
    await sessionManager.killAllSessions();

    server.close(() => {
      console.log(chalk.green('[+] Server stopped'));
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
