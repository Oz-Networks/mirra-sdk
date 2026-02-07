/**
 * Marketplace Resource Method Definitions for Claude Code Bridge
 *
 * Shared method definitions with examples for LLM documentation.
 * Used by register.ts and start.ts when creating/updating the resource.
 */

/**
 * Method example structure matching the backend MethodExample interface
 */
interface MethodExample {
  description: string;
  input: Record<string, any>;
  output: Record<string, any>;
  note?: string;
}

/**
 * Resource method structure matching the backend ResourceMethod interface
 */
interface ResourceMethod {
  name: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters: Record<string, { type: string; required: boolean; description?: string }>;
  response: { type: string; description?: string };
  examples?: MethodExample[];
}

/**
 * Get all resource method definitions with examples
 */
export function getResourceMethods(): ResourceMethod[] {
  return [
    {
      name: 'spawnSession',
      httpMethod: 'POST',
      path: '/sessions',
      description: 'Spawn a new Claude Code session on the connected PC. Returns session details including ID for subsequent operations. Sends an immediate confirmation message to the target group when the session starts.',
      parameters: {
        workingDir: {
          type: 'string',
          required: false,
          description: 'Working directory for the session. Defaults to bridge default if not specified.',
        },
        initialPrompt: {
          type: 'string',
          required: true,
          description: 'The initial prompt/task for Claude Code to work on.',
        },
        groupId: {
          type: 'string',
          required: false,
          description: 'Target group ID where session output will be sent. IMPORTANT: Pass the group ID from the current conversation context to route responses back to the same group. Only falls back to bridge configured default if not provided.',
        },
      },
      response: {
        type: 'object',
        description: 'Session object with id, workingDir, status, timestamps, and optional flowId.',
      },
      examples: [
        {
          description: 'Spawn a session to create a README file',
          input: {
            workingDir: '/Users/developer/projects/my-app',
            initialPrompt: 'Create a README.md file documenting the project structure',
            groupId: 'grp_abc123',
          },
          output: {
            id: 'cc_session_1705081234567_x7k9m',
            workingDir: '/Users/developer/projects/my-app',
            status: 'running',
            createdAt: '2024-01-12T15:30:45.123Z',
            lastActivity: '2024-01-12T15:30:45.123Z',
            flowId: 'flow_xyz789',
          },
        },
        {
          description: 'Spawn a session with default working directory',
          input: {
            initialPrompt: 'List all TypeScript files in the current directory',
          },
          output: {
            id: 'cc_session_1705081234999_a2b3c',
            workingDir: '/Users/developer',
            status: 'running',
            createdAt: '2024-01-12T15:35:00.000Z',
            lastActivity: '2024-01-12T15:35:00.000Z',
          },
          note: 'When workingDir is omitted, the bridge uses its configured default directory',
        },
      ],
    },
    {
      name: 'sendInput',
      httpMethod: 'POST',
      path: '/sessions/{sessionId}/input',
      description: 'Send text input to an active Claude Code session. Use this to provide follow-up instructions or answer questions.',
      parameters: {
        sessionId: {
          type: 'string',
          required: true,
          description: 'The session ID returned from spawnSession.',
        },
        input: {
          type: 'string',
          required: true,
          description: 'The text input to send to Claude Code.',
        },
      },
      response: {
        type: 'object',
        description: 'Confirmation of input sent with session status.',
      },
      examples: [
        {
          description: 'Send follow-up instructions to a session',
          input: {
            sessionId: 'cc_session_1705081234567_x7k9m',
            input: 'Also add a section about installation steps',
          },
          output: {
            success: true,
            sessionId: 'cc_session_1705081234567_x7k9m',
            status: 'running',
          },
        },
        {
          description: 'Answer a question from Claude Code',
          input: {
            sessionId: 'cc_session_1705081234567_x7k9m',
            input: 'Yes, use TypeScript for the implementation',
          },
          output: {
            success: true,
            sessionId: 'cc_session_1705081234567_x7k9m',
            status: 'running',
          },
        },
      ],
    },
    {
      name: 'killSession',
      httpMethod: 'DELETE',
      path: '/sessions/{sessionId}',
      description: 'Terminate an active Claude Code session. Cleans up resources and stops the process.',
      parameters: {
        sessionId: {
          type: 'string',
          required: true,
          description: 'The session ID to terminate.',
        },
      },
      response: {
        type: 'object',
        description: 'Confirmation of session termination.',
      },
      examples: [
        {
          description: 'Kill a running session',
          input: {
            sessionId: 'cc_session_1705081234567_x7k9m',
          },
          output: {
            success: true,
            sessionId: 'cc_session_1705081234567_x7k9m',
            status: 'stopped',
            message: 'Session terminated successfully',
          },
        },
      ],
    },
    {
      name: 'listSessions',
      httpMethod: 'GET',
      path: '/sessions',
      description: 'List all active Claude Code sessions on the connected PC.',
      parameters: {},
      response: {
        type: 'array',
        description: 'Array of active session objects.',
      },
      examples: [
        {
          description: 'List all active sessions',
          input: {},
          output: [
            {
              id: 'cc_session_1705081234567_x7k9m',
              workingDir: '/Users/developer/projects/my-app',
              status: 'running',
              createdAt: '2024-01-12T15:30:45.123Z',
              lastActivity: '2024-01-12T15:32:00.000Z',
            },
            {
              id: 'cc_session_1705081234999_a2b3c',
              workingDir: '/Users/developer/projects/other-app',
              status: 'running',
              createdAt: '2024-01-12T15:35:00.000Z',
              lastActivity: '2024-01-12T15:35:30.000Z',
            },
          ],
        },
        {
          description: 'Empty session list',
          input: {},
          output: [],
          note: 'Returns empty array when no sessions are active',
        },
      ],
    },
    {
      name: 'listClaudeCodeSessions',
      httpMethod: 'GET',
      path: '/claude-sessions',
      description: 'List resumable Claude Code sessions from the connected PC. Returns sessions that can be resumed with --resume flag. Use this to find recent sessions and let users choose one to continue.',
      parameters: {
        limit: {
          type: 'number',
          required: false,
          description: 'Maximum number of sessions to return. Defaults to 20.',
        },
        projectPath: {
          type: 'string',
          required: false,
          description: 'Filter to sessions from a specific project path.',
        },
        search: {
          type: 'string',
          required: false,
          description: 'Search term to filter sessions by summary or first prompt.',
        },
      },
      response: {
        type: 'object',
        description: 'Object containing sessions array and structuredData for mobile rendering.',
      },
      examples: [
        {
          description: 'List recent Claude Code sessions',
          input: {},
          output: {
            sessions: [
              {
                id: 'a9712ad2-0169-4856-ae9a-a933e941bc73',
                summary: 'Task visibility bug in group graphs fixed',
                firstPrompt: 'check out this task created...',
                messageCount: 8,
                projectPath: '/Users/developer/projects/my-app',
                projectName: 'my-app',
                gitBranch: 'main',
                createdAt: '2024-01-29T22:51:19.432Z',
                modifiedAt: '2024-01-29T22:54:38.918Z',
              },
            ],
            structuredData: [
              {
                displayType: 'list',
                templateId: 'claude_sessions_list',
                data: {
                  items: [
                    {
                      id: 'a9712ad2-0169-4856-ae9a-a933e941bc73',
                      title: 'Task visibility bug in group graphs fixed',
                      subtitle: 'my-app (main) - 8 messages',
                      icon: 'terminal',
                      badge: '2h ago',
                    },
                  ],
                },
                interactions: {
                  allowSelection: true,
                  primaryAction: 'resume',
                },
              },
            ],
          },
        },
        {
          description: 'Search for sessions about authentication',
          input: {
            search: 'auth',
            limit: 5,
          },
          output: {
            sessions: [],
            structuredData: [
              {
                displayType: 'list',
                templateId: 'claude_sessions_list',
                data: { items: [] },
                interactions: { allowSelection: true, primaryAction: 'resume' },
              },
            ],
          },
          note: 'Returns empty list when no sessions match the search term',
        },
      ],
    },
    {
      name: 'resumeSession',
      httpMethod: 'POST',
      path: '/sessions/resume',
      description: 'Resume an existing Claude Code session from the session list. Use after listing sessions with listClaudeCodeSessions - takes a claudeSessionId from the list and a new prompt to continue working.',
      parameters: {
        claudeSessionId: {
          type: 'string',
          required: true,
          description: 'The Claude Code session UUID from listClaudeCodeSessions results (metadata.sessionId).',
        },
        prompt: {
          type: 'string',
          required: true,
          description: 'What to work on next in the resumed session.',
        },
        groupId: {
          type: 'string',
          required: false,
          description: 'Target group ID where session output will be sent. IMPORTANT: Pass the group ID from the current conversation context. Falls back to bridge configured default.',
        },
        workingDir: {
          type: 'string',
          required: false,
          description: 'Project directory for the session. Use metadata.projectPath from the session list entry.',
        },
      },
      response: {
        type: 'object',
        description: 'Session object with id, workingDir, status, timestamps, and optional flowId.',
      },
      examples: [
        {
          description: 'Resume a session to continue working on a bug fix',
          input: {
            claudeSessionId: 'a9712ad2-0169-4856-ae9a-a933e941bc73',
            prompt: 'Continue fixing the authentication bug - also add unit tests',
            groupId: 'grp_abc123',
            workingDir: '/Users/developer/projects/my-app',
          },
          output: {
            id: 'cc_session_1705081234567_x7k9m',
            workingDir: '/Users/developer/projects/my-app',
            status: 'running',
            createdAt: '2024-01-12T15:30:45.123Z',
            lastActivity: '2024-01-12T15:30:45.123Z',
            flowId: 'flow_xyz789',
          },
        },
        {
          description: 'Resume a session with minimal parameters',
          input: {
            claudeSessionId: 'b8823cd3-1279-5967-bf0b-b044f052cd84',
            prompt: 'What did we do last time? Continue from where we left off.',
          },
          output: {
            id: 'cc_session_1705081235000_m4n5o',
            workingDir: '/Users/developer',
            status: 'running',
            createdAt: '2024-01-12T16:00:00.000Z',
            lastActivity: '2024-01-12T16:00:00.000Z',
          },
          note: 'When workingDir is omitted, the bridge uses its configured default directory',
        },
      ],
    },
    {
      name: 'respond',
      httpMethod: 'POST',
      path: '/respond',
      description: 'Respond to a permission prompt from Claude Code. Use to allow or deny tool executions.',
      parameters: {
        sessionId: {
          type: 'string',
          required: true,
          description: 'The session ID that triggered the permission prompt.',
        },
        selection: {
          type: 'object',
          required: true,
          description: 'Response selection with id, action (allow/allow_always/deny), and optional metadata.',
        },
      },
      response: {
        type: 'object',
        description: 'Confirmation of response sent.',
      },
      examples: [
        {
          description: 'Allow a single Bash command',
          input: {
            sessionId: 'cc_session_1705081234567_x7k9m',
            selection: {
              id: 'perm_req_123',
              action: 'allow',
              metadata: { tool: 'Bash', command: 'npm install' },
            },
          },
          output: {
            success: true,
            sessionId: 'cc_session_1705081234567_x7k9m',
            action: 'allow',
          },
        },
        {
          description: 'Always allow file edits in this session',
          input: {
            sessionId: 'cc_session_1705081234567_x7k9m',
            selection: {
              id: 'perm_req_456',
              action: 'allow_always',
              metadata: { tool: 'Edit' },
            },
          },
          output: {
            success: true,
            sessionId: 'cc_session_1705081234567_x7k9m',
            action: 'allow_always',
          },
          note: 'allow_always permits all future requests of this type in the session',
        },
        {
          description: 'Deny a potentially dangerous command',
          input: {
            sessionId: 'cc_session_1705081234567_x7k9m',
            selection: {
              id: 'perm_req_789',
              action: 'deny',
              metadata: { tool: 'Bash', command: 'rm -rf /' },
            },
          },
          output: {
            success: true,
            sessionId: 'cc_session_1705081234567_x7k9m',
            action: 'deny',
          },
        },
      ],
    },
  ];
}

/**
 * Get method definitions for the basic set (without respond)
 * Used in register.ts which has a simpler method set
 */
export function getBasicResourceMethods(): ResourceMethod[] {
  return getResourceMethods().filter(m => m.name !== 'respond');
}

/**
 * Convert methods to the format expected by sdk.resources.create/update
 * This strips TypeScript-specific fields and converts to plain objects
 */
export function toSDKMethods(methods: ResourceMethod[]): any[] {
  return methods.map(m => ({
    name: m.name,
    httpMethod: m.httpMethod,
    path: m.path,
    description: m.description,
    parameters: m.parameters,
    response: m.response,
    examples: m.examples,
  }));
}
