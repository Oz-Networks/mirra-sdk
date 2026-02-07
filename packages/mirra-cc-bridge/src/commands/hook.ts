/**
 * Hook handler - called by Claude Code hooks to send output to Mirra
 *
 * This is invoked via:
 *   mirra-cc-bridge hook notification
 *   mirra-cc-bridge hook post-tool
 *   mirra-cc-bridge hook stop
 *
 * Hook data is passed via stdin from Claude Code as JSON.
 */

import * as path from 'path';
import { MirraSDK } from '@mirra-messenger/sdk';
import {
  loadConfig,
  setSessionTranscriptPath,
  getSessionProgress,
  updateSessionProgress,
  getActiveRemoteSession,
  ActiveSessionMarker,
} from '../config';
import {
  ClaudeCodeOutput,
  ClaudeCodeToolUse,
  ClaudeCodeStatus,
  PermissionPromptData,
  StructuredData,
  StructuredDataItem,
} from '../types';
import { parseTranscriptForExecutionCard } from '../transcript-parser';

/**
 * Read all data from stdin
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';

    // If stdin is not a TTY, read from it
    if (!process.stdin.isTTY) {
      process.stdin.setEncoding('utf-8');
      process.stdin.on('data', (chunk) => {
        data += chunk;
      });
      process.stdin.on('end', () => {
        resolve(data);
      });
    } else {
      // No stdin data
      resolve('');
    }
  });
}

/**
 * Cached active session marker (loaded once per hook invocation)
 * Since hooks run as separate processes, we load this once from the marker file
 */
let cachedSessionMarker: ActiveSessionMarker | null = null;
let sessionMarkerLoaded = false;

/**
 * Load the active session marker based on working directory
 * Called once per hook invocation to cache the session info
 */
function loadSessionMarker(cwd?: string): ActiveSessionMarker | null {
  if (sessionMarkerLoaded) {
    return cachedSessionMarker;
  }

  sessionMarkerLoaded = true;

  // Try to load marker based on working directory
  const workingDir = cwd || process.cwd();
  cachedSessionMarker = getActiveRemoteSession(workingDir);

  if (cachedSessionMarker) {
    console.log(`[Hook] Loaded session marker for ${workingDir}: sessionId=${cachedSessionMarker.sessionId}`);
  }

  return cachedSessionMarker;
}

/**
 * Get SDK instance
 */
function getSDK(): MirraSDK {
  // First check for session marker (Mirra-spawned sessions)
  const marker = cachedSessionMarker;
  if (marker?.apiKey) {
    return new MirraSDK({
      apiKey: marker.apiKey,
    });
  }

  // Fall back to config
  const config = loadConfig();
  if (!config?.apiKey) {
    throw new Error('Not configured. Run `mirra-cc-bridge configure` first.');
  }

  return new MirraSDK({
    apiKey: config.apiKey,
  });
}

/**
 * Get group ID (all chats are groups in Mirra)
 */
function getGroupId(): string {
  // First check session marker (Mirra-spawned sessions via file-based lookup)
  const marker = cachedSessionMarker;
  if (marker?.groupId) {
    return marker.groupId;
  }

  // Then check environment variable (legacy support)
  const envGroupId = process.env.MIRRA_GROUP_ID;
  if (envGroupId) {
    return envGroupId;
  }

  // Fall back to config
  const config = loadConfig();
  if (config?.groupId) {
    return config.groupId;
  }

  throw new Error(
    'Group not configured. Run `mirra-cc-bridge configure` to select where to send output.'
  );
}

/**
 * Check if this is a Mirra-spawned session
 * Uses file-based marker lookup since env vars aren't inherited by hook processes
 */
function isMirraSpawnedSession(): boolean {
  // Check session marker first (the reliable method)
  if (cachedSessionMarker) {
    return true;
  }
  // Fall back to env var (legacy support)
  return !!process.env.MIRRA_SESSION_ID;
}

/**
 * Get session ID from marker or environment
 * Only called for Mirra-spawned sessions
 */
function getSessionId(): string {
  // Check session marker first
  if (cachedSessionMarker?.sessionId) {
    return cachedSessionMarker.sessionId;
  }
  // Fall back to env var (legacy support)
  return process.env.MIRRA_SESSION_ID || '';
}

/**
 * Extract text content from a message for display
 */
function extractTextContent(message: ClaudeCodeOutput | ClaudeCodeToolUse | ClaudeCodeStatus): string {
  switch (message.type) {
    case 'claude_code_output':
      return (message as ClaudeCodeOutput).data.content || '';
    case 'claude_code_tool':
      const tool = message as ClaudeCodeToolUse;
      const output = tool.data.output;
      if (typeof output === 'string') {
        return `[${tool.data.toolName}] ${output.substring(0, 200)}${output.length > 200 ? '...' : ''}`;
      }
      return `[${tool.data.toolName}] completed`;
    case 'claude_code_status':
      return (message as ClaudeCodeStatus).data.message || `Session ${(message as ClaudeCodeStatus).data.status}`;
    default:
      return '';
  }
}

/**
 * Parse permission prompt from Claude Code notification
 * Extracts tool name, command/path, and message from the notification
 */
function parsePermissionPrompt(
  notificationData: ClaudeCodeNotification,
  sessionId: string
): PermissionPromptData | null {
  // Only handle permission_prompt notifications
  if (notificationData.notification_type !== 'permission_prompt') {
    return null;
  }

  const message = notificationData.message || '';

  // Parse the message to extract tool and details
  // Common patterns:
  // - "Claude needs your permission to use Bash"
  // - "Claude needs your permission to use Edit"
  // - "Claude needs your permission to use Write"
  // - "Claude needs your permission to use Read"

  let tool = 'Unknown';
  let command: string | undefined;
  let filePath: string | undefined;

  // Extract tool name from message
  const toolMatch = message.match(/permission to use (\w+)/i);
  if (toolMatch) {
    tool = toolMatch[1];
  }

  // For Bash, try to extract the command (usually follows in the notification)
  if (tool === 'Bash') {
    // The full notification JSON might have more details
    // For now, we'll use the message as-is
    command = message;
  }

  // For file operations, try to extract the path
  if (['Edit', 'Write', 'Read'].includes(tool)) {
    // Look for a path pattern in the message
    const pathMatch = message.match(/(?:file|path):\s*([^\s]+)/i);
    if (pathMatch) {
      filePath = pathMatch[1];
    }
  }

  return {
    tool,
    command,
    filePath,
    message,
    sessionId,
  };
}

/**
 * Build structured data for permission prompt
 * Creates a selectable list with Allow, Allow Always, and Deny options
 */
