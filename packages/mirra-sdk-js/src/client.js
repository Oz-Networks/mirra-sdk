"use strict";
/**
 * Mirra SDK Client
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MirraSDK = void 0;
const axios_1 = __importDefault(require("axios"));
class MirraSDK {
    constructor(config) {
        // ============================================================================
        // Memory Operations
        // ============================================================================
        this.memory = {
            /**
             * Create a new memory entity
             */
            create: async (entity) => {
                const response = await this.client.post('/memory/create', entity);
                return response.data.data;
            },
            /**
             * Search memories by semantic similarity
             */
            search: async (query) => {
                const response = await this.client.post('/memory/search', query);
                return response.data.data;
            },
            /**
             * Query memories with filters
             */
            query: async (params) => {
                const response = await this.client.post('/memory/query', params);
                return response.data.data;
            },
            /**
             * Find a single memory by criteria
             */
            findOne: async (params) => {
                const response = await this.client.post('/memory/findOne', params);
                return response.data.data;
            },
            /**
             * Update a memory entity
             */
            update: async (params) => {
                const response = await this.client.post('/memory/update', params);
                return response.data.data;
            },
            /**
             * Delete a memory entity
             */
            delete: async (id) => {
                const response = await this.client.post('/memory/delete', { id });
                return response.data.data;
            },
        };
        // ============================================================================
        // AI Operations
        // ============================================================================
        this.ai = {
            /**
             * Send a chat request to the AI
             * Uses Anthropic Claude as the AI provider
             */
            chat: async (request) => {
                const response = await this.client.post('/ai/chat', request);
                return response.data.data;
            },
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
            chatStream: (request) => {
                return this._streamChat(request);
            },
            /**
             * Ask AI to make a decision from multiple options with structured reasoning
             */
            decide: async (request) => {
                const response = await this.client.post('/ai/decide', request);
                return response.data.data;
            },
            /**
             * Process multiple chat requests in batch for efficiency
             */
            batchChat: async (request) => {
                const response = await this.client.post('/ai/batchChat', request);
                return response.data.data;
            },
        };
        // ============================================================================
        // Agent Operations
        // ============================================================================
        this.agents = {
            /**
             * Create a new agent
             */
            create: async (params) => {
                const response = await this.client.post('/agents', params);
                return response.data.data;
            },
            /**
             * Get an agent by ID
             */
            get: async (id) => {
                const response = await this.client.get(`/agents/${id}`);
                return response.data.data;
            },
            /**
             * List all agents
             */
            list: async () => {
                const response = await this.client.get('/agents');
                return response.data.data;
            },
            /**
             * Update an agent
             */
            update: async (id, params) => {
                const response = await this.client.patch(`/agents/${id}`, params);
                return response.data.data;
            },
            /**
             * Delete an agent
             */
            delete: async (id) => {
                const response = await this.client.delete(`/agents/${id}`);
                return response.data.data;
            },
        };
        // ============================================================================
        // Script Operations
        // ============================================================================
        this.scripts = {
            /**
             * Create a new script
             */
            create: async (params) => {
                const response = await this.client.post('/scripts', params);
                return response.data.data;
            },
            /**
             * Get a script by ID
             */
            get: async (id) => {
                const response = await this.client.get(`/scripts/${id}`);
                return response.data.data;
            },
            /**
             * List all scripts
             */
            list: async () => {
                const response = await this.client.get('/scripts');
                return response.data.data;
            },
            /**
             * Update a script
             */
            update: async (id, params) => {
                const response = await this.client.patch(`/scripts/${id}`, params);
                return response.data.data;
            },
            /**
             * Delete a script
             */
            delete: async (id) => {
                const response = await this.client.delete(`/scripts/${id}`);
                return response.data.data;
            },
            /**
             * Deploy a script
             */
            deploy: async (id) => {
                const response = await this.client.post(`/scripts/${id}/deploy`);
                return response.data.data;
            },
            /**
             * Invoke a script
             */
            invoke: async (params) => {
                const response = await this.client.post(`/scripts/${params.scriptId}/invoke`, {
                    payload: params.payload,
                });
                return response.data.data;
            },
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
            getSystemScript: async (type) => {
                const response = await this.client.get(`/scripts/system/${type}`);
                return response.data.data;
            },
        };
        // ============================================================================
        // Resource Operations
        // ============================================================================
        this.resources = {
            /**
             * Call a resource method
             */
            call: async (params) => {
                const response = await this.client.post('/resources/call', params);
                return response.data.data;
            },
            /**
             * List available resources
             */
            list: async () => {
                const response = await this.client.get('/resources');
                return response.data.data;
            },
            /**
             * Get a resource by ID
             */
            get: async (id) => {
                const response = await this.client.get(`/resources/${id}`);
                return response.data.data;
            },
        };
        // ============================================================================
        // Template Operations
        // ============================================================================
        this.templates = {
            /**
             * List available templates
             */
            list: async () => {
                const response = await this.client.get('/templates');
                return response.data.data;
            },
            /**
             * Get a template by ID
             */
            get: async (id) => {
                const response = await this.client.get(`/templates/${id}`);
                return response.data.data;
            },
            /**
             * Install a template
             */
            install: async (id) => {
                const response = await this.client.post(`/templates/${id}/install`);
                return response.data.data;
            },
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
            getCurrentInstallation: async () => {
                const response = await this.client.get('/templates/installations/current');
                return response.data.data;
            },
        };
        // ============================================================================
        // Marketplace Operations
        // ============================================================================
        this.marketplace = {
            /**
             * Browse marketplace items
             */
            browse: async (filters) => {
                const response = await this.client.get('/marketplace', { params: filters });
                return response.data.data;
            },
            /**
             * Search marketplace
             */
            search: async (query) => {
                const response = await this.client.get('/marketplace/search', { params: { q: query } });
                return response.data.data;
            },
        };
        // ============================================================================
        // Document Operations
        // ============================================================================
        this.documents = {
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
            upload: async (params) => {
                const response = await this.client.post('/documents/upload', params);
                return response.data.data;
            },
            /**
             * Get document metadata and chunks
             */
            get: async (documentId) => {
                const response = await this.client.get(`/documents/${documentId}`);
                return response.data.data;
            },
            /**
             * Get document processing status
             */
            getStatus: async (documentId) => {
                const response = await this.client.get(`/documents/${documentId}/status`);
                return response.data.data;
            },
            /**
             * Get all chunks for a document
             */
            getChunks: async (documentId) => {
                const response = await this.client.get(`/documents/${documentId}/chunks`);
                return response.data.data;
            },
            /**
             * Delete a document and all its chunks
             */
            delete: async (documentId) => {
                const response = await this.client.delete(`/documents/${documentId}`);
                return response.data.data;
            },
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
            share: async (documentId, params) => {
                const response = await this.client.post(`/documents/${documentId}/share`, params);
                return response.data.data;
            },
            /**
             * Remove document access from a graph
             * Note: Cannot unshare from the primary (original) graph
             */
            unshare: async (documentId, graphId) => {
                const response = await this.client.delete(`/documents/${documentId}/share/${graphId}`);
                return response.data.data;
            },
            /**
             * List all graphs a document is shared in
             */
            listGraphs: async (documentId) => {
                const response = await this.client.get(`/documents/${documentId}/graphs`);
                return response.data.data;
            },
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
            search: async (params) => {
                const response = await this.client.post('/documents/search', params);
                return response.data.data;
            },
            /**
             * List documents in a graph
             */
            list: async (params) => {
                const response = await this.client.get('/documents', { params });
                return response.data.data;
            },
        };
        // ============================================================================
        // Flow Operations
        // ============================================================================
        this.flows = {
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
            createEventFlow: async (params) => {
                const response = await this.client.post('/flows/createEventFlow', params);
                return response.data.data;
            },
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
            createTimeFlow: async (params) => {
                const response = await this.client.post('/flows/createTimeFlow', params);
                return response.data.data;
            },
            /**
             * Get a flow by ID
             */
            get: async (id) => {
                const response = await this.client.post('/flows/getFlow', { flowId: id });
                return response.data.data;
            },
            /**
             * List all flows for the authenticated user
             */
            list: async (params) => {
                const response = await this.client.post('/flows/searchFlows', params || {});
                return response.data.data;
            },
            /**
             * Update a flow
             */
            update: async (id, params) => {
                const response = await this.client.post('/flows/updateFlow', { flowId: id, ...params });
                return response.data.data;
            },
            /**
             * Delete a flow
             */
            delete: async (id) => {
                const response = await this.client.post('/flows/deleteFlow', { flowId: id });
                return response.data.data;
            },
            /**
             * Pause a flow (stop it from triggering)
             */
            pause: async (id) => {
                const response = await this.client.post('/flows/pauseFlow', { flowId: id });
                return response.data.data;
            },
            /**
             * Resume a paused flow
             */
            resume: async (id) => {
                const response = await this.client.post('/flows/resumeFlow', { flowId: id });
                return response.data.data;
            },
            /**
             * List available event types that can trigger flows
             */
            listEventTypes: async () => {
                const response = await this.client.post('/flows/listEventTypes', {});
                return response.data.data;
            },
        };
        this.apiKey = config.apiKey;
        const baseUrl = config.baseUrl || 'https://api.fxn.world/api/sdk/v1';
        this.client = axios_1.default.create({
            baseURL: baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
            },
        });
        // Response interceptor to handle errors
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.data?.error) {
                const err = new Error(error.response.data.error.message);
                err.code = error.response.data.error.code;
                err.details = error.response.data.error.details;
                err.statusCode = error.response.status;
                throw err;
            }
            throw error;
        });
        // Initialize auto-generated adapter methods
        this.initializeGeneratedAdapters();
    }
    /**
     * Initialize auto-generated adapter methods
     * This dynamically adds all adapter methods from generated code
     */
    initializeGeneratedAdapters() {
        try {
            // Import generated adapters - will exist after running generate:llm-api
            const { generatedAdapters } = require('./generated/adapters');
            // Dynamically attach each adapter to this instance
            for (const [adapterName, adapterFactory] of Object.entries(generatedAdapters)) {
                this[adapterName] = adapterFactory(this);
            }
        }
        catch (error) {
            // Generated adapters don't exist yet - this is OK during development
            // They will be created when you run: npm run generate:llm-api
            console.warn('Generated adapters not found. Run: npm run generate:llm-api');
        }
    }
    /**
     * Internal method to handle streaming chat
     */
    async *_streamChat(request) {
        const response = await this.client.post('/ai/chatStream', request, {
            responseType: 'stream',
            headers: {
                'Accept': 'text/event-stream',
            },
        });
        // Handle streaming response
        const reader = response.data.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.trim() === '')
                        continue;
                    if (line.startsWith('data: ')) {
                        try {
                            const chunk = JSON.parse(line.slice(6));
                            yield chunk;
                            if (chunk.done)
                                return;
                        }
                        catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
}
exports.MirraSDK = MirraSDK;
//# sourceMappingURL=client.js.map