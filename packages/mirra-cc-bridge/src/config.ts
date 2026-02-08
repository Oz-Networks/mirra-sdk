/**
 * Configuration management for Mirra CC Bridge
 */

import { homedir } from 'os';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { basename } from 'path';
import { MirraSDK } from '@mirra-messenger/sdk';
import { ActiveSession, BridgeConfig, LocalSession, PendingPermissionRequest, SessionMemoryMapping } from './types';

const CONFIG_DIR = join(homedir(), '.mirra');
const CONFIG_FILE = join(CONFIG_DIR, 'cc-bridge.json');

// Ensure config directory exists
if (!existsSync(CONFIG_DIR)) {
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
}

/**
 * Load configuration from file
 */
export function loadConfig(): BridgeConfig | null {
  if (!existsSync(CONFIG_FILE)) {
    return null;
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as BridgeConfig;
  } catch (error) {
    console.error('Error loading config:', error);
    return null;
  }
}

/**
 * Save configuration to file
 */
export function saveConfig(config: BridgeConfig): void {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    mode: 0o600, // Read/write for owner only
  });
}

/**
 * Get a specific config value
 */
export function getConfigValue<K extends keyof BridgeConfig>(
  key: K
): BridgeConfig[K] | undefined {
  const config = loadConfig();
  return config?.[key];
}

/**
 * Set a specific config value
 */
export function setConfigValue<K extends keyof BridgeConfig>(
  key: K,
  value: BridgeConfig[K]
): void {
  const config = loadConfig() || ({} as BridgeConfig);
  config[key] = value;
  saveConfig(config);
}

/**
 * Check if the bridge is configured
 */
export function isConfigured(): boolean {
  const config = loadConfig();
  return !!(config?.apiKey);
}

/**
 * Validate the cached API key by making a lightweight API call.
 * Returns true if the key is valid, false otherwise.
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const sdk = new MirraSDK({ apiKey }) as any;
    // Use getGroups with limit 1 as a lightweight validation call
    await sdk.mirraMessaging.getGroups({ limit: 1 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a secure random auth token
 */
function generateAuthToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'ccbridge_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Get or create the bridge auth token
 * This token is used to authenticate inbound requests from the Mirra server
 */
export function getOrCreateBridgeAuthToken(): string {
  const config = loadConfig() || ({} as BridgeConfig);

  if (config.bridgeAuthToken) {
    return config.bridgeAuthToken;
  }

  // Generate new token
  const token = generateAuthToken();
  config.bridgeAuthToken = token;
  saveConfig(config);

  return token;
}

/**
 * Validate a bearer token against the stored bridge auth token
 */
export function validateBridgeAuthToken(token: string): boolean {
  const config = loadConfig();
  if (!config?.bridgeAuthToken) {
    return false;
  }
  return token === config.bridgeAuthToken;
}

/**
 * Check if Claude Code hooks are configured
 */
export function hooksConfigured(): boolean {
  const config = loadConfig();
  return !!(config?.hooksConfigured);
}

/**
 * Get the config file path
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * Get the config directory path
 */
export function getConfigDir(): string {
  return CONFIG_DIR;
}

// ============================================================================
// Local Session Management (Multi-Session Support)
// ============================================================================

/**
 * Generate a unique session name based on working directory
 * Handles duplicates by appending #2, #3, etc.
 */
export function generateSessionName(workingDir: string): string {
  const config = loadConfig();
  const baseName = basename(workingDir) || 'claude-code';
  const activeSessions = config?.localSession?.activeSessions || [];

  // Find existing sessions with this base name
  const existingNames = activeSessions.map(s => s.sessionName);

  // Check if base name is available
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  // Find next available number
  let counter = 2;
  while (existingNames.includes(`${baseName} #${counter}`)) {
    counter++;
  }

  return `${baseName} #${counter}`;
}

/**
 * Add a new active session
 * Returns the generated session name
 */
export function addActiveSession(sessionId: string, workingDir: string): string {
  const config = loadConfig() || {} as BridgeConfig;

  // Initialize local session if needed, or migrate from old format
  if (!config.localSession) {
    config.localSession = {
      activeSessions: [],
      groupId: config.groupId || '',
      createdAt: new Date().toISOString(),
    };
  }

  // Ensure activeSessions array exists (handles old config format migration)
  if (!config.localSession.activeSessions) {
    config.localSession.activeSessions = [];
  }

  // Check if session already exists
  const existing = config.localSession.activeSessions.find(s => s.sessionId === sessionId);
  if (existing) {
    return existing.sessionName;
  }

  // Generate unique session name
  const sessionName = generateSessionName(workingDir);

  // Add new session
  const activeSession: ActiveSession = {
    sessionId,
    sessionName,
    workingDir,
    startedAt: new Date().toISOString(),
  };

  config.localSession.activeSessions.push(activeSession);
  saveConfig(config);

  return sessionName;
}