function buildPermissionStructuredData(prompt: PermissionPromptData): StructuredData {
  // Build descriptive subtitle based on tool type
  let subtitle = prompt.message;
  if (prompt.command && prompt.tool === 'Bash') {
    subtitle = prompt.command;
  } else if (prompt.filePath) {
    subtitle = prompt.filePath;
  }

  const items: StructuredDataItem[] = [
    {
      id: 'allow',
      title: 'Allow',
      subtitle: `Grant permission for this operation`,
      icon: 'checkmark-circle',
      badgeVariant: 'success',
      metadata: {
        action: 'allow',
        tool: prompt.tool,
        command: prompt.command,
        filePath: prompt.filePath,
      },
    },
    {
      id: 'allow_always',
      title: 'Allow Always',
      subtitle: 'Trust this tool for the session',
      icon: 'shield-checkmark',
      badgeVariant: 'primary',
      metadata: {
        action: 'allow_always',
        tool: prompt.tool,
      },
    },
    {
      id: 'deny',
      title: 'Deny',
      subtitle: 'Block this operation',
      icon: 'close-circle',
      badgeVariant: 'error',
      metadata: {
        action: 'deny',
        tool: prompt.tool,
      },
    },
  ];

  return {
    displayType: 'list',
    templateId: 'cc_permission_prompt',
    data: {
      items,
    },
    interactions: {
      allowSelection: true,
      allowMultiSelect: false,
    },
    metadata: {
      sessionId: prompt.sessionId,
      promptType: 'permission',
      tool: prompt.tool,
      originalMessage: prompt.message,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Get session message ID from marker or environment (for updateMessage)
 */
function getSessionMessageId(): string | undefined {
  // Check session marker first
  if (cachedSessionMarker?.messageId) {
    return cachedSessionMarker.messageId;
  }
  // Fall back to env var (legacy support)
  return process.env.MIRRA_SESSION_MESSAGE_ID;
}

/**
 * Send or update a message to Mirra via the messaging adapter
 *
 * If MIRRA_SESSION_MESSAGE_ID is set, updates the existing session message.
 * Otherwise, sends a new message.
 *
 * For permission prompts, includes structuredData with selectable options.
 * The mobile app renders these as a tappable list (Allow/Deny buttons).
 *
 * For other notifications, sends plain text with automation metadata.
 *
 * @param workingDir - Working directory of the Claude Code session (for session naming)
 * @param structuredData - Optional structured data for rich UI rendering
 */
async function sendToMirra(
  message: ClaudeCodeOutput | ClaudeCodeToolUse | ClaudeCodeStatus,
  workingDir?: string,
  structuredData?: StructuredData
): Promise<void> {
  const sdk = getSDK() as any;
  const groupId = getGroupId();
  const sessionId = getSessionId();
  const existingMessageId = getSessionMessageId();

  // Use working directory as session name for identification
  const sessionName = workingDir || 'Claude Code';

  // Extract readable text content
  let textContent = extractTextContent(message);

  // Prefix with session name for identification
  if (textContent && sessionName) {
    textContent = `[${sessionName}] ${textContent}`;
  }

  // If we have an existing message ID, update it instead of sending a new message
  if (existingMessageId) {
    await sdk.mirraMessaging.updateMessage({
      messageId: existingMessageId,
      content: textContent,
      // Include structuredData if provided
      ...(structuredData && { structuredData: [structuredData] }),
    });
    return;
  }

  // Otherwise, send a new message
  await sdk.mirraMessaging.sendMessage({
    groupId,
    content: textContent,
    automation: {
      source: 'claude-code',
      flowTitle: 'Claude Code',
      isAutomated: true, // Required for app to recognize as automated message
      // Critical for Flow-based reply routing: allows Flows to filter
      // replies to this specific Claude Code session
      sessionId,
      sessionName, // Include session name for display purposes
    },
    // Include structuredData for permission prompts (displayType: 'list' only)
    ...(structuredData && { structuredData: [structuredData] }),
  });
}

/**
 * Notification data structure from Claude Code
 */
interface ClaudeCodeNotification {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  hook_event_name?: string;
  message?: string;
  notification_type?: 'permission_prompt' | 'assistant_response' | 'progress' | string;
}

/**
 * Handle PostMessage hook - Claude's response text
 *
 * Claude Code sends JSON with notification data including:
 * - message: Human-readable notification text
 * - notification_type: Type of notification (permission_prompt, assistant_response, etc.)
 * - session_id: Claude Code session identifier
 * - cwd: Current working directory
 *
 * For permission_prompt notifications, we build structured data with selectable
 * options (Allow, Allow Always, Deny) that the mobile app renders as buttons.
 *
 * For local sessions (not Mirra-spawned), we poll for the user's response
 * and output it to stdout for Claude Code to process.
 */
async function handlePostMessage(stdinData: string): Promise<void> {
  if (!stdinData.trim()) {
    return; // Nothing to send
  }

  // Try to parse as JSON notification data
  let notificationData: ClaudeCodeNotification | null = null;
  let humanReadableMessage: string;

  try {
    notificationData = JSON.parse(stdinData);
    // Extract the human-readable message from the notification
    humanReadableMessage = notificationData?.message || stdinData;
  } catch {
    // Not JSON, use raw text (legacy support)
    humanReadableMessage = stdinData;
  }

  const sessionId = getSessionId();

  const message: ClaudeCodeOutput = {
    type: 'claude_code_output',
    sessionId,
    timestamp: new Date().toISOString(),
    data: {
      content: humanReadableMessage,
      role: 'assistant',
      // Include notification metadata if available
      notificationType: notificationData?.notification_type,
      claudeSessionId: notificationData?.session_id,
      workingDirectory: notificationData?.cwd,
    },
  };

  // Build structured data for permission prompts
  let structuredData: StructuredData | undefined;
  let permissionPrompt: PermissionPromptData | null = null;
  let requestId: string | undefined;

  if (notificationData) {
    permissionPrompt = parsePermissionPrompt(notificationData, sessionId);
    if (permissionPrompt) {
      structuredData = buildPermissionStructuredData(permissionPrompt);
    }
  }

  // Get working directory from notification data
  const workingDir = notificationData?.cwd || process.cwd();

  // Store transcript path for progress tracking (if available)
  if (notificationData?.transcript_path && sessionId) {
    try {
      setSessionTranscriptPath(sessionId, notificationData.transcript_path);
    } catch {
      // Ignore errors - progress tracking is optional
    }
  }

  // Send message to Mirra
  await sendToMirra(message, workingDir, structuredData);
}

/**
 * Tool use data structure from Claude Code
 */
interface ClaudeCodeToolData {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  tool_name?: string;
  tool_input?: any;
  tool_output?: any;
  hook_event_name?: string;
}

/**
 * Handle PostToolUse hook - tool execution results
 *
 * Sends a progress update to Mirra after each tool call.
 * This keeps the user informed about Claude's progress in real-time.
 */
async function handlePostToolUse(stdinData: string, _toolName?: string): Promise<void> {
  const sessionId = getSessionId();

  console.log(`[Hook:PostToolUse] Called - sessionId: ${sessionId || 'none'}, toolName: ${_toolName || 'unknown'}`);

  if (!sessionId) {
    console.log(`[Hook:PostToolUse] Skipping - no session ID (not a Mirra-spawned session)`);
    return;
  }

  // Try to parse tool data for transcript path
  let toolData: ClaudeCodeToolData | null = null;
  try {
    if (stdinData.trim()) {
      toolData = JSON.parse(stdinData);
      console.log(`[Hook:PostToolUse] Parsed tool data - tool: ${toolData?.tool_name}, cwd: ${toolData?.cwd}, transcript: ${toolData?.transcript_path ? 'yes' : 'no'}`);
    }
  } catch {
    console.log(`[Hook:PostToolUse] Failed to parse stdin as JSON`);
  }

  // Store transcript path if available (needed for progress tracking)
  if (toolData?.transcript_path) {
    try {
      setSessionTranscriptPath(sessionId, toolData.transcript_path);
    } catch {
      // Ignore errors
    }
  }

  // Get progress state to access transcript path
  const progressState = getSessionProgress(sessionId);
  const transcriptPath = toolData?.transcript_path || progressState?.transcriptPath;

  if (!transcriptPath) {
    return;
  }

  // Parse transcript and build progress card
  const progressCard = await parseTranscriptForExecutionCard(
    transcriptPath,
    sessionId,
    { isProgress: true, title: 'Progress Update' }
  );

  if (!progressCard || !progressCard.data.steps || progressCard.data.steps.length === 0) {
    return;
  }

  const currentStepCount = progressCard.data.steps.length;
  const lastStepCount = progressState?.lastStepCount || 0;

  // Only send if there are new steps since last update
  if (currentStepCount <= lastStepCount) {
    return;
  }

  console.log(`[Hook] Sending progress update (${currentStepCount} steps, was ${lastStepCount})`);

  // Update the progress state BEFORE sending to prevent duplicate sends
  updateSessionProgress(sessionId, currentStepCount);

  // Send progress message to Mirra (update existing or send new)
  try {
    const sdk = getSDK() as any;
    const groupId = getGroupId();
    const workingDir = toolData?.cwd || process.cwd();
    const sessionName = path.basename(workingDir) || 'Claude Code';
    const existingMessageId = getSessionMessageId();
    const content = `[${sessionName}] _Working... ${currentStepCount} step${currentStepCount !== 1 ? 's' : ''} completed so far._`;

    // If we have an existing message ID, update it
    if (existingMessageId) {
      await sdk.mirraMessaging.updateMessage({
        messageId: existingMessageId,
        content,
        structuredData: [progressCard],
      });
    } else {
      await sdk.mirraMessaging.sendMessage({
        groupId,
        content,
        automation: {
          source: 'claude-code',
          flowTitle: 'Claude Code',
          isAutomated: true,
          sessionId,
          sessionName,
        },
        structuredData: [progressCard],
      });
    }
  } catch (error: any) {
    console.error(`[Hook] Failed to send progress update:`, error.message);
  }
}

/**
 * Stop hook data structure from Claude Code
 */
interface ClaudeCodeStopData {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  permission_mode?: string;
  hook_event_name?: string;
  stop_hook_active?: boolean;
}


/**
 * Transcript entry for summary extraction
 */
interface TranscriptEntryForSummary {
  type?: string;
  message?: {
    role?: string;
    content?: string | Array<{ type: string; text?: string }>;
  };
  timestamp?: string;
}

/**
 * Read and parse the transcript file to extract a summary
 */
async function extractTranscriptSummary(transcriptPath: string): Promise<string | null> {
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(transcriptPath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return null;
    }

    // Parse all entries
    const entries: TranscriptEntryForSummary[] = [];
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch {
        // Skip unparseable lines
      }
    }

    if (entries.length === 0) {
      return null;
    }

    // Find the last assistant message with actual content
    let lastAssistantContent: string | null = null;

    // Iterate backwards to find the last meaningful assistant response
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];

      // Check for assistant messages
      if (entry.message?.role === 'assistant' && entry.message.content) {
        const content = entry.message.content;

        // Handle array content (Claude's content blocks)
        if (Array.isArray(content)) {
          const textBlocks = content
            .filter((block) => block.type === 'text' && typeof block.text === 'string')
            .map(block => block.text as string);

          if (textBlocks.length > 0) {
            lastAssistantContent = textBlocks.join('\n');
            break;
          }
        } else if (typeof content === 'string' && content.trim()) {
          lastAssistantContent = content;
          break;
        }
      }
    }

    if (!lastAssistantContent) {
      return null;
    }

    // Truncate if too long (max ~1000 chars for mobile readability)
    if (lastAssistantContent.length > 1000) {
      lastAssistantContent = lastAssistantContent.substring(0, 1000) + '...';
    }

    return lastAssistantContent;
  } catch (error) {
    // If we can't read the transcript, return null
    return null;
  }
}


