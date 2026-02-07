/**
 * Session Manager - manages Claude Code terminal sessions
 *
 * Handles the full lifecycle including:
 * - Spawning Claude Code processes
 * - Creating Flow automations for reply routing
 * - Cleaning up Flows when sessions end
 */

import { spawn, ChildProcess, execSync } from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { MirraSDK } from '@mirra-messenger/sdk';
import { Session, SessionResponse, PermissionResponse, ResumeSessionRequest } from './types';
import { loadConfig, cleanupSessionProgress, registerActiveRemoteSession, cleanupActiveRemoteSession, updateActiveRemoteSession, storeSessionMemoryMapping, getSessionMemoryMapping, touchSessionMemoryMapping } from './config';

// Note: Progress polling is now handled in the hook (post-tool event)
// instead of using setInterval, which doesn't work reliably in CC's environment.
// See commands/hook.ts handlePostToolUse() for the implementation.

/**
 * Expand ~ to home directory and resolve the path
 */
function expandPath(inputPath: string): string {
  if (inputPath.startsWith('~/')) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  if (inputPath === '~') {
    return os.homedir();
  }
  return path.resolve(inputPath);
}

/**
 * Find the claude binary path
 * Returns the full path to the claude executable
 */
function findClaudePath(): string {
  try {
    const claudePath = execSync('which claude', { encoding: 'utf-8' }).trim();
    if (claudePath && fs.existsSync(claudePath)) {
      return claudePath;
    }
  } catch {
    // which failed, try common locations
  }

  // Check common installation locations
  const commonPaths = [
    path.join(os.homedir(), '.local', 'bin', 'claude'),
    '/usr/local/bin/claude',
    '/usr/bin/claude',
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fall back to just 'claude' and hope it's in PATH
  return 'claude';
}

// Cache the claude path
const CLAUDE_PATH = findClaudePath();
console.log(`[SessionManager] CLAUDE_PATH resolved to: ${CLAUDE_PATH}`);

// Try to load node-pty, fall back to child_process if not available
let pty: any = null;
try {
  pty = require('node-pty');
  console.log('[SessionManager] node-pty loaded successfully');
} catch (e: any) {
  console.log('[SessionManager] node-pty not available, using child_process:', e.message);
  // node-pty not available, will use child_process
}

interface SpawnOptions {
  workingDir: string;
  initialPrompt: string;
  groupId: string;
}

/**
 * System instructions for remote/headless Claude Code sessions
 * These tell Claude to avoid interactive tools that don't work without a terminal
 */
const REMOTE_SESSION_INSTRUCTIONS = `
IMPORTANT: You are running in a REMOTE/HEADLESS mode via Mirra mobile app.
The following tools are NOT available and should NOT be used:
- AskUserQuestion: Cannot prompt for user input - just proceed with reasonable defaults or state your assumptions
- EnterPlanMode/ExitPlanMode: Plan mode is not supported - work incrementally instead

Instead of asking questions, make reasonable assumptions and proceed. If you need clarification, include your assumptions in your response text and the user can correct you.
`.trim();

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private sdk: MirraSDK;
  private apiKey: string;
  private maxSessions: number = 5;
  private pcResourceId?: string;
  private routerScriptId?: string;
  private routerScriptIdPromise?: Promise<string>;

  constructor(apiKey: string, pcResourceId?: string) {
    this.apiKey = apiKey;
    this.pcResourceId = pcResourceId;
    this.sdk = new MirraSDK({ apiKey });
  }

  /**
   * Get the Claude Code router script ID from the server
   * Uses listMarketplaceScripts with system filter to find it
   * Caches the result for subsequent calls
   */
  private async getRouterScriptId(): Promise<string> {
    // Return cached script ID if available
    if (this.routerScriptId) {
      return this.routerScriptId;
    }

    // If a fetch is already in progress, wait for it
    if (this.routerScriptIdPromise) {
      return this.routerScriptIdPromise;
    }

    // Fetch the script ID from the server
    this.routerScriptIdPromise = (async () => {
      try {
        const sdkAny = this.sdk as any;

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

        this.routerScriptId = scriptId;
        console.log(`Found Claude Code router script: ${scriptId}`);
        return scriptId;
      } finally {
        this.routerScriptIdPromise = undefined;
      }
    })();

    return this.routerScriptIdPromise;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `cc_session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Create a Flow for routing replies back to this session
   */
  private async createSessionFlow(
    sessionId: string,
    groupId: string
  ): Promise<string | undefined> {
    try {
      // Get pcResourceId from config if not provided
      const resourceId = this.pcResourceId || loadConfig()?.pcResourceId;

      if (!resourceId) {
        console.warn(
          'No pcResourceId configured - Flow-based routing will not work. ' +
            'Run `mirra-cc-bridge register` to register this PC as a resource.'
        );
        return undefined;
      }

      // Get the router script ID from the server
      const routerScriptId = await this.getRouterScriptId();

      const flowResult = await this.sdk.flows.createEventFlow({
        title: `Claude Code Session ${sessionId}`,
        description: 'Routes mobile replies to Claude Code terminal',
        status: 'active',
        trigger: {
          type: 'event',
          eventType: 'mirra.message',
          source: 'mirra',
          config: {
            rootCondition: {
              operator: 'and',
              conditions: [
                {
                  // Event type condition for rule matching and UI grouping
                  field: 'type',
                  operator: 'equals',
                  value: 'mirra.message',
                },
                {
                  // Match replies to messages from this session
                  // Note: automationSessionId is directly on replyTo in the event structure
                  field: 'mirra.replyTo.automation.sessionId',
                  operator: 'equals',
                  value: sessionId,
                },
                {
                  // Only in the specified group
                  field: 'mirra.groupId',
                  operator: 'equals',
                  value: groupId,
                },
              ],
            },
          },
        },
        scriptId: routerScriptId,
        scriptInput: {
          sessionId,
          pcResourceId: resourceId,
        },
      });

      // Extract flow ID from SDK response (nested in data)
      const flowId = (flowResult as any).data?.id || (flowResult as any).data?.flowId || (flowResult as any).id;

      console.log(`Created routing Flow ${flowId} for session ${sessionId}`);
      return flowId;
    } catch (error) {
      console.error('Failed to create session Flow:', error);
      // Don't fail the session spawn - Flow routing is optional
      return undefined;
    }
  }

  /**
   * Delete the Flow for a session
   */
  private async deleteSessionFlow(flowId: string): Promise<void> {
    try {
      await (this.sdk as any).flows.deleteFlow({ id: flowId });
      console.log(`Deleted routing Flow ${flowId}`);
    } catch (error: any) {
      console.error(`Failed to delete Flow ${flowId}:`, error.message);
    }
  }

  /**
   * Send Claude's output directly to Mirra
   * This is a fallback when hooks aren't working
   */
  private async sendOutputToMirra(
    sessionId: string,
    content: string,
    workingDir: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const sdkAny = this.sdk as any;

    // Format the message with session context
    const sessionName = path.basename(workingDir) || 'Claude Code';
    const formattedContent = `[${sessionName}] ${content}`;

    await sdkAny.mirraMessaging.sendMessage({
      groupId: session.groupId,
      content: formattedContent,
      automation: {
        source: 'claude-code',
        flowTitle: 'Claude Code',
        isAutomated: true,
        sessionId,
        sessionName,
      },
    });

    console.log(`[Session ${sessionId}] Sent output to Mirra (${content.length} chars)`);
  }

  /**
   * Send a session status message to Mirra
   * Used for immediate feedback when sessions start/stop
   * Returns the messageId for subsequent updates
   */
  private async sendSessionStatus(
    sessionId: string,
    groupId: string,
    status: 'starting' | 'running' | 'stopped' | 'error',
    workingDir: string,
    message?: string,
    existingMessageId?: string
  ): Promise<string | undefined> {
    try {
      const sdkAny = this.sdk as any;
      const sessionName = path.basename(workingDir) || 'Claude Code';

      const statusMessages: Record<string, string> = {
        starting: `Starting Claude Code session in \`${sessionName}\`...`,
        running: `Claude Code session active in \`${sessionName}\``,
        stopped: `Claude Code session ended`,
        error: `Claude Code session error: ${message || 'Unknown error'}`,
      };

      const content = message || statusMessages[status];

      // If we have an existing messageId, update the message instead of sending a new one
      if (existingMessageId) {
        await sdkAny.mirraMessaging.updateMessage({
          messageId: existingMessageId,
          content,
        });
        console.log(`[Session ${sessionId}] Updated status message: ${status}`);
        return existingMessageId;
      }

      // Otherwise, send a new message and capture the messageId
      // Note: Link data is returned from spawnSession for the caller to use
      // in the originating context (not here, since this message goes to the output group)
      const result = await sdkAny.mirraMessaging.sendMessage({
        groupId,
        content,
        automation: {
          source: 'claude-code',
          flowTitle: 'Claude Code',
          isAutomated: true,
          sessionId,
          sessionName,
        },
      });

      // Extract messageId from result
      const messageId = result?.data?.messageId || result?.messageId;
      console.log(`[Session ${sessionId}] Sent status: ${status}${messageId ? ` (messageId: ${messageId})` : ''}`);
      return messageId;
    } catch (error: any) {
      console.error(`[Session ${sessionId}] Failed to send status:`, error.message);
      // Don't throw - status messages are informational only
      return undefined;
    }
  }

  /**
   * Build the markdown content for a memory note activity entry
   */
  private buildMemoryNoteEntry(
    event: 'created' | 'resumed' | 'completed',
    text: string
  ): string {
    const timestamp = new Date().toISOString();
    const label = event.charAt(0).toUpperCase() + event.slice(1);
    const truncated = text.length > 500 ? text.substring(0, 497) + '...' : text;
    return `---\n**${label}** (${timestamp})\n${truncated}\n`;
  }

  /**
   * Create or update a memory note for a Claude Code session
   * Stores a rolling activity log in the group's knowledge graph
   */
  private async createOrUpdateMemoryNote(
    session: Session,
    text: string,
    event: 'created' | 'resumed' | 'completed'
  ): Promise<void> {
    if (!session.claudeSessionId) return;

    try {
      const sdkAny = this.sdk as any;
      const projectName = path.basename(session.workingDir) || 'Claude Code';
      const newEntry = this.buildMemoryNoteEntry(event, text);

      // Check for existing mapping
      const existing = getSessionMemoryMapping(session.claudeSessionId);

      if (existing) {
        // Append to existing note
        try {
          const note = await sdkAny.memory.findOne({ filters: { id: existing.memoryNoteId } });
          const currentContent = note?.data?.content || note?.content || '';
          const updatedContent = currentContent + '\n' + newEntry;

          await sdkAny.memory.update({
            id: existing.memoryNoteId,
            content: updatedContent,
            metadata: {
              source: 'claude-code-bridge',
              claudeSessionId: session.claudeSessionId,
              projectName,
              workingDir: session.workingDir,
              groupId: session.groupId,
              lastEvent: event,
              lastEventAt: new Date().toISOString(),
            },
          });

          touchSessionMemoryMapping(session.claudeSessionId);
          console.log(`[Session ${session.id}] Updated memory note ${existing.memoryNoteId} (${event})`);
        } catch (findError: any) {
          // Note may have been deleted — create a new one
          console.log(`[Session ${session.id}] Existing note not found, creating new one: ${findError.message}`);
          await this.createNewMemoryNote(session, projectName, newEntry, event);
        }
      } else {
        // Create new note
        await this.createNewMemoryNote(session, projectName, newEntry, event);
      }
    } catch (error: any) {
      // Memory notes are best-effort, don't fail the session
      console.error(`[Session ${session.id}] Failed to create/update memory note:`, error.message);
    }
  }

  /**
   * Create a new memory note and store its mapping
   */
  private async createNewMemoryNote(
    session: Session,
    projectName: string,
    initialEntry: string,
    event: 'created' | 'resumed' | 'completed'
  ): Promise<void> {
    const sdkAny = this.sdk as any;

    const header = [
      `# Claude Code Session: ${projectName}`,
      '',
      `**Session ID:** ${session.claudeSessionId}`,
      `**Project:** ${projectName}`,
      `**Directory:** ${session.workingDir}`,
      '',
      '## Activity Log',
      '',
    ].join('\n');

    const content = header + initialEntry;

    const result = await sdkAny.memory.create({
      type: 'note',
      content,
      metadata: {
        source: 'claude-code-bridge',
        claudeSessionId: session.claudeSessionId,
        projectName,
        workingDir: session.workingDir,
        groupId: session.groupId,
        lastEvent: event,
        lastEventAt: new Date().toISOString(),
      },
      graphId: session.groupId,
    });

    const noteId = result?.data?.id || result?.id;
    if (noteId) {
      const now = new Date().toISOString();
      storeSessionMemoryMapping({
        claudeSessionId: session.claudeSessionId!,
        memoryNoteId: noteId,
        groupId: session.groupId,
        projectName,
        workingDir: session.workingDir,
        createdAt: now,
        lastUpdatedAt: now,
      });
      console.log(`[Session ${session.id}] Created memory note ${noteId}`);
    }
  }

  /**
   * Resume an existing Claude Code session from the sessions list
   * "Adopts" a pre-existing CC session into the bridge's managed pool
   */
  async resumeExternalSession(request: ResumeSessionRequest): Promise<Session> {
    if (this.sessions.size >= this.maxSessions) {
      throw new Error(
        `Maximum sessions (${this.maxSessions}) reached. Kill an existing session first.`
      );
    }

    const config = loadConfig();
    const groupId = request.groupId || config?.groupId;
    if (!groupId) {
      throw new Error('groupId is required — provide it in the request or configure a default');
    }

    const workingDir = expandPath(request.workingDir || config?.defaultWorkDir || process.cwd());

    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir, { recursive: true });
      console.log(`Created working directory: ${workingDir}`);
    }

    const sessionId = this.generateSessionId();

    // Create routing Flow
    const flowId = await this.createSessionFlow(sessionId, groupId);

    const session: Session = {
      id: sessionId,
      workingDir,
      status: 'starting',
      createdAt: new Date(),
      lastActivity: new Date(),
      groupId,
      flowId,
      claudeSessionId: request.claudeSessionId,  // Known upfront (unlike spawnSession)
    };

    this.sessions.set(sessionId, session);

    // Send immediate status
    const messageId = await this.sendSessionStatus(sessionId, groupId, 'starting', workingDir,
      `Resuming Claude Code session in \`${path.basename(workingDir)}\`...`
    );
    if (messageId) {
      session.messageId = messageId;
    }

    // Register active session marker
    registerActiveRemoteSession({
      sessionId,
      groupId,
      apiKey: this.apiKey,
      messageId,
      workingDir,
      createdAt: new Date().toISOString(),
    });

    try {
      const env = {
        ...process.env,
        MIRRA_API_KEY: this.apiKey,
        MIRRA_GROUP_ID: groupId,
        MIRRA_SESSION_ID: sessionId,
        ...(messageId && { MIRRA_SESSION_MESSAGE_ID: messageId }),
      };

      const fullPrompt = `${REMOTE_SESSION_INSTRUCTIONS}\n\n---\n\nUser request: ${request.prompt}`;

      const args = [
        '-p',
        '--output-format', 'json',
        '--resume', request.claudeSessionId,
        fullPrompt,
      ];

      console.log(`[Session ${sessionId}] Resuming Claude session ${request.claudeSessionId.substring(0, 8)}... in ${workingDir}`);

      const childProcess = spawn(CLAUDE_PATH, args, {
        cwd: workingDir,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      console.log(`[Session ${sessionId}] Claude started (PID: ${childProcess.pid})`);
      session.pty = childProcess;
      session.status = 'running';

      // Create/update memory note for the resume
      this.createOrUpdateMemoryNote(session, request.prompt, 'resumed').catch(() => {});

      let stdoutBuffer = '';
      childProcess.stdout?.on('data', (data) => {
        session.lastActivity = new Date();
        stdoutBuffer += data.toString();
      });

      childProcess.stderr?.on('data', (data) => {
        session.lastActivity = new Date();
        console.error(`[Session ${sessionId}] stderr:`, data.toString().substring(0, 300));
      });

      childProcess.on('exit', async (code) => {
        console.log(`[Session ${sessionId}] Claude exited (code: ${code})`);

        let resultText = '';
        try {
          const result = JSON.parse(stdoutBuffer);
          if (result.session_id && result.session_id !== session.claudeSessionId) {
            session.claudeSessionId = result.session_id;
          }
          resultText = result.result || '';
        } catch {
          resultText = stdoutBuffer.trim();
        }

        // Send output to Mirra
        if (resultText) {
          try {
            await this.sendOutputToMirra(sessionId, resultText, workingDir);
          } catch (error: any) {
            console.error(`[Session ${sessionId}] Failed to send output:`, error.message);
          }
        }

        // Update memory note with result
        if (resultText) {
          this.createOrUpdateMemoryNote(session, resultText, 'completed').catch(() => {});
        }

        cleanupSessionProgress(sessionId);
        session.status = 'stopped';
      });

      childProcess.on('error', (error) => {
        console.error(`[Session ${sessionId}] Process error:`, error.message);
        cleanupSessionProgress(sessionId);
        cleanupActiveRemoteSession(workingDir);
        session.status = 'error';
      });

      return session;
    } catch (error) {
      session.status = 'error';
      cleanupSessionProgress(sessionId);
      cleanupActiveRemoteSession(workingDir);
      if (session.flowId) {
        await this.deleteSessionFlow(session.flowId);
      }
      this.sessions.delete(sessionId);
      throw error;
    }
  }

  /**
   * Spawn a new Claude Code session
   */
  async spawnSession(options: SpawnOptions): Promise<Session> {
    if (this.sessions.size >= this.maxSessions) {
      throw new Error(
        `Maximum sessions (${this.maxSessions}) reached. Kill an existing session first.`
      );
    }

    // Expand ~ and resolve the working directory path
    const workingDir = expandPath(options.workingDir);

    // Create the working directory if it doesn't exist
    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir, { recursive: true });
      console.log(`Created working directory: ${workingDir}`);
    }

    const sessionId = this.generateSessionId();

    // Create the routing Flow first
    const flowId = await this.createSessionFlow(sessionId, options.groupId);

    const session: Session = {
      id: sessionId,
      workingDir: workingDir,
      status: 'starting',
      createdAt: new Date(),
      lastActivity: new Date(),
      groupId: options.groupId,
      flowId,
    };

    this.sessions.set(sessionId, session);

    // Send immediate confirmation that session is starting and capture messageId for updates
    const messageId = await this.sendSessionStatus(sessionId, options.groupId, 'starting', workingDir);
    if (messageId) {
      session.messageId = messageId;
    }

    // Register active session marker so hooks can identify this as a Mirra-spawned session
    // Hooks run as separate processes and don't inherit env vars, so we use file-based markers
    registerActiveRemoteSession({
      sessionId,
      groupId: options.groupId,
      apiKey: this.apiKey,
      messageId,
      workingDir,
      createdAt: new Date().toISOString(),
    });

    try {
      // Environment variables for the Claude Code process
      // These are read by the hooks to know where to send output
      const env = {
        ...process.env,
        MIRRA_API_KEY: this.apiKey,
        MIRRA_GROUP_ID: options.groupId,
        MIRRA_SESSION_ID: sessionId,
        // Pass messageId for hooks to update instead of creating new messages
        ...(messageId && { MIRRA_SESSION_MESSAGE_ID: messageId }),
      };

      // Combine remote session instructions with user's prompt
      const fullPrompt = `${REMOTE_SESSION_INSTRUCTIONS}\n\n---\n\nUser request: ${options.initialPrompt}`;

      // Helper to set up child_process spawn
      // Uses -p (print) mode with --output-format json to get session_id
      // IMPORTANT: Don't use shell: true - it breaks argument passing
      const spawnWithChildProcess = () => {
        console.log(`[Session ${sessionId}] Spawning Claude in ${workingDir}`);

        const args = [
          '-p',                    // Print mode - process prompt and exit
          '--output-format', 'json',  // Get JSON output with session_id
          fullPrompt,
        ];

        const childProcess = spawn(CLAUDE_PATH, args, {
          cwd: workingDir,
          env,
          stdio: ['ignore', 'pipe', 'pipe'],  // Ignore stdin to prevent hanging
        });

        console.log(`[Session ${sessionId}] Claude started (PID: ${childProcess.pid})`);
        session.pty = childProcess;

        // Capture stdout - it's JSON with session_id and result
        let stdoutBuffer = '';
        childProcess.stdout?.on('data', (data) => {
          session.lastActivity = new Date();
          stdoutBuffer += data.toString();
        });

        childProcess.stderr?.on('data', (data) => {
          session.lastActivity = new Date();
          console.error(`[Session ${sessionId}] stderr:`, data.toString().substring(0, 300));
        });

        childProcess.on('exit', async (code) => {
          console.log(`[Session ${sessionId}] Claude exited (code: ${code})`);

          // Parse JSON output to get Claude's session ID and result
          let resultText = '';
          try {
            const result = JSON.parse(stdoutBuffer);
            if (result.session_id) {
              session.claudeSessionId = result.session_id;
              console.log(`[Session ${sessionId}] Claude session: ${result.session_id}`);
            }
            resultText = result.result || '';
          } catch {
            // Not JSON, use raw output
            resultText = stdoutBuffer.trim();
          }

          // Send output to Mirra
          if (resultText) {
            try {
              await this.sendOutputToMirra(sessionId, resultText, workingDir);
              console.log(`[Session ${sessionId}] Output sent to Mirra (${resultText.length} chars)`);
            } catch (error: any) {
              console.error(`[Session ${sessionId}] Failed to send output:`, error.message);
            }
          }

          // Create memory note with initial prompt + result
          if (session.claudeSessionId) {
            this.createOrUpdateMemoryNote(session, options.initialPrompt, 'created').catch(() => {});
            if (resultText) {
              // Small delay so 'created' entry is written first
              setTimeout(() => {
                this.createOrUpdateMemoryNote(session, resultText, 'completed').catch(() => {});
              }, 500);
            }
          }

          // Clean up progress state file (marker stays for follow-ups)
          cleanupSessionProgress(sessionId);

          // Mark as stopped but keep the session for follow-ups via --resume
          session.status = 'stopped';
        });

        childProcess.on('error', (error) => {
          console.error(`[Session ${sessionId}] Process error:`, error.message);
          cleanupSessionProgress(sessionId);
          cleanupActiveRemoteSession(workingDir);
          session.status = 'error';
        });
      };

      // Try node-pty first, fall back to child_process if it fails
      let usedPty = false;
      if (pty) {
        try {
          // With pty, we can use interactive mode (no -p flag)
          const ptyProcess = pty.spawn(CLAUDE_PATH, [fullPrompt], {
            name: 'xterm-256color',
            cols: 120,
            rows: 40,
            cwd: workingDir,
            env,
          });

          session.pty = ptyProcess;
          usedPty = true;

          ptyProcess.onData((data: string) => {
            session.lastActivity = new Date();
            // Output is handled by hooks, not here
          });

          ptyProcess.onExit(async ({ exitCode }: { exitCode: number }) => {
            session.status = 'stopped';
            // Clean up progress state file and active session marker
            cleanupSessionProgress(sessionId);
            cleanupActiveRemoteSession(workingDir);
            // Clean up Flow when session exits
            if (session.flowId) {
              await this.deleteSessionFlow(session.flowId);
            }
            this.sessions.delete(sessionId);
          });
        } catch (ptyError: any) {
          // node-pty failed (e.g., incompatible Node.js version), fall back to child_process
          console.warn(`node-pty spawn failed (${ptyError.message}), falling back to child_process`);
          spawnWithChildProcess();
        }
      }

      if (!pty) {
        // node-pty not available, use child_process
        spawnWithChildProcess();
      }

      session.status = 'running';

      // Note: Progress updates are now triggered by the post-tool hook
      // instead of polling. See commands/hook.ts handlePostToolUse()

      return session;
    } catch (error) {
      session.status = 'error';
      // Clean up progress state, active session marker, and Flow if session spawn failed
      cleanupSessionProgress(sessionId);
      cleanupActiveRemoteSession(workingDir);
      if (session.flowId) {
        await this.deleteSessionFlow(session.flowId);
      }
      this.sessions.delete(sessionId);
      throw error;
    }
  }

  /**
   * Send input to a session
   *
   * For child_process sessions (using -p mode), this spawns a new Claude
   * with --resume to maintain conversation context using Claude's session ID.
   * For pty sessions, this writes directly to the terminal.
   */
  async sendInput(sessionId: string, input: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.lastActivity = new Date();

    console.log(`[Session ${sessionId}] sendInput called - status: ${session.status}, has pty: ${!!session.pty}, has node-pty: ${!!pty}, claudeSessionId: ${session.claudeSessionId || 'none'}`);

    // Check if we have an ACTIVE pty with stdin available
    // Only use this path if the session is actively running (not stopped/error)
    if (session.status === 'running' && session.pty && pty && typeof session.pty.write === 'function') {
      // node-pty - write directly
      console.log(`[Session ${sessionId}] Writing to active node-pty`);
      session.pty.write(input + '\n');
      return;
    }

    // For child_process sessions, spawn a new Claude with --resume
    // This uses Claude's internal session ID to maintain conversation context
    const resumeId = session.claudeSessionId;
    console.log(`[Session ${sessionId}] Sending follow-up${resumeId ? ` (resuming ${resumeId.substring(0, 8)}...)` : ' (new conversation)'}`);

    // Create a NEW message for this response cycle
    // Each prompt-response cycle should have its own message that gets updated
    const messageId = await this.sendSessionStatus(
      sessionId,
      session.groupId,
      'running',
      session.workingDir,
      `Processing follow-up request...`
    );

    // Update session with new messageId for this cycle
    if (messageId) {
      session.messageId = messageId;
      // Update the active session marker so hooks use the new messageId
      updateActiveRemoteSession(session.workingDir, { messageId });
    }

    const env = {
      ...process.env,
      MIRRA_API_KEY: this.apiKey,
      MIRRA_GROUP_ID: session.groupId,
      MIRRA_SESSION_ID: sessionId,
      // Pass messageId for hooks to update instead of creating new messages
      ...(messageId && { MIRRA_SESSION_MESSAGE_ID: messageId }),
    };

    // Build args - include --resume if we have a Claude session ID
    const args = ['-p', '--output-format', 'json'];
    if (resumeId) {
      args.push('--resume', resumeId);
    }
    args.push(input);

    console.log(`[Session ${sessionId}] Spawn args:`, JSON.stringify(args));
    console.log(`[Session ${sessionId}] CLAUDE_PATH: ${CLAUDE_PATH}`);
    console.log(`[Session ${sessionId}] Working dir: ${session.workingDir}`);
    console.log(`[Session ${sessionId}] Working dir exists: ${fs.existsSync(session.workingDir)}`);

    let childProcess: ChildProcess;
    try {
      childProcess = spawn(CLAUDE_PATH, args, {
        cwd: session.workingDir,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      console.log(`[Session ${sessionId}] Spawned PID: ${childProcess.pid || 'undefined (spawn may have failed)'}`);
    } catch (spawnError: any) {
      console.error(`[Session ${sessionId}] Spawn threw error:`, spawnError.message);
      console.error(`[Session ${sessionId}] Spawn error stack:`, spawnError.stack);
      throw spawnError;
    }

    if (!childProcess.pid) {
      console.error(`[Session ${sessionId}] WARNING: No PID assigned - spawn likely failed`);
    }

    session.pty = childProcess;
    session.status = 'running';

    // Note: Progress updates are triggered by the post-tool hook

    // Capture stdout (JSON format)
    let stdoutBuffer = '';
    childProcess.stdout?.on('data', (data) => {
      session.lastActivity = new Date();
      const chunk = data.toString();
      stdoutBuffer += chunk;
      console.log(`[Session ${sessionId}] stdout chunk (${chunk.length} bytes):`, chunk.substring(0, 100));
    });

    childProcess.stderr?.on('data', (data) => {
      const stderrStr = data.toString();
      console.error(`[Session ${sessionId}] stderr (${stderrStr.length} bytes):`, stderrStr.substring(0, 500));
    });

    // Log spawn errors immediately
    childProcess.on('spawn', () => {
      console.log(`[Session ${sessionId}] Claude process spawned successfully`);
    });

    childProcess.on('exit', async (code) => {
      console.log(`[Session ${sessionId}] Claude exited (code: ${code})`);

      // Parse JSON output
      let resultText = '';
      try {
        const result = JSON.parse(stdoutBuffer);
        // Update Claude session ID if it changed
        if (result.session_id && result.session_id !== session.claudeSessionId) {
          session.claudeSessionId = result.session_id;
        }
        resultText = result.result || '';
      } catch {
        resultText = stdoutBuffer.trim();
      }

      // Send output to Mirra
      if (resultText) {
        try {
          await this.sendOutputToMirra(sessionId, resultText, session.workingDir);
          console.log(`[Session ${sessionId}] Output sent to Mirra (${resultText.length} chars)`);
        } catch (error: any) {
          console.error(`[Session ${sessionId}] Failed to send output:`, error.message);
        }
      }

      // Update memory note with follow-up result
      if (resultText && session.claudeSessionId) {
        this.createOrUpdateMemoryNote(session, resultText, 'completed').catch(() => {});
      }

      // Clean up progress state file
      cleanupSessionProgress(sessionId);

      // Mark as stopped but keep the session for future messages
      session.status = 'stopped';
    });

    childProcess.on('error', (error) => {
      console.error(`[Session ${sessionId}] Process error:`, error.message);
      console.error(`[Session ${sessionId}] Error stack:`, error.stack);
      cleanupSessionProgress(sessionId);
      session.status = 'error';
    });

    // Check if working directory exists
    if (!fs.existsSync(session.workingDir)) {
      console.error(`[Session ${sessionId}] WARNING: Working directory does not exist: ${session.workingDir}`);
    }
  }

  /**
   * Send user response to a permission prompt
   *
   * Writes the user's selection (allow/deny) to Claude Code's stdin.
   * Claude Code interprets single key inputs for permission prompts:
   * - 'y' or Enter = allow
   * - 'a' = allow always (for this session)
   * - 'n' or Escape = deny
   */
  async sendUserResponse(sessionId: string, response: PermissionResponse): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status !== 'running') {
      throw new Error(
        `Session ${sessionId} is not running (status: ${session.status})`
      );
    }

    if (!session.pty) {
      throw new Error(`Session ${sessionId} has no process attached`);
    }

    session.lastActivity = new Date();

    // Map action to the key Claude Code expects
    let key: string;
    switch (response.action) {
      case 'allow':
        key = 'y';  // 'y' or Enter = allow
        break;
      case 'allow_always':
        key = 'a';  // 'a' = allow always for session
        break;
      case 'deny':
        key = 'n';  // 'n' or Escape = deny
        break;
      default:
        throw new Error(`Invalid action: ${response.action}`);
    }

    console.log(`[Session ${sessionId}] Sending permission response: ${response.action} (key: ${key})`);

    // Write the key to stdin
    if (pty && typeof session.pty.write === 'function') {
      // node-pty - write the key directly (no newline needed for single-key input)
      session.pty.write(key);
    } else if (session.pty.stdin) {
      // child_process - write the key
      session.pty.stdin.write(key);
    }
  }

  /**
   * Kill a session
   */
  async killSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Capture and clear flowId to prevent double-deletion by exit handler
    const flowId = session.flowId;
    session.flowId = undefined;

    // Clean up progress state and active session marker FIRST
    cleanupSessionProgress(sessionId);
    cleanupActiveRemoteSession(session.workingDir);

    // Kill the process
    if (session.pty) {
      if (pty && typeof session.pty.kill === 'function') {
        session.pty.kill();
      } else if (typeof session.pty.kill === 'function') {
        session.pty.kill('SIGTERM');
      }
    }

    session.status = 'stopped';
    this.sessions.delete(sessionId);

    // Clean up the routing Flow LAST
    // This ensures the session cleanup completes before the flow is removed,
    // preventing race conditions where routed messages can't reach the session
    if (flowId) {
      // Fire and forget - don't block the response on flow deletion
      this.deleteSessionFlow(flowId).catch((err) => {
        console.error(`Failed to delete flow ${flowId}:`, err.message);
      });
    }
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all sessions
   */
  listSessions(): SessionResponse[] {
    return Array.from(this.sessions.values()).map((session) => ({
      id: session.id,
      workingDir: session.workingDir,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      lastActivity: session.lastActivity.toISOString(),
      flowId: session.flowId,
    }));
  }

  /**
   * Kill all sessions
   */
  async killAllSessions(): Promise<void> {
    for (const sessionId of this.sessions.keys()) {
      try {
        await this.killSession(sessionId);
      } catch {
        // Ignore errors during cleanup
      }
    }
  }

  /**
   * Get count of active sessions
   */
  getActiveCount(): number {
    return this.sessions.size;
  }
}