/**
 * Remove an active session by its ID
 */
export function removeActiveSession(sessionId: string): void {
  const config = loadConfig();
  if (!config?.localSession) {
    return;
  }

  // Handle old config format - nothing to remove
  if (!config.localSession.activeSessions) {
    return;
  }

  config.localSession.activeSessions = config.localSession.activeSessions.filter(
    s => s.sessionId !== sessionId
  );

  saveConfig(config);
}

/**
 * Get all active session IDs
 */
export function getActiveSessionIds(): string[] {
  const config = loadConfig();
  return config?.localSession?.activeSessions?.map(s => s.sessionId) || [];
}

/**
 * Get session name by session ID
 */
export function getSessionName(sessionId: string): string | undefined {
  const config = loadConfig();
  const session = config?.localSession?.activeSessions?.find(s => s.sessionId === sessionId);
  return session?.sessionName;
}

/**
 * Get or create a stable local session ID for a specific terminal
 * Uses process-level identifier to track individual terminals
 */
export function getOrCreateLocalSessionId(groupId: string): string {
  const config = loadConfig();

  // Use Claude Code's session ID if available (from hook data)
  // Otherwise generate a unique ID for this process
  const processSessionId = process.env.CLAUDE_CODE_SESSION_ID ||
    `cc_local_${process.pid}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Check if this session already exists
  const existingSession = config?.localSession?.activeSessions?.find(
    s => s.sessionId === processSessionId
  );

  if (existingSession && config?.localSession?.groupId === groupId) {
    return processSessionId;
  }

  // Initialize local session structure if needed
  if (!config?.localSession || config.localSession.groupId !== groupId) {
    const newConfig = config || {} as BridgeConfig;
    newConfig.localSession = {
      activeSessions: [],
      groupId,
      createdAt: new Date().toISOString(),
    };
    saveConfig(newConfig);
  }

  return processSessionId;
}

/**
 * Get current local session info
 */
export function getLocalSession(): LocalSession | undefined {
  const config = loadConfig();
  return config?.localSession;
}

/**
 * Set the Flow ID for the local session
 */
export function setLocalSessionFlowId(flowId: string): void {
  const config = loadConfig();
  if (config?.localSession) {
    config.localSession.flowId = flowId;
    saveConfig(config);
  }
}

/**
 * Clear local session state (for cleanup on shutdown)
 */
export function clearLocalSession(): void {
  const config = loadConfig();
  if (config) {
    delete config.localSession;
    // Also clear any pending permission requests
    delete config.pendingPermissionRequests;
    saveConfig(config);
  }
}

// ============================================================================
// Pending Permission Request Management
// ============================================================================

const PERMISSION_REQUEST_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Store a pending permission request
 * Returns the request ID for polling
 */
export function storePendingPermissionRequest(sessionId: string): string {
  const config = loadConfig() || {} as BridgeConfig;

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date();

  const request: PendingPermissionRequest = {
    requestId,
    sessionId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PERMISSION_REQUEST_TIMEOUT_MS).toISOString(),
  };

  if (!config.pendingPermissionRequests) {
    config.pendingPermissionRequests = [];
  }

  // Clean up expired requests while we're at it
  config.pendingPermissionRequests = config.pendingPermissionRequests.filter(
    r => new Date(r.expiresAt) > now
  );

  config.pendingPermissionRequests.push(request);
  saveConfig(config);

  return requestId;
}

/**
 * Get a pending permission request by ID
 */
export function getPendingPermissionRequest(requestId: string): PendingPermissionRequest | undefined {
  const config = loadConfig();
  return config?.pendingPermissionRequests?.find(r => r.requestId === requestId);
}

/**
 * Store response for a pending permission request
 */
export function storePermissionResponse(
  requestId: string,
  action: 'allow' | 'allow_always' | 'deny'
): boolean {
  const config = loadConfig();
  if (!config?.pendingPermissionRequests) {
    return false;
  }

  const request = config.pendingPermissionRequests.find(r => r.requestId === requestId);
  if (!request) {
    return false;
  }

  request.response = {
    action,
    respondedAt: new Date().toISOString(),
  };

  saveConfig(config);
  return true;
}

/**
 * Remove a pending permission request (after it's been handled)
 */
export function removePendingPermissionRequest(requestId: string): void {
  const config = loadConfig();
  if (config?.pendingPermissionRequests) {
    config.pendingPermissionRequests = config.pendingPermissionRequests.filter(
      r => r.requestId !== requestId
    );
    saveConfig(config);
  }
}

// ============================================================================
// Session Progress Tracking
// ============================================================================

/**
 * Directory for storing session progress files
 * Uses temp directory to avoid cluttering config
 */
const SESSION_PROGRESS_DIR = join(CONFIG_DIR, 'session-progress');

// Ensure progress directory exists
if (!existsSync(SESSION_PROGRESS_DIR)) {
  mkdirSync(SESSION_PROGRESS_DIR, { recursive: true, mode: 0o700 });
}

/**
 * Session progress state
 */
export interface SessionProgressState {
  sessionId: string;
  transcriptPath?: string;
  lastStepCount: number;
  lastProgressSentAt?: string;
  createdAt: string;
}

/**
 * Get the file path for a session's progress state
 */
function getSessionProgressPath(sessionId: string): string {
  return join(SESSION_PROGRESS_DIR, `${sessionId}.json`);
}

/**
 * Store the transcript path for a session (called by hooks)
 */
export function setSessionTranscriptPath(sessionId: string, transcriptPath: string): void {
  const progressPath = getSessionProgressPath(sessionId);

  let state: SessionProgressState;
  try {
    if (existsSync(progressPath)) {
      state = JSON.parse(readFileSync(progressPath, 'utf-8'));
    } else {
      state = {
        sessionId,
        lastStepCount: 0,
        createdAt: new Date().toISOString(),
      };
    }
  } catch {
    state = {
      sessionId,
      lastStepCount: 0,
      createdAt: new Date().toISOString(),
    };
  }

  state.transcriptPath = transcriptPath;
  writeFileSync(progressPath, JSON.stringify(state, null, 2), { mode: 0o600 });
}

/**
 * Get the session progress state
 */
export function getSessionProgress(sessionId: string): SessionProgressState | null {
  const progressPath = getSessionProgressPath(sessionId);

  try {
    if (existsSync(progressPath)) {
      return JSON.parse(readFileSync(progressPath, 'utf-8'));
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * Update session progress state (called after sending progress)
 */
export function updateSessionProgress(sessionId: string, stepCount: number): void {
  const progressPath = getSessionProgressPath(sessionId);

  let state: SessionProgressState;
  try {
    if (existsSync(progressPath)) {
      state = JSON.parse(readFileSync(progressPath, 'utf-8'));
    } else {
      state = {
        sessionId,
        lastStepCount: 0,
        createdAt: new Date().toISOString(),
      };
    }
  } catch {
    state = {
      sessionId,
      lastStepCount: 0,
      createdAt: new Date().toISOString(),
    };
  }

  state.lastStepCount = stepCount;
  state.lastProgressSentAt = new Date().toISOString();
  writeFileSync(progressPath, JSON.stringify(state, null, 2), { mode: 0o600 });
}

/**
 * Progress update interval in milliseconds (30 seconds)
 */
export const PROGRESS_UPDATE_INTERVAL_MS = 30 * 1000;

/**
 * Check if a progress update should be sent based on elapsed time
 * Returns true if no progress has been sent yet or if more than 30 seconds have passed
 */
export function shouldSendProgressUpdate(sessionId: string): boolean {
  const state = getSessionProgress(sessionId);

  if (!state) {
    return false; // No state yet, wait for transcript path to be set
  }

  if (!state.transcriptPath) {
    return false; // No transcript path yet
  }

  if (!state.lastProgressSentAt) {
    return true; // Never sent progress, should send now
  }

  const lastSent = new Date(state.lastProgressSentAt).getTime();
  const now = Date.now();

  return (now - lastSent) >= PROGRESS_UPDATE_INTERVAL_MS;
}

/**
 * Clean up session progress file (called when session ends)
 */
export function cleanupSessionProgress(sessionId: string): void {
  const progressPath = getSessionProgressPath(sessionId);

  try {
    if (existsSync(progressPath)) {
      const { unlinkSync } = require('fs');
      unlinkSync(progressPath);
    }
  } catch {
    // Ignore errors during cleanup
  }
}

// ============================================================================
// Active Remote Session Markers (for hooks to identify Mirra-spawned sessions)
// ============================================================================

/**
 * Directory for storing active session markers
 * These files allow hooks to identify Mirra-spawned sessions without env vars
 */
const ACTIVE_SESSIONS_DIR = join(CONFIG_DIR, 'active-sessions');

// Ensure active sessions directory exists
if (!existsSync(ACTIVE_SESSIONS_DIR)) {
  mkdirSync(ACTIVE_SESSIONS_DIR, { recursive: true, mode: 0o700 });
}

/**
 * Active session marker stored in file
 */
export interface ActiveSessionMarker {
  sessionId: string;
  groupId: string;
  apiKey: string;
  messageId?: string;
  workingDir: string;
  createdAt: string;
}

/**
 * Generate a hash of the working directory for use as filename
 */
function hashWorkingDir(workingDir: string): string {
  // Use a simple hash for the filename
  let hash = 0;
  for (let i = 0; i < workingDir.length; i++) {
    const char = workingDir.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and make it positive
  return Math.abs(hash).toString(16);
}

/**
 * Get the path for an active session marker file
 */
function getActiveSessionMarkerPath(workingDir: string): string {
  return join(ACTIVE_SESSIONS_DIR, `${hashWorkingDir(workingDir)}.json`);
}

/**
 * Register an active remote session (called when spawning)
 * This allows hooks to identify Mirra-spawned sessions without env vars
 */
export function registerActiveRemoteSession(marker: ActiveSessionMarker): void {
  const markerPath = getActiveSessionMarkerPath(marker.workingDir);
  writeFileSync(markerPath, JSON.stringify(marker, null, 2), { mode: 0o600 });
}

/**
 * Update an active session marker (e.g., to update messageId)
 */
export function updateActiveRemoteSession(workingDir: string, updates: Partial<ActiveSessionMarker>): void {
  const markerPath = getActiveSessionMarkerPath(workingDir);

  try {
    if (existsSync(markerPath)) {
      const marker = JSON.parse(readFileSync(markerPath, 'utf-8')) as ActiveSessionMarker;
      const updated = { ...marker, ...updates };
      writeFileSync(markerPath, JSON.stringify(updated, null, 2), { mode: 0o600 });
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Get the active session marker for a working directory
 * Returns null if no active session exists for this directory
 */
export function getActiveRemoteSession(workingDir: string): ActiveSessionMarker | null {
  const markerPath = getActiveSessionMarkerPath(workingDir);

  try {
    if (existsSync(markerPath)) {
      const marker = JSON.parse(readFileSync(markerPath, 'utf-8')) as ActiveSessionMarker;
      // Verify the marker is for this exact working directory (hash collision protection)
      if (marker.workingDir === workingDir) {
        return marker;
      }
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * Clean up active session marker (called when session ends)
 */
export function cleanupActiveRemoteSession(workingDir: string): void {
  const markerPath = getActiveSessionMarkerPath(workingDir);

  try {
    if (existsSync(markerPath)) {
      const { unlinkSync } = require('fs');
      unlinkSync(markerPath);
    }
  } catch {
    // Ignore errors during cleanup
  }
}

// ============================================================================
// Session Memory Note Mappings
// ============================================================================

/**
 * Store or update a session → memory note mapping
 */
export function storeSessionMemoryMapping(mapping: SessionMemoryMapping): void {
  const config = loadConfig() || {} as BridgeConfig;

  if (!config.sessionMemoryNotes) {
    config.sessionMemoryNotes = [];
  }

  // Upsert by claudeSessionId
  const idx = config.sessionMemoryNotes.findIndex(
    m => m.claudeSessionId === mapping.claudeSessionId
  );

  if (idx >= 0) {
    config.sessionMemoryNotes[idx] = mapping;
  } else {
    config.sessionMemoryNotes.push(mapping);
  }

  saveConfig(config);
}

/**
 * Look up a memory note ID by Claude session ID
 */
export function getSessionMemoryMapping(claudeSessionId: string): SessionMemoryMapping | undefined {
  const config = loadConfig();
  return config?.sessionMemoryNotes?.find(m => m.claudeSessionId === claudeSessionId);
}

/**
 * Touch the lastUpdatedAt timestamp for a mapping
 */
export function touchSessionMemoryMapping(claudeSessionId: string): void {
  const config = loadConfig();
  if (!config?.sessionMemoryNotes) return;

  const mapping = config.sessionMemoryNotes.find(m => m.claudeSessionId === claudeSessionId);
  if (mapping) {
    mapping.lastUpdatedAt = new Date().toISOString();
    saveConfig(config);
  }
}

/**
 * Remove stale memory mappings older than maxAgeDays
 */
export function cleanupStaleSessionMemoryMappings(maxAgeDays: number = 30): number {
  const config = loadConfig();
  if (!config?.sessionMemoryNotes || config.sessionMemoryNotes.length === 0) {
    return 0;
  }

  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const before = config.sessionMemoryNotes.length;

  config.sessionMemoryNotes = config.sessionMemoryNotes.filter(
    m => new Date(m.lastUpdatedAt).getTime() > cutoff
  );

  const removed = before - config.sessionMemoryNotes.length;
  if (removed > 0) {
    saveConfig(config);
  }

  return removed;
}