/**
 * Handle Stop hook - session ended
 *
 * Claude Code sends JSON with session metadata including the transcript path.
 * We read the transcript to extract a summary of what was accomplished.
 * Also cleans up the session from the shared Flow.
 */
async function handleStop(stdinData: string): Promise<void> {
  const sessionId = getSessionId();

  console.log(`[Hook:Stop] Called - sessionId: ${sessionId || 'none'}`);

  let stopData: ClaudeCodeStopData | null = null;
  let executionCard: StructuredData | null = null;

  // Try to parse the JSON metadata from Claude Code
  try {
    stopData = JSON.parse(stdinData.trim());
    console.log(`[Hook:Stop] Parsed stop data - claude_session_id: ${stopData?.session_id?.substring(0, 8) || 'none'}, cwd: ${stopData?.cwd}, transcript: ${stopData?.transcript_path ? 'yes' : 'no'}`);
  } catch {
    console.log(`[Hook:Stop] Failed to parse stdin as JSON`);
  }

  // If we have a transcript path, extract execution card
  // Note: We don't extract summary text because the notification hook already sent Claude's output
  if (stopData?.transcript_path) {
    executionCard = await parseTranscriptForExecutionCard(stopData.transcript_path, sessionId);
  }

  // Only send a message if we have an execution card with meaningful content
  // The notification hook already sent Claude's response, so we only add the card
  if (!executionCard || !executionCard.data.steps || executionCard.data.steps.length === 0) {
    // No meaningful card data, skip sending to avoid duplicate messages
    return;
  }

  // Get working directory from stop data
  const workingDir = stopData?.cwd || process.cwd();
  const cwdName = workingDir.split('/').pop() || 'Claude Code';

  const message: ClaudeCodeStatus = {
    type: 'claude_code_status',
    sessionId,
    timestamp: new Date().toISOString(),
    data: {
      status: 'stopped',
      message: `[${cwdName}] _Session completed. Expand card for execution details._`,
    },
  };

  // Send the execution card
  await sendToMirra(message, workingDir, executionCard);
}

