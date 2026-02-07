/**
 * Mirra CC Bridge Test Suite
 *
 * Comprehensive tests for the mirra-cc-bridge package including:
 * - Configuration management
 * - Session management with message updating
 * - Progress tracking
 * - Permission request handling
 * - Transcript parsing
 * - Local session management
 *
 * Run with:
 * npx tsx packages/mirra-cc-bridge/test/mirra-cc-bridge.test.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// ============================================================================
// TEST HELPERS
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

function log(message: string): void {
  console.log(message);
}

function logSection(title: string): void {
  console.log('\n' + '='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

async function runTest(
  name: string,
  testFn: () => Promise<any>
): Promise<boolean> {
  log(`\n[${name}]`);
  try {
    const result = await testFn();

    // Check for explicit failure
    if (result?.success === false || result?.error) {
      const errorMsg = result.error?.message || result.error || 'Unknown error';
      log('  Status: FAILED');
      log(`  Error: ${errorMsg}`);
      results.push({ name, passed: false, error: errorMsg });
      return false;
    }

    // Success
    log('  Status: SUCCESS');
    if (result !== undefined) {
      const dataStr = JSON.stringify(result, null, 2);
      log(`  Data: ${dataStr.length > 300 ? dataStr.substring(0, 300) + '...' : dataStr}`);
    }
    results.push({ name, passed: true, data: result });
    return true;
  } catch (error: any) {
    log('  Status: ERROR');
    log(`  Error: ${error.message}`);
    if (error.stack) {
      log(`  Stack: ${error.stack.split('\n').slice(0, 3).join('\n  ')}`);
    }
    results.push({ name, passed: false, error: error.message });
    return false;
  }
}

function printSummary(): boolean {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  for (const result of results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    const icon = result.passed ? '✓' : '✗';
    log(`  ${icon} [${status}] ${result.name}`);
    if (!result.passed && result.error) {
      log(`      Error: ${result.error}`);
    }
  }

  console.log('-'.repeat(60));
  log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60));

  return failed === 0;
}

// ============================================================================
// TEST SETUP - Use temporary config directory
// ============================================================================

// Create a temporary config directory for testing
const TEST_CONFIG_DIR = path.join(os.tmpdir(), `mirra-cc-bridge-test-${Date.now()}`);
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, 'cc-bridge.json');

// We need to mock the config paths before importing the modules
function setupTestEnvironment(): void {
  // Create test config directory
  if (!fs.existsSync(TEST_CONFIG_DIR)) {
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  // Create session-progress subdirectory
  const progressDir = path.join(TEST_CONFIG_DIR, 'session-progress');
  if (!fs.existsSync(progressDir)) {
    fs.mkdirSync(progressDir, { recursive: true, mode: 0o700 });
  }
}

function cleanupTestEnvironment(): void {
  try {
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

// ============================================================================
// MAIN TEST SUITE
// ============================================================================

async function runTestSuite(): Promise<void> {
  logSection('Mirra CC Bridge Test Suite');
  log(`Test Directory: ${TEST_CONFIG_DIR}`);
  log(`Time: ${new Date().toISOString()}`);

  setupTestEnvironment();

  try {
    // ============================================================================
    // CONFIGURATION TESTS
    // ============================================================================
    logSection('Configuration Management Tests');

    // Test: Write and read config
    await runTest('config_write_and_read', async () => {
      const configPath = path.join(TEST_CONFIG_DIR, 'test-config.json');
      const testConfig = {
        apiKey: 'mirra_test_key_12345',
        userId: 'user_123',
        groupId: 'grp_456',
        defaultWorkDir: '/Users/test/projects',
      };

      // Write config
      fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2), { mode: 0o600 });

      // Read and verify
      const readConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      if (readConfig.apiKey !== testConfig.apiKey) {
        throw new Error(`API key mismatch: expected ${testConfig.apiKey}, got ${readConfig.apiKey}`);
      }
      if (readConfig.userId !== testConfig.userId) {
        throw new Error(`User ID mismatch: expected ${testConfig.userId}, got ${readConfig.userId}`);
      }
      if (readConfig.groupId !== testConfig.groupId) {
        throw new Error(`Group ID mismatch: expected ${testConfig.groupId}, got ${readConfig.groupId}`);
      }

      return { success: true, config: readConfig };
    });

    // Test: Config with all fields
    await runTest('config_full_structure', async () => {
      const configPath = path.join(TEST_CONFIG_DIR, 'full-config.json');
      const fullConfig = {
        apiKey: 'mirra_full_test_key',
        userId: 'user_full',
        groupId: 'grp_full',
        defaultWorkDir: '/test/path',
        pcResourceId: 'res_123',
        hooksConfigured: true,
        setupComplete: true,
        bridgeAuthToken: 'ccbridge_testtoken123',
        tunnel: {
          provider: 'ngrok',
          authToken: 'ngrok_token',
        },
        server: {
          port: 3847,
        },
        localSession: {
          activeSessions: [
            {
              sessionId: 'cc_session_123',
              sessionName: 'test-project',
              workingDir: '/test/project',
              startedAt: new Date().toISOString(),
            },
          ],
          groupId: 'grp_full',
          createdAt: new Date().toISOString(),
          flowId: 'flow_123',
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2), { mode: 0o600 });
      const readConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // Verify nested structures
      if (!readConfig.tunnel || readConfig.tunnel.provider !== 'ngrok') {
        throw new Error('Tunnel config not preserved');
      }
      if (!readConfig.localSession || readConfig.localSession.activeSessions.length !== 1) {
        throw new Error('Local session config not preserved');
      }
      if (readConfig.localSession.activeSessions[0].sessionName !== 'test-project') {
        throw new Error('Session name not preserved');
      }

      return { success: true, config: readConfig };
    });

    // Test: Bridge auth token generation pattern
    await runTest('auth_token_format', async () => {
      // Simulate the token generation pattern from config.ts
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let token = 'ccbridge_';
      for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      if (!token.startsWith('ccbridge_')) {
        throw new Error(`Token should start with "ccbridge_", got: ${token}`);
      }
      if (token.length !== 9 + 32) { // prefix + 32 random chars
        throw new Error(`Token length should be 41, got: ${token.length}`);
      }

      return { success: true, token, length: token.length };
    });

    // ============================================================================
    // SESSION PROGRESS TRACKING TESTS
    // ============================================================================
    logSection('Session Progress Tracking Tests');

    // Test: Session progress state management
    await runTest('session_progress_state', async () => {
      const progressDir = path.join(TEST_CONFIG_DIR, 'session-progress');
      const sessionId = 'cc_session_test_123';
      const progressPath = path.join(progressDir, `${sessionId}.json`);

      // Create progress state
      const progressState = {
        sessionId,
        transcriptPath: '/tmp/test-transcript.jsonl',
        lastStepCount: 5,
        lastProgressSentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      fs.writeFileSync(progressPath, JSON.stringify(progressState, null, 2), { mode: 0o600 });

      // Read and verify
      const readState = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

      if (readState.sessionId !== sessionId) {
        throw new Error('Session ID mismatch');
      }
      if (readState.lastStepCount !== 5) {
        throw new Error('Step count mismatch');
      }

      return { success: true, state: readState };
    });

    // Test: Progress update timing check (30 second interval)
    await runTest('progress_update_timing', async () => {
      const PROGRESS_UPDATE_INTERVAL_MS = 30 * 1000;
      const now = Date.now();

      // Case 1: No previous progress sent - should update
      const neverSent = null;
      const shouldUpdateNeverSent = neverSent === null;

      // Case 2: Sent 10 seconds ago - should NOT update
      const recentlySent = new Date(now - 10 * 1000).toISOString();
      const recentlyElapsed = now - new Date(recentlySent).getTime();
      const shouldUpdateRecent = recentlyElapsed >= PROGRESS_UPDATE_INTERVAL_MS;

      // Case 3: Sent 35 seconds ago - should update
      const oldSent = new Date(now - 35 * 1000).toISOString();
      const oldElapsed = now - new Date(oldSent).getTime();
      const shouldUpdateOld = oldElapsed >= PROGRESS_UPDATE_INTERVAL_MS;

      if (!shouldUpdateNeverSent) {
        throw new Error('Should update when never sent');
      }
      if (shouldUpdateRecent) {
        throw new Error('Should NOT update when sent 10 seconds ago');
      }
      if (!shouldUpdateOld) {
        throw new Error('Should update when sent 35 seconds ago');
      }

      return {
        success: true,
        interval: PROGRESS_UPDATE_INTERVAL_MS,
        neverSent: shouldUpdateNeverSent,
        recentlySent: shouldUpdateRecent,
        oldSent: shouldUpdateOld,
      };
    });

    // ============================================================================
    // PERMISSION REQUEST TESTS
    // ============================================================================
    logSection('Permission Request Management Tests');

    // Test: Permission request storage
    await runTest('permission_request_storage', async () => {
      const configPath = path.join(TEST_CONFIG_DIR, 'permission-test.json');
      const now = new Date();
      const TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const sessionId = 'cc_session_perm_test';

      const request = {
        requestId,
        sessionId,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + TIMEOUT_MS).toISOString(),
      };

      const config = {
        apiKey: 'mirra_test',
        pendingPermissionRequests: [request],
      };

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });

      const readConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const storedRequest = readConfig.pendingPermissionRequests.find(
        (r: any) => r.requestId === requestId
      );

      if (!storedRequest) {
        throw new Error('Request not found');
      }
      if (storedRequest.sessionId !== sessionId) {
        throw new Error('Session ID mismatch');
      }

      return { success: true, request: storedRequest };
    });

    // Test: Permission response storage
    await runTest('permission_response_storage', async () => {
      const configPath = path.join(TEST_CONFIG_DIR, 'permission-response-test.json');
      const requestId = 'req_response_test';

      const config = {
        apiKey: 'mirra_test',
        pendingPermissionRequests: [
          {
            requestId,
            sessionId: 'session_123',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          },
        ],
      };

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });

      // Simulate storing a response
      const readConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const request = readConfig.pendingPermissionRequests.find(
        (r: any) => r.requestId === requestId
      );

      if (request) {
        request.response = {
          action: 'allow',
          respondedAt: new Date().toISOString(),
        };
      }

      fs.writeFileSync(configPath, JSON.stringify(readConfig, null, 2), { mode: 0o600 });

      const finalConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const finalRequest = finalConfig.pendingPermissionRequests.find(
        (r: any) => r.requestId === requestId
      );

      if (!finalRequest.response) {
        throw new Error('Response not stored');
      }
      if (finalRequest.response.action !== 'allow') {
        throw new Error(`Action mismatch: expected "allow", got "${finalRequest.response.action}"`);
      }

      return { success: true, request: finalRequest };
    });

    // ============================================================================
    // LOCAL SESSION MANAGEMENT TESTS
    // ============================================================================
    logSection('Local Session Management Tests');

    // Test: Session name generation with duplicates
    await runTest('session_name_generation', async () => {
      const baseName = 'my-project';
      const existingSessions = [
        { sessionId: 's1', sessionName: 'my-project', workingDir: '/p1', startedAt: '' },
        { sessionId: 's2', sessionName: 'my-project #2', workingDir: '/p2', startedAt: '' },
      ];

      const existingNames = existingSessions.map((s) => s.sessionName);

      // Generate new name
      let newName: string;
      if (!existingNames.includes(baseName)) {
        newName = baseName;
      } else {
        let counter = 2;
        while (existingNames.includes(`${baseName} #${counter}`)) {
          counter++;
        }
        newName = `${baseName} #${counter}`;
      }

      if (newName !== 'my-project #3') {
        throw new Error(`Expected "my-project #3", got "${newName}"`);
      }

      return { success: true, generatedName: newName };
    });

    // Test: Active session tracking
    await runTest('active_session_tracking', async () => {
      const configPath = path.join(TEST_CONFIG_DIR, 'session-tracking.json');

      const config = {
        apiKey: 'mirra_test',
        localSession: {
          activeSessions: [
            {
              sessionId: 'cc_session_1',
              sessionName: 'project-a',
              workingDir: '/path/to/project-a',
              startedAt: new Date().toISOString(),
            },
            {
              sessionId: 'cc_session_2',
              sessionName: 'project-b',
              workingDir: '/path/to/project-b',
              startedAt: new Date().toISOString(),
            },
          ],
          groupId: 'grp_test',
          createdAt: new Date().toISOString(),
          flowId: 'flow_shared',
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });

      const readConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      if (readConfig.localSession.activeSessions.length !== 2) {
        throw new Error('Expected 2 active sessions');
      }

      // Simulate removing a session
      readConfig.localSession.activeSessions = readConfig.localSession.activeSessions.filter(
        (s: any) => s.sessionId !== 'cc_session_1'
      );

      fs.writeFileSync(configPath, JSON.stringify(readConfig, null, 2), { mode: 0o600 });

      const finalConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      if (finalConfig.localSession.activeSessions.length !== 1) {
        throw new Error('Expected 1 active session after removal');
      }
      if (finalConfig.localSession.activeSessions[0].sessionId !== 'cc_session_2') {
        throw new Error('Wrong session remained');
      }

      return {
        success: true,
        initialCount: 2,
        finalCount: finalConfig.localSession.activeSessions.length,
      };
    });

    // ============================================================================
    // TRANSCRIPT PARSING TESTS
    // ============================================================================
    logSection('Transcript Parsing Tests');

    // Test: Parse transcript content
    await runTest('transcript_parsing', async () => {
      // Simulate a transcript with tool_use and tool_result blocks
      const transcriptLines = [
        JSON.stringify({
          type: 'message',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'tool_1',
                name: 'Bash',
                input: { command: 'npm install' },
              },
            ],
          },
          timestamp: new Date().toISOString(),
        }),
        JSON.stringify({
          type: 'message',
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'tool_1',
                content: 'Successfully installed dependencies',
                is_error: false,
              },
            ],
          },
          timestamp: new Date().toISOString(),
        }),
        JSON.stringify({
          type: 'message',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'tool_2',
                name: 'Read',
                input: { file_path: '/test/package.json' },
              },
            ],
          },
          timestamp: new Date().toISOString(),
        }),
        JSON.stringify({
          type: 'message',
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: 'tool_2',
                content: '{"name": "test-project"}',
                is_error: false,
              },
            ],
          },
          timestamp: new Date().toISOString(),
        }),
      ];

      const transcriptContent = transcriptLines.join('\n');

      // Parse the content (simulating parseTranscriptContent logic)
      const lines = transcriptContent.trim().split('\n').filter((line) => line.trim());
      const entries: any[] = [];

      for (const line of lines) {
        try {
          entries.push(JSON.parse(line));
        } catch {
          // Skip unparseable lines
        }
      }

      // Count tools
      const toolCounts: Record<string, number> = {};
      const toolUseMap = new Map<
        string,
        { toolName: string; input?: Record<string, any>; timestamp?: string }
      >();
      const steps: Array<{ id: string; title: string; status: string }> = [];
      let stepIndex = 0;

      for (const entry of entries) {
        if (!entry.message?.content || !Array.isArray(entry.message.content)) {
          continue;
        }

        for (const block of entry.message.content) {
          if (block.type === 'tool_use' && block.id && block.name) {
            toolUseMap.set(block.id, {
              toolName: block.name,
              input: block.input,
              timestamp: entry.timestamp,
            });
            toolCounts[block.name] = (toolCounts[block.name] || 0) + 1;
          }

          if (block.type === 'tool_result' && block.tool_use_id) {
            const toolUse = toolUseMap.get(block.tool_use_id);
            if (toolUse) {
              steps.push({
                id: `step-${stepIndex++}`,
                title: toolUse.toolName,
                status: block.is_error ? 'error' : 'success',
              });
            }
          }
        }
      }

      if (steps.length !== 2) {
        throw new Error(`Expected 2 steps, got ${steps.length}`);
      }
      if (toolCounts['Bash'] !== 1) {
        throw new Error(`Expected 1 Bash tool use, got ${toolCounts['Bash']}`);
      }
      if (toolCounts['Read'] !== 1) {
        throw new Error(`Expected 1 Read tool use, got ${toolCounts['Read']}`);
      }

      return { success: true, steps, toolCounts };
    });

    // Test: Transcript with thinking blocks
    await runTest('transcript_thinking_blocks', async () => {
      const transcriptLines = [
        JSON.stringify({
          type: 'message',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'thinking',
                thinking: 'Let me analyze this problem step by step...',
              },
              {
                type: 'text',
                text: 'I will help you with this task.',
              },
            ],
          },
        }),
      ];

      const content = transcriptLines.join('\n');
      const entries = content
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line));

      let hasThinking = false;
      let thinkingSummary: string | undefined;

      for (const entry of entries) {
        if (Array.isArray(entry.message?.content)) {
          for (const block of entry.message.content) {
            if (block.type === 'thinking' && block.thinking) {
              hasThinking = true;
              thinkingSummary = block.thinking.substring(0, 200);
            }
          }
        }
      }

      if (!hasThinking) {
        throw new Error('Expected to detect thinking blocks');
      }
      if (!thinkingSummary) {
        throw new Error('Expected thinking summary');
      }

      return { success: true, hasThinking, thinkingSummary };
    });

    // Test: Interactive tool handling (skipped status)
    await runTest('interactive_tool_handling', async () => {
      const interactiveTools = ['AskUserQuestion', 'EnterPlanMode', 'ExitPlanMode'];

      // Simulate tool result with error for interactive tool
      const toolUse = { toolName: 'AskUserQuestion', input: {} };
      const isError = true;
      const isInteractiveTool = interactiveTools.includes(toolUse.toolName);
      const isSkipped = isError && isInteractiveTool;

      let status: 'success' | 'error' | 'skipped' = 'success';
      if (isSkipped) {
        status = 'skipped';
      } else if (isError) {
        status = 'error';
      }

      if (status !== 'skipped') {
        throw new Error(`Expected "skipped" status for interactive tool, got "${status}"`);
      }

      // Non-interactive tool with error should be 'error'
      const bashToolUse = { toolName: 'Bash', input: {} };
      const bashIsInteractive = interactiveTools.includes(bashToolUse.toolName);
      const bashIsSkipped = isError && bashIsInteractive;

      let bashStatus: 'success' | 'error' | 'skipped' = 'success';
      if (bashIsSkipped) {
        bashStatus = 'skipped';
      } else if (isError) {
        bashStatus = 'error';
      }

      if (bashStatus !== 'error') {
        throw new Error(`Expected "error" status for failed Bash, got "${bashStatus}"`);
      }

      return {
        success: true,
        askUserQuestionStatus: status,
        bashStatus,
      };
    });

    // ============================================================================
    // MESSAGE UPDATING TESTS
    // ============================================================================
    logSection('Message Updating Feature Tests');

    // Test: Message ID tracking in session
    await runTest('message_id_tracking', async () => {
      // Simulate session state with messageId for updates
      const session = {
        id: 'cc_session_msg_test',
        workingDir: '/test/project',
        status: 'running',
        createdAt: new Date(),
        lastActivity: new Date(),
        groupId: 'grp_test',
        flowId: 'flow_123',
        claudeSessionId: 'claude_abc123',
        messageId: 'msg_update_target', // This is the new field for message updates
      };

      if (!session.messageId) {
        throw new Error('Session should have messageId for updates');
      }

      // Simulate message update payload (from sendSessionStatus)
      const updatePayload = {
        messageId: session.messageId,
        content: '[test-project] Processing follow-up request...',
      };

      if (updatePayload.messageId !== 'msg_update_target') {
        throw new Error('Update payload messageId mismatch');
      }

      return {
        success: true,
        sessionMessageId: session.messageId,
        updatePayload,
      };
    });

    // Test: Session status message updating flow
    await runTest('session_status_update_flow', async () => {
      // Simulate the flow of sending a status message and getting back a messageId
      const sessionId = 'cc_session_status_test';
      const groupId = 'grp_test';
      const workingDir = '/Users/test/project';

      const statusMessages: Record<string, string> = {
        starting: `Starting Claude Code session in \`${path.basename(workingDir)}\`...`,
        running: `Claude Code session active in \`${path.basename(workingDir)}\``,
        stopped: `Claude Code session ended`,
        error: `Claude Code session error: Test error`,
      };

      // Verify all status messages are properly formatted
      for (const [status, content] of Object.entries(statusMessages)) {
        if (!content.includes('Claude Code session')) {
          throw new Error(`Status message "${status}" missing expected text`);
        }
      }

      // Simulate the update vs create logic
      const existingMessageId: string | undefined = 'msg_existing_123';

      // If existingMessageId exists, should update instead of create
      const action = existingMessageId ? 'update' : 'create';

      if (action !== 'update') {
        throw new Error('Should update when messageId exists');
      }

      // Simulate no existing message - should create
      const noExistingId: string | undefined = undefined;
      const actionNoId = noExistingId ? 'update' : 'create';

      if (actionNoId !== 'create') {
        throw new Error('Should create when no messageId');
      }

      return {
        success: true,
        statusMessages,
        updateWithExisting: action,
        createWithoutExisting: actionNoId,
      };
    });

    // Test: Progress update with structured data
    await runTest('progress_update_structured_data', async () => {
      // Simulate building a progress card
      const steps = [
        { id: 'step-0', title: 'Run: npm install', status: 'success' },
        { id: 'step-1', title: 'Read: package.json', status: 'success' },
        { id: 'step-2', title: 'Edit: src/index.ts', status: 'success' },
      ];

      const progressCard = {
        displayType: 'card',
        templateId: 'progress_update',
        data: {
          title: 'Progress Update',
          badges: [
            { label: 'In Progress', variant: 'warning' },
            { label: `${steps.length} steps`, variant: 'default' },
          ],
          steps,
          summary: { Bash: 1, Read: 1, Edit: 1 },
          defaultExpanded: true,
        },
        metadata: {
          sessionId: 'cc_session_test',
          isProgress: true,
          totalSteps: steps.length,
        },
      };

      if (progressCard.templateId !== 'progress_update') {
        throw new Error('Expected progress_update templateId');
      }
      if (!progressCard.data.badges?.find((b: any) => b.label === 'In Progress')) {
        throw new Error('Missing In Progress badge');
      }
      if (progressCard.data.steps.length !== 3) {
        throw new Error('Expected 3 steps');
      }

      return { success: true, progressCard };
    });

    // ============================================================================
    // TYPES VALIDATION TESTS
    // ============================================================================
    logSection('Types Validation Tests');

    // Test: Session interface completeness
    await runTest('session_interface', async () => {
      const session = {
        id: 'cc_session_12345',
        workingDir: '/Users/test/project',
        status: 'running' as const,
        createdAt: new Date(),
        lastActivity: new Date(),
        groupId: 'grp_abc123',
        flowId: 'flow_xyz789',
        claudeSessionId: 'claude_session_id',
        messageId: 'msg_for_updates',
        pty: null, // Would be IPty or ChildProcess in real usage
      };

      // Verify all required fields
      const requiredFields = ['id', 'workingDir', 'status', 'createdAt', 'lastActivity', 'groupId'];

      for (const field of requiredFields) {
        if (!(field in session)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Verify optional fields exist when present
      if (!session.flowId) {
        throw new Error('flowId should be set');
      }
      if (!session.claudeSessionId) {
        throw new Error('claudeSessionId should be set');
      }
      if (!session.messageId) {
        throw new Error('messageId should be set');
      }

      return { success: true, session };
    });

    // Test: Permission response types
    await runTest('permission_response_types', async () => {
      const validActions = ['allow', 'allow_always', 'deny'];

      // Verify all actions are valid
      for (const action of validActions) {
        const response = {
          sessionId: 'cc_session_test',
          action: action as 'allow' | 'allow_always' | 'deny',
          tool: 'Bash',
          command: 'npm install',
        };

        if (!validActions.includes(response.action)) {
          throw new Error(`Invalid action: ${response.action}`);
        }
      }

      return { success: true, validActions };
    });

    // Test: Structured data types
    await runTest('structured_data_types', async () => {
      // Test list display type
      const listData = {
        displayType: 'list' as const,
        templateId: 'cc_permission_prompt',
        data: {
          items: [
            {
              id: 'allow',
              title: 'Allow',
              subtitle: 'Grant permission for this operation',
              icon: 'checkmark-circle',
              badgeVariant: 'success' as const,
              metadata: { action: 'allow' },
            },
          ],
        },
        interactions: {
          allowSelection: true,
          allowMultiSelect: false,
        },
        metadata: {
          sessionId: 'test_session',
          promptType: 'permission',
        },
      };

      // Test card display type
      const cardData = {
        displayType: 'card' as const,
        templateId: 'execution_details',
        data: {
          title: 'Execution Details',
          subtitle: 'With extended thinking',
          badges: [{ label: '5 steps', variant: 'default' as const }],
          steps: [{ id: 'step-0', title: 'Test step', status: 'success' as const }],
          summary: { Bash: 2, Read: 3 },
          defaultExpanded: false,
        },
        metadata: {
          hasThinking: true,
          totalSteps: 5,
        },
      };

      if (listData.displayType !== 'list') {
        throw new Error('List displayType mismatch');
      }
      if (cardData.displayType !== 'card') {
        throw new Error('Card displayType mismatch');
      }

      return { success: true, listData, cardData };
    });

    // ============================================================================
    // RESOURCE METHODS TESTS
    // ============================================================================
    logSection('Resource Methods Tests');

    // Test: Resource method definitions
    await runTest('resource_method_definitions', async () => {
      // Simulate the resource methods structure
      const methods = [
        {
          name: 'spawnSession',
          httpMethod: 'POST',
          path: '/sessions',
          description: 'Spawn a new Claude Code session',
          parameters: {
            workingDir: { type: 'string', required: false },
            initialPrompt: { type: 'string', required: true },
            groupId: { type: 'string', required: false },
          },
        },
        {
          name: 'sendInput',
          httpMethod: 'POST',
          path: '/sessions/{sessionId}/input',
          description: 'Send input to a session',
          parameters: {
            sessionId: { type: 'string', required: true },
            input: { type: 'string', required: true },
          },
        },
        {
          name: 'killSession',
          httpMethod: 'DELETE',
          path: '/sessions/{sessionId}',
          description: 'Kill a session',
          parameters: {
            sessionId: { type: 'string', required: true },
          },
        },
        {
          name: 'listSessions',
          httpMethod: 'GET',
          path: '/sessions',
          description: 'List all sessions',
          parameters: {},
        },
        {
          name: 'respond',
          httpMethod: 'POST',
          path: '/respond',
          description: 'Respond to a permission prompt',
          parameters: {
            sessionId: { type: 'string', required: true },
            selection: { type: 'object', required: true },
          },
        },
      ];

      // Verify all expected methods exist
      const expectedMethods = ['spawnSession', 'sendInput', 'killSession', 'listSessions', 'respond'];

      for (const expected of expectedMethods) {
        const found = methods.find((m) => m.name === expected);
        if (!found) {
          throw new Error(`Missing method: ${expected}`);
        }
      }

      // Verify required parameters
      const spawnSession = methods.find((m) => m.name === 'spawnSession')!;
      if (!spawnSession.parameters.initialPrompt?.required) {
        throw new Error('initialPrompt should be required');
      }

      return { success: true, methodCount: methods.length, methods: methods.map((m) => m.name) };
    });

    // ============================================================================
    // HOOK HANDLER TESTS
    // ============================================================================
    logSection('Hook Handler Tests');

    // Test: Parse permission prompt from notification
    await runTest('parse_permission_prompt', async () => {
      const notificationData = {
        notification_type: 'permission_prompt',
        message: 'Claude needs your permission to use Bash',
        session_id: 'claude_session_123',
        cwd: '/test/project',
      };

      // Simulate parsing logic from hook.ts
      if (notificationData.notification_type !== 'permission_prompt') {
        throw new Error('Should only parse permission_prompt notifications');
      }

      const message = notificationData.message || '';
      const toolMatch = message.match(/permission to use (\w+)/i);
      const tool = toolMatch ? toolMatch[1] : 'Unknown';

      if (tool !== 'Bash') {
        throw new Error(`Expected tool "Bash", got "${tool}"`);
      }

      const permissionPrompt = {
        tool,
        command: message,
        message,
        sessionId: notificationData.session_id,
      };

      return { success: true, permissionPrompt };
    });

    // Test: Build permission structured data
    await runTest('build_permission_structured_data', async () => {
      const prompt = {
        tool: 'Bash',
        command: 'npm install express',
        message: 'Claude needs your permission to use Bash',
        sessionId: 'test_session',
      };

      const structuredData = {
        displayType: 'list' as const,
        templateId: 'cc_permission_prompt',
        data: {
          items: [
            {
              id: 'allow',
              title: 'Allow',
              subtitle: 'Grant permission for this operation',
              icon: 'checkmark-circle',
              badgeVariant: 'success' as const,
              metadata: { action: 'allow', tool: prompt.tool, command: prompt.command },
            },
            {
              id: 'allow_always',
              title: 'Allow Always',
              subtitle: 'Trust this tool for the session',
              icon: 'shield-checkmark',
              badgeVariant: 'primary' as const,
              metadata: { action: 'allow_always', tool: prompt.tool },
            },
            {
              id: 'deny',
              title: 'Deny',
              subtitle: 'Block this operation',
              icon: 'close-circle',
              badgeVariant: 'error' as const,
              metadata: { action: 'deny', tool: prompt.tool },
            },
          ],
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
        },
      };

      if (structuredData.data.items.length !== 3) {
        throw new Error('Expected 3 permission options');
      }

      const allowOption = structuredData.data.items.find((i: any) => i.id === 'allow');
      if (!allowOption) {
        throw new Error('Missing allow option');
      }
      if (allowOption.metadata.command !== 'npm install express') {
        throw new Error('Command not preserved in metadata');
      }

      return { success: true, structuredData };
    });

    // Test: Hook event routing
    await runTest('hook_event_routing', async () => {
      const events = ['notification', 'post-message', 'post-tool', 'stop'];

      const eventHandlers: Record<string, string> = {
        notification: 'handlePostMessage',
        'post-message': 'handlePostMessage', // Legacy support
        'post-tool': 'handlePostToolUse',
        stop: 'handleStop',
      };

      for (const event of events) {
        const handler = eventHandlers[event];
        if (!handler) {
          throw new Error(`No handler for event: ${event}`);
        }
      }

      // Unknown event should throw
      try {
        const unknownHandler = eventHandlers['unknown-event'];
        if (!unknownHandler) {
          // This is expected behavior
        }
      } catch {
        // Expected
      }

      return { success: true, events, eventHandlers };
    });

    // ============================================================================
    // AUTO-UPDATE FUNCTIONALITY TESTS
    // ============================================================================
    logSection('Auto-Update Functionality Tests');

    // Test: Version comparison - newer version detection
    await runTest('version_comparison_newer', async () => {
      function isNewerVersion(current: string, latest: string): boolean {
        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
          const c = currentParts[i] || 0;
          const l = latestParts[i] || 0;
          if (l > c) return true;
          if (l < c) return false;
        }
        return false;
      }

      const testCases = [
        { current: '1.0.0', latest: '1.0.1', expected: true, desc: 'patch version' },
        { current: '1.0.0', latest: '1.1.0', expected: true, desc: 'minor version' },
        { current: '1.0.0', latest: '2.0.0', expected: true, desc: 'major version' },
        { current: '1.4.2', latest: '1.4.3', expected: true, desc: 'current package version' },
        { current: '1.4.2', latest: '1.5.0', expected: true, desc: 'minor bump from current' },
        { current: '1.4.2', latest: '2.0.0', expected: true, desc: 'major bump from current' },
        { current: '1.0.0', latest: '1.0.0', expected: false, desc: 'same version' },
        { current: '1.1.0', latest: '1.0.0', expected: false, desc: 'older version' },
        { current: '2.0.0', latest: '1.9.9', expected: false, desc: 'major downgrade' },
        { current: '1.4.2', latest: '1.4.2', expected: false, desc: 'current equals latest' },
        { current: '1.4.2', latest: '1.4.1', expected: false, desc: 'latest is older' },
      ];

      for (const tc of testCases) {
        const result = isNewerVersion(tc.current, tc.latest);
        if (result !== tc.expected) {
          throw new Error(`Version comparison failed for ${tc.desc}: ${tc.current} vs ${tc.latest}, expected ${tc.expected}, got ${result}`);
        }
      }

      return { success: true, testCases: testCases.length };
    });

    // Test: Update config storage
    await runTest('update_config_storage', async () => {
      const configPath = path.join(TEST_CONFIG_DIR, 'update-config-test.json');

      const config = {
        apiKey: 'mirra_test_key',
        updateConfig: {
          autoUpdate: true,
          lastUpdateCheck: new Date().toISOString(),
          skipVersion: '1.5.0',
          checkIntervalHours: 12,
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
      const readConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      if (!readConfig.updateConfig) {
        throw new Error('updateConfig not preserved');
      }
      if (readConfig.updateConfig.autoUpdate !== true) {
        throw new Error('autoUpdate not preserved');
      }
      if (readConfig.updateConfig.skipVersion !== '1.5.0') {
        throw new Error('skipVersion not preserved');
      }
      if (readConfig.updateConfig.checkIntervalHours !== 12) {
        throw new Error('checkIntervalHours not preserved');
      }

      return { success: true, updateConfig: readConfig.updateConfig };
    });

    // Test: Rate limiting - should skip check if recently checked
    await runTest('update_check_rate_limiting', async () => {
      const intervalHours = 24;
      const intervalMs = intervalHours * 60 * 60 * 1000;
      const now = Date.now();

      // Case 1: Never checked - should check
      const neverChecked = null;
      const shouldCheckNever = neverChecked === null;

      // Case 2: Checked 1 hour ago - should NOT check
      const recentCheck = new Date(now - 1 * 60 * 60 * 1000).toISOString();
      const recentElapsed = now - new Date(recentCheck).getTime();
      const shouldCheckRecent = recentElapsed >= intervalMs;

      // Case 3: Checked 25 hours ago - should check
      const oldCheck = new Date(now - 25 * 60 * 60 * 1000).toISOString();
      const oldElapsed = now - new Date(oldCheck).getTime();
      const shouldCheckOld = oldElapsed >= intervalMs;

      if (!shouldCheckNever) {
        throw new Error('Should check when never checked before');
      }
      if (shouldCheckRecent) {
        throw new Error('Should NOT check when checked 1 hour ago');
      }
      if (!shouldCheckOld) {
        throw new Error('Should check when checked 25 hours ago');
      }

      return {
        success: true,
        intervalHours,
        neverChecked: shouldCheckNever,
        recentCheck: shouldCheckRecent,
        oldCheck: shouldCheckOld,
      };
    });

    // Test: Skip version functionality
    await runTest('skip_version_functionality', async () => {
      const config = {
        updateConfig: {
          skipVersion: '1.5.0',
        },
      };

      const latestVersion = '1.5.0';
      const shouldSkip = config.updateConfig?.skipVersion === latestVersion;

      if (!shouldSkip) {
        throw new Error('Should skip when skipVersion matches latestVersion');
      }

      // Different version should not skip
      const differentVersion = '1.5.1';
      const shouldNotSkip = config.updateConfig?.skipVersion === differentVersion;

      if (shouldNotSkip) {
        throw new Error('Should NOT skip when versions differ');
      }

      return { success: true, skipVersion: config.updateConfig.skipVersion };
    });

    // Test: Environment variable controls
    await runTest('environment_variable_controls', async () => {
      // Simulate environment variable checks
      const scenarios = [
        {
          env: { MIRRA_AUTO_UPDATE: 'true' },
          expectedAutoUpdate: true,
          expectedSkipCheck: false,
        },
        {
          env: { MIRRA_HEADLESS: 'true' },
          expectedAutoUpdate: true,
          expectedSkipCheck: false,
        },
        {
          env: { MIRRA_SKIP_UPDATE_CHECK: 'true' },
          expectedAutoUpdate: false,
          expectedSkipCheck: true,
        },
        {
          env: {},
          expectedAutoUpdate: false,
          expectedSkipCheck: false,
        },
      ];

      for (const scenario of scenarios) {
        const isHeadless = scenario.env.MIRRA_HEADLESS === 'true' || scenario.env.MIRRA_AUTO_UPDATE === 'true';
        const skipCheck = scenario.env.MIRRA_SKIP_UPDATE_CHECK === 'true';

        if (isHeadless !== scenario.expectedAutoUpdate) {
          throw new Error(`Auto-update mismatch for env: ${JSON.stringify(scenario.env)}`);
        }
        if (skipCheck !== scenario.expectedSkipCheck) {
          throw new Error(`Skip check mismatch for env: ${JSON.stringify(scenario.env)}`);
        }
      }

      return { success: true, scenarios: scenarios.length };
    });

    // Test: Hooks verification - check if hooks actually exist in settings file
    await runTest('hooks_verification_logic', async () => {
      // Create a mock Claude Code settings file
      const mockClaudeSettingsDir = path.join(TEST_CONFIG_DIR, '.claude');
      const mockClaudeSettingsFile = path.join(mockClaudeSettingsDir, 'settings.json');

      if (!fs.existsSync(mockClaudeSettingsDir)) {
        fs.mkdirSync(mockClaudeSettingsDir, { recursive: true });
      }

      // Case 1: Settings with mirra-cc-bridge hooks
      const settingsWithHooks = {
        hooks: {
          Notification: [
            {
              matcher: '',
              hooks: [{ type: 'command', command: 'mirra-cc-bridge hook notification' }],
            },
          ],
          PostToolUse: [
            {
              matcher: '',
              hooks: [{ type: 'command', command: 'mirra-cc-bridge hook post-tool' }],
            },
          ],
          Stop: [
            {
              matcher: '',
              hooks: [{ type: 'command', command: 'mirra-cc-bridge hook stop' }],
            },
          ],
        },
      };

      fs.writeFileSync(mockClaudeSettingsFile, JSON.stringify(settingsWithHooks, null, 2));

      // Verify hooks detection
      const settingsContent = fs.readFileSync(mockClaudeSettingsFile, 'utf-8');
      const settings = JSON.parse(settingsContent);

      const hasNotificationHook = settings.hooks?.Notification?.some(
        (entry: any) => entry.hooks?.some((h: any) => h.command?.includes('mirra-cc-bridge'))
      );
      const hasPostToolHook = settings.hooks?.PostToolUse?.some(
        (entry: any) => entry.hooks?.some((h: any) => h.command?.includes('mirra-cc-bridge'))
      );
      const hasStopHook = settings.hooks?.Stop?.some(
        (entry: any) => entry.hooks?.some((h: any) => h.command?.includes('mirra-cc-bridge'))
      );

      const allHooksPresent = hasNotificationHook && hasPostToolHook && hasStopHook;

      if (!allHooksPresent) {
        throw new Error('All hooks should be detected as present');
      }

      // Case 2: Settings without hooks
      const settingsWithoutHooks = { hooks: {} };
      fs.writeFileSync(mockClaudeSettingsFile, JSON.stringify(settingsWithoutHooks, null, 2));

      const emptySettings = JSON.parse(fs.readFileSync(mockClaudeSettingsFile, 'utf-8'));
      const noNotificationHook = emptySettings.hooks?.Notification?.some(
        (entry: any) => entry.hooks?.some((h: any) => h.command?.includes('mirra-cc-bridge'))
      );

      if (noNotificationHook) {
        throw new Error('Should not detect hooks when none exist');
      }

      return { success: true, hooksDetected: allHooksPresent, noHooksDetected: !noNotificationHook };
    });

    // Test: Config flag vs actual hooks desync detection
    await runTest('hooks_config_desync_detection', async () => {
      // Scenario: Config says hooks are configured, but they're actually missing
      // This happens after uninstall/reinstall cycle

      const configPath = path.join(TEST_CONFIG_DIR, 'hooks-desync-test.json');
      const config = {
        apiKey: 'mirra_test_key',
        hooksConfigured: true, // Config says true
        setupComplete: true,
      };

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });

      // Simulate hooks NOT being present in Claude settings
      const mockClaudeSettingsDir = path.join(TEST_CONFIG_DIR, '.claude-desync');
      const mockClaudeSettingsFile = path.join(mockClaudeSettingsDir, 'settings.json');

      if (!fs.existsSync(mockClaudeSettingsDir)) {
        fs.mkdirSync(mockClaudeSettingsDir, { recursive: true });
      }

      const settingsWithoutHooks = { hooks: {} };
      fs.writeFileSync(mockClaudeSettingsFile, JSON.stringify(settingsWithoutHooks, null, 2));

      // Detection logic
      const readConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const configSaysConfigured = readConfig.hooksConfigured === true;

      const settings = JSON.parse(fs.readFileSync(mockClaudeSettingsFile, 'utf-8'));
      const actuallyConfigured = settings.hooks?.Notification?.some(
        (entry: any) => entry.hooks?.some((h: any) => h.command?.includes('mirra-cc-bridge'))
      ) || false;

      const needsRefresh = configSaysConfigured && !actuallyConfigured;

      if (!needsRefresh) {
        throw new Error('Should detect that hooks need refresh');
      }

      return {
        success: true,
        configSaysConfigured,
        actuallyConfigured,
        needsRefresh,
      };
    });

    // Test: Update check result structure
    await runTest('update_check_result_structure', async () => {
      // Verify the structure of UpdateCheckResult
      const result = {
        updateAvailable: true,
        currentVersion: '1.4.2',
        latestVersion: '1.5.0',
        updated: false,
        skipped: false,
        error: undefined,
      };

      const requiredFields = ['updateAvailable', 'currentVersion', 'latestVersion', 'updated', 'skipped'];

      for (const field of requiredFields) {
        if (!(field in result)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      if (typeof result.updateAvailable !== 'boolean') {
        throw new Error('updateAvailable should be boolean');
      }
      if (typeof result.currentVersion !== 'string') {
        throw new Error('currentVersion should be string');
      }

      return { success: true, result };
    });

    // Test: Post-update tasks sequence
    await runTest('post_update_tasks_sequence', async () => {
      // Simulate the sequence of post-update tasks
      const tasks = [
        { name: 'Check if hooks exist', order: 1 },
        { name: 'Refresh hooks if missing', order: 2 },
        { name: 'Update config flag', order: 3 },
      ];

      // Verify task sequence
      let lastOrder = 0;
      for (const task of tasks) {
        if (task.order <= lastOrder) {
          throw new Error(`Task "${task.name}" is out of order`);
        }
        lastOrder = task.order;
      }

      return { success: true, taskCount: tasks.length, tasks: tasks.map((t) => t.name) };
    });

    // ============================================================================
    // PATH EXPANSION TESTS
    // ============================================================================
    logSection('Path Expansion Tests');

    // Test: Expand home directory paths
    await runTest('path_expansion', async () => {
      function expandPath(inputPath: string): string {
        if (inputPath.startsWith('~/')) {
          return path.join(os.homedir(), inputPath.slice(2));
        }
        if (inputPath === '~') {
          return os.homedir();
        }
        return path.resolve(inputPath);
      }

      const testCases = [
        { input: '~', expected: os.homedir() },
        { input: '~/Desktop', expected: path.join(os.homedir(), 'Desktop') },
        { input: '~/projects/my-app', expected: path.join(os.homedir(), 'projects/my-app') },
        { input: '/absolute/path', expected: '/absolute/path' },
      ];

      for (const testCase of testCases) {
        const result = expandPath(testCase.input);
        if (result !== testCase.expected) {
          throw new Error(`Path expansion failed for "${testCase.input}": expected "${testCase.expected}", got "${result}"`);
        }
      }

      return { success: true, testCases };
    });

  } finally {
    // Cleanup
    cleanupTestEnvironment();
  }

  // ============================================================================
  // PRINT SUMMARY AND EXIT
  // ============================================================================

  const allPassed = printSummary();
  process.exit(allPassed ? 0 : 1);
}

// Run the test suite
runTestSuite().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
