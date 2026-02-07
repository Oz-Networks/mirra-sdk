/**
 * Types for Mirra Claude Code Bridge
 */

/**
 * An active Claude Code terminal session
 */
export interface ActiveSession {
  sessionId: string;
  sessionName: string;     // e.g., "fxn-monorepo" or "fxn-monorepo #2"
  workingDir: string;
  startedAt: string;
}

/**
 * Local session info for direct Claude Code usage (not spawned by bridge)
 * Tracks multiple concurrent terminals with a shared Flow
 */
export interface LocalSession {
  activeSessions: ActiveSession[];  // Array of active terminal sessions
  flowId?: string;                  // Single shared Flow with OR condition
  groupId: string;
  createdAt: string;
}

/**
 * Pending permission request awaiting user response
 */
export interface PendingPermissionRequest {
  requestId: string;
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  response?: {
    action: 'allow' | 'allow_always' | 'deny';
    respondedAt: string;
  };
}

/**
 * Configuration for auto-update behavior
 */
export interface UpdateConfig {
  /** Enable auto-update without prompting */
  autoUpdate?: boolean;
  /** ISO timestamp of last update check */
  lastUpdateCheck?: string;
  /** Version to skip prompting for */
  skipVersion?: string;
  /** Hours between update checks (default: 24) */
  checkIntervalHours?: number;
}

export interface BridgeConfig {
  apiKey: string;
  userId?: string;
  groupId?: string;  // Where to send Claude Code output (all chats are groups)
  defaultWorkDir?: string;
  pcResourceId?: string;
  hooksConfigured?: boolean;
  setupComplete?: boolean;
  /** Bearer token for authenticating inbound requests from Mirra server */
  bridgeAuthToken?: string;
  tunnel?: {
    provider: 'ngrok' | 'cloudflare';
    authToken?: string;
  };
  server?: {
    port: number;
  };
  localSession?: LocalSession;
  pendingPermissionRequests?: PendingPermissionRequest[];
  /** Auto-update configuration */
  updateConfig?: UpdateConfig;
  /** Mapping of Claude session IDs to memory note IDs */
  sessionMemoryNotes?: SessionMemoryMapping[];
}

export interface Session {
  id: string;
  workingDir: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  createdAt: Date;
  lastActivity: Date;
  groupId: string;  // Group where messages are sent (all chats are groups)
  flowId?: string;  // ID of the routing Flow (for cleanup on session end)
  claudeSessionId?: string;  // Claude Code's internal session ID for --resume
  messageId?: string;  // ID of the session status message (for updates instead of new messages)
  pty?: any; // node-pty IPty instance or ChildProcess
}

export interface ClaudeCodeMessage {
  type: 'claude_code_output' | 'claude_code_tool' | 'claude_code_status';
  sessionId: string;
  timestamp: string;
  data: any;
}

export interface ClaudeCodeOutput extends ClaudeCodeMessage {
  type: 'claude_code_output';
  data: {
    content: string;
    role?: 'assistant' | 'user';
    // Notification metadata (from Claude Code hook)
    notificationType?: 'permission_prompt' | 'assistant_response' | 'progress' | string;
    claudeSessionId?: string;
    workingDirectory?: string;
  };
}

export interface ClaudeCodeToolUse extends ClaudeCodeMessage {
  type: 'claude_code_tool';
  data: {
    toolName: string;
    input?: any;
    output?: any;
    status: 'started' | 'completed' | 'error';
  };
}

export interface ClaudeCodeStatus extends ClaudeCodeMessage {
  type: 'claude_code_status';
  data: {
    status: 'started' | 'running' | 'stopped' | 'error';
    message?: string;
  };
}

export interface SpawnSessionRequest {
  workingDir?: string;
  initialPrompt: string;
  groupId: string;  // Group where messages will be sent (all chats are groups)
}

export interface ResumeSessionRequest {
  claudeSessionId: string;  // UUID from GET /claude-sessions
  prompt: string;           // What to work on next
  groupId?: string;         // Target group (falls back to config default)
  workingDir?: string;      // Project dir (from session metadata.projectPath)
}

export interface SessionMemoryMapping {
  claudeSessionId: string;
  memoryNoteId: string;
  groupId: string;
  projectName: string;
  workingDir: string;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface SendInputRequest {
  input: string;
}

/**
 * Link data for contextual navigation
 * Callers can use this to provide users with a link to the session output location
 */
export interface SessionLinkData {
  linkType: 'chat';
  url: string;
  label: string;
  description: string;
  icon: string;
  entityRef: {
    groupId: string;
  };
}

export interface SessionResponse {
  id: string;
  workingDir: string;
  status: string;
  createdAt: string;
  lastActivity: string;
  flowId?: string;  // ID of the routing Flow (present if Flow was created successfully)
  /** Link to the output group - callers can use this to inform users where responses will appear */
  link?: SessionLinkData;
  /** Structured data for UI rendering - automatically propagated through execute_code */
  structuredData?: Array<{
    displayType: string;
    templateId: string;
    data: any;
  }>;
}

// ============================================================================
// Permission Prompt Types
// ============================================================================

/**
 * Parsed permission prompt data from Claude Code notification
 */
export interface PermissionPromptData {
  tool: string;           // 'Bash', 'Edit', 'Write', 'Read', etc.
  command?: string;       // For Bash: the command being executed
  filePath?: string;      // For file ops: the path being accessed
  message: string;        // Human readable prompt message
  sessionId: string;      // Claude Code session ID
}

/**
 * User's response to a permission prompt
 */
export interface PermissionResponse {
  sessionId: string;
  action: 'allow' | 'allow_always' | 'deny';
  tool?: string;
  command?: string;
  filePath?: string;
}

/**
 * Request body for /respond endpoint
 */
export interface RespondRequest {
  sessionId: string;
  selection: {
    id: string;
    action: 'allow' | 'allow_always' | 'deny';
    metadata?: Record<string, any>;
  };
}

// ============================================================================
// Structured Data Types (for mobile app rendering)
// ============================================================================

/**
 * A single item in a structured data list
 */
export interface StructuredDataItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  metadata?: Record<string, any>;
}

/**
 * Interactions configuration for structured data
 */
export interface StructuredDataInteractions {
  allowSelection?: boolean;
  allowMultiSelect?: boolean;
  primaryAction?: string;
}

/**
 * A step within a card display
 */
export interface StructuredCardStep {
  id: string;
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'pending' | 'skipped';
  icon?: string;
  detail?: string;
  timestamp?: string;
  durationMs?: number;
}

/**
 * Badge for card headers
 */
export interface StructuredCardBadge {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
}

/**
 * Structured data payload for rich message rendering
 * Supports 'list' for item collections and 'card' for execution details
 */
export interface StructuredData {
  displayType: 'list' | 'card';
  templateId: string;
  data: {
    // For 'list' display type
    items?: StructuredDataItem[];
    // For 'card' display type
    title?: string;
    subtitle?: string;
    icon?: string;
    badges?: StructuredCardBadge[];
    steps?: StructuredCardStep[];
    summary?: Record<string, string | number>;
    defaultExpanded?: boolean;
  };
  interactions?: StructuredDataInteractions;
  metadata?: Record<string, any>;
}