/**
 * Main hook handler
 *
 * Only processes events for Mirra-spawned sessions (sessions started via spawnSession).
 * Local sessions (started directly by user) are ignored since the user is at the terminal.
 */
export async function handleHook(event: string, args: string[]): Promise<void> {
  console.log(`[Hook] ========== HOOK EVENT: ${event} ==========`);
  console.log(`[Hook] Args: ${JSON.stringify(args)}`);

  // Read stdin first to get working directory for session marker lookup
  const stdinData = await readStdin();
  console.log(`[Hook] Stdin data length: ${stdinData.length} chars`);

  // Try to extract working directory from stdin to load session marker
  // Hooks receive JSON with cwd field from Claude Code
  let cwd: string | undefined;
  try {
    if (stdinData.trim()) {
      const parsed = JSON.parse(stdinData);
      cwd = parsed.cwd;
    }
  } catch {
    // Not JSON, will use process.cwd()
  }

  // Load the session marker based on working directory
  // This is how we identify Mirra-spawned sessions (env vars aren't inherited to hooks)
  loadSessionMarker(cwd);
  console.log(`[Hook] Session marker loaded: ${cachedSessionMarker ? 'yes' : 'no'}`);
  console.log(`[Hook] Env MIRRA_SESSION_ID: ${process.env.MIRRA_SESSION_ID || 'not set'}`);

  // Only process hooks for Mirra-spawned sessions
  // Local sessions don't need output synced to Mirra since user is at the terminal
  if (!isMirraSpawnedSession()) {
    console.log(`[Hook] Skipping - not a Mirra-spawned session (no marker and no env var)`);
    return;
  }

  console.log(`[Hook] Processing as Mirra session: ${getSessionId()}`);

  switch (event) {
    case 'notification':
    case 'post-message':  // Legacy support
      await handlePostMessage(stdinData);
      break;

    case 'post-tool':
      await handlePostToolUse(stdinData, args[0]);
      break;

    case 'stop':
      await handleStop(stdinData);
      break;

    default:
      throw new Error(`Unknown hook event: ${event}`);
  }
}
