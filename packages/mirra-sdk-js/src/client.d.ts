/**
 * Mirra SDK Client
 */
import { MirraSDKConfig, MemoryEntity, MemoryEntityWithId, MemorySearchQuery, MemorySearchResult, MemoryQueryParams, MemoryUpdateParams, MemoryFindOneParams, ChatRequest, ChatResponse, ChatStreamChunk, DecideRequest, DecideResponse, BatchChatRequest, Agent, CreateAgentParams, UpdateAgentParams, Script, CreateScriptParams, UpdateScriptParams, InvokeScriptParams, ScriptInvocationResult, Resource, CallResourceParams, Template, TemplateInstallation, MarketplaceItem, MarketplaceFilters, UploadDocumentParams, UploadDocumentResult, DocumentGetResult, DocumentStatusResult, DocumentChunksResult, DocumentDeleteResult, ShareDocumentParams, ShareDocumentResult, UnshareDocumentResult, ListDocumentGraphsResult, SearchDocumentsParams, SearchDocumentsResult, ListDocumentsParams, ListDocumentsResult, Flow, CreateEventFlowParams, CreateTimeFlowParams, UpdateFlowParams, ListFlowsParams, EventTypeInfo } from './types';
export declare class MirraSDK {
    private client;
    private apiKey;
    constructor(config: MirraSDKConfig);
    /**
     * Initialize auto-generated adapter methods
     * This dynamically adds all adapter methods from generated code
     */
    private initializeGeneratedAdapters;
    memory: {
        /**
         * Create a new memory entity
         */
        create: (entity: MemoryEntity) => Promise<MemoryEntityWithId>;
        /**
         * Search memories by semantic similarity
         */
        search: (query: MemorySearchQuery) => Promise<MemorySearchResult[]>;
        /**
         * Query memories with filters
         */
        query: (params: MemoryQueryParams) => Promise<MemoryEntityWithId[]>;
        /**
         * Find a single memory by criteria
         */
        findOne: (params: MemoryFindOneParams) => Promise<MemoryEntityWithId | null>;
        /**
         * Update a memory entity
         */
        update: (params: MemoryUpdateParams) => Promise<{
            id: string;
            updated: boolean;
        }>;
        /**
         * Delete a memory entity
         */
        delete: (id: string) => Promise<{
            deleted: boolean;
            message?: string;
        }>;
    };
    ai: {
        /**
         * Send a chat request to the AI
         * Uses Anthropic Claude as the AI provider
         */
        chat: (request: ChatRequest) => Promise<ChatResponse>;
        /**
         * Stream AI responses in real-time for long-form content
         * Returns an async generator that yields chunks of the response
         *
         * @example
         * ```typescript
         * const stream = sdk.ai.chatStream({
         *   messages: [{ role: 'user', content: 'Write a story' }]
         * });
         *
         * for await (const chunk of stream) {
         *   if (chunk.done) {
         *     console.log('Usage:', chunk.usage);
         *   } else {
         *     process.stdout.write(chunk.delta);
         *   }
         * }
         * ```
         */
        chatStream: (request: ChatRequest) => AsyncGenerator<ChatStreamChunk, void, unknown>;
        /**
         * Ask AI to make a decision from multiple options with structured reasoning
         */
        decide: (request: DecideRequest) => Promise<DecideResponse>;
        /**
         * Process multiple chat requests in batch for efficiency
         */
        batchChat: (request: BatchChatRequest) => Promise<ChatResponse[]>;
    };
    /**
     * Internal method to handle streaming chat
     */
    private _streamChat;
    agents: {
        /**
         * Create a new agent
         */
        create: (params: CreateAgentParams) => Promise<Agent>;
        /**
         * Get an agent by ID
         */
        get: (id: string) => Promise<Agent>;
        /**
         * List all agents
         */
        list: () => Promise<Agent[]>;
        /**
         * Update an agent
         */
        update: (id: string, params: UpdateAgentParams) => Promise<Agent>;
        /**
         * Delete an agent
         */
        delete: (id: string) => Promise<{
            success: boolean;
        }>;
    };
    scripts: {
        /**
         * Create a new script
         */
        create: (params: CreateScriptParams) => Promise<Script>;
        /**
         * Get a script by ID
         */
        get: (id: string) => Promise<Script>;
        /**
         * List all scripts
         */
        list: () => Promise<Script[]>;
        /**
         * Update a script
         */
        update: (id: string, params: UpdateScriptParams) => Promise<Script>;
        /**
         * Delete a script
         */
        delete: (id: string) => Promise<{
            success: boolean;
        }>;
        /**
         * Deploy a script
         */
        deploy: (id: string) => Promise<{
            success: boolean;
        }>;
        /**
         * Invoke a script
         */
        invoke: (params: InvokeScriptParams) => Promise<ScriptInvocationResult>;
        /**
         * Get a system script ID by type
         * System scripts are pre-deployed scripts available to all users for specific functionality.
         *
         * @example
         * ```typescript
         * // Get the Claude Code router script ID for Flow creation
         * const { scriptId } = await sdk.scripts.getSystemScript('claude-code-router');
         * console.log('Router script ID:', scriptId);
         * ```
         *
         * @param type - The system script type:
         *   - `claude-code-router`: Routes mobile replies to Claude Code sessions on user PCs
         *   - `call-summary-script`: Generates call summaries for completed voice calls
         *   - `call-reminder-script`: Creates reminders from call context
         */
        getSystemScript: (type: "claude-code-router" | "call-summary-script" | "call-reminder-script") => Promise<{
            type: string;
            scriptId: string;
        }>;
    };
    resources: {
        /**
         * Call a resource method
         */
        call: (params: CallResourceParams) => Promise<any>;
        /**
         * List available resources
         */
        list: () => Promise<Resource[]>;
        /**
         * Get a resource by ID
         */
        get: (id: string) => Promise<Resource>;
        /**
         * Create a new resource
         */
        create: (params: CreateResourceParams) => Promise<Resource>;
        /**
         * Update an existing resource
         */
        update: (params: UpdateResourceParams) => Promise<Resource>;
        /**
         * Install a resource for the current user
         */
        install: (id: string) => Promise<{
            success: boolean;
        }>;
        /**
         * Authenticate a resource installation
         * Stores credentials for accessing the resource on behalf of the user
         */
        authenticate: (resourceId: string, auth: {
            type: 'api_key' | 'oauth2' | 'basic' | 'bearer';
            credentials: Record<string, any>;
        }) => Promise<{
            success: boolean;
            isAuthenticated: boolean;
        }>;
    };
    templates: {
        /**
         * List available templates
         */
        list: () => Promise<Template[]>;
        /**
         * Get a template by ID
         */
        get: (id: string) => Promise<Template>;
        /**
         * Install a template
         */
        install: (id: string) => Promise<{
            success: boolean;
        }>;
        /**
         * Get the current template installation info
         * This is only available when using a template API key
         * Returns the installation details including the userId (owner)
         *
         * @example
         * ```typescript
         * const installation = await sdk.templates.getCurrentInstallation();
         * console.log('Owner ID:', installation.userId);
         * ```
         */
        getCurrentInstallation: () => Promise<TemplateInstallation>;
    };
    marketplace: {
        /**
         * Browse marketplace items
         */
        browse: (filters?: MarketplaceFilters) => Promise<MarketplaceItem[]>;
        /**
         * Search marketplace
         */
        search: (query: string) => Promise<MarketplaceItem[]>;
    };
    documents: {
        /**
         * Upload and process a document
         * Supports PDF, DOCX, TXT, and MD files
         *
         * @example
         * ```typescript
         * import { readFileSync } from 'fs';
         *
         * const fileBuffer = readFileSync('document.pdf');
         * const result = await sdk.documents.upload({
         *   file: fileBuffer.toString('base64'),
         *   filename: 'document.pdf',
         *   mimeType: 'application/pdf',
         *   title: 'My Document'
         * });
         * console.log('Uploaded:', result.documentId);
         * ```
         */
        upload: (params: UploadDocumentParams) => Promise<UploadDocumentResult>;
        /**
         * Get document metadata and chunks
         */
        get: (documentId: string) => Promise<DocumentGetResult>;
        /**
         * Get document processing status
         */
        getStatus: (documentId: string) => Promise<DocumentStatusResult>;
        /**
         * Get all chunks for a document
         */
        getChunks: (documentId: string) => Promise<DocumentChunksResult>;
        /**
         * Delete a document and all its chunks
         */
        delete: (documentId: string) => Promise<DocumentDeleteResult>;
        /**
         * Share a document to another graph (group or user-contact)
         *
         * @example
         * ```typescript
         * await sdk.documents.share('doc-123', {
         *   targetGraphId: 'group-456',
         *   shareReason: 'For team review'
         * });
         * ```
         */
        share: (documentId: string, params: ShareDocumentParams) => Promise<ShareDocumentResult>;
        /**
         * Remove document access from a graph
         * Note: Cannot unshare from the primary (original) graph
         */
        unshare: (documentId: string, graphId: string) => Promise<UnshareDocumentResult>;
        /**
         * List all graphs a document is shared in
         */
        listGraphs: (documentId: string) => Promise<ListDocumentGraphsResult>;
        /**
         * Semantic search across document chunks
         *
         * @example
         * ```typescript
         * const results = await sdk.documents.search({
         *   query: 'quarterly earnings report',
         *   limit: 10,
         *   threshold: 0.7
         * });
         *
         * for (const result of results.results) {
         *   console.log(`[${result.score}] ${result.content}`);
         * }
         * ```
         */
        search: (params: SearchDocumentsParams) => Promise<SearchDocumentsResult>;
        /**
         * List documents in a graph
         */
        list: (params?: ListDocumentsParams) => Promise<ListDocumentsResult>;
    };
    flows: {
        /**
         * Create an event-based flow
         * Event flows trigger when conditions match incoming events (e.g., message replies)
         *
         * @example
         * ```typescript
         * const flow = await sdk.flows.createEventFlow({
         *   title: 'Route Claude Code Replies',
         *   description: 'Routes replies to Claude Code session',
         *   trigger: {
         *     type: 'event',
         *     config: {
         *       eventSource: 'mirra',
         *       rootCondition: {
         *         operator: 'and',
         *         conditions: [
         *           { field: 'mirra.replyTo.automation.sessionId', operator: 'equals', value: 'cc_123' }
         *         ]
         *       }
         *     }
         *   },
         *   scriptId: 'my-router-script',
         *   scriptInput: { sessionId: 'cc_123' }
         * });
         * ```
         */
        createEventFlow: (params: CreateEventFlowParams) => Promise<Flow>;
        /**
         * Create a time-based flow
         * Time flows trigger on a cron schedule
         *
         * @example
         * ```typescript
         * const flow = await sdk.flows.createTimeFlow({
         *   title: 'Daily Summary',
         *   description: 'Runs every day at 9am',
         *   trigger: {
         *     type: 'time',
         *     config: { cronExpression: '0 9 * * *' }
         *   },
         *   scriptId: 'daily-summary-script'
         * });
         * ```
         */
        createTimeFlow: (params: CreateTimeFlowParams) => Promise<Flow>;
        /**
         * Get a flow by ID
         */
        get: (id: string) => Promise<Flow>;
        /**
         * List all flows for the authenticated user
         */
        list: (params?: ListFlowsParams) => Promise<Flow[]>;
        /**
         * Update a flow
         */
        update: (id: string, params: UpdateFlowParams) => Promise<Flow>;
        /**
         * Delete a flow
         */
        delete: (id: string) => Promise<{
            success: boolean;
        }>;
        /**
         * Pause a flow (stop it from triggering)
         */
        pause: (id: string) => Promise<Flow>;
        /**
         * Resume a paused flow
         */
        resume: (id: string) => Promise<Flow>;
        /**
         * List available event types that can trigger flows
         */
        listEventTypes: () => Promise<EventTypeInfo[]>;
    };
}
//# sourceMappingURL=client.d.ts.map