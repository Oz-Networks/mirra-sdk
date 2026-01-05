/**
 * Mirra SDK Client
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  MirraSDKConfig,
  MirraResponse,
  MemoryEntity,
  MemoryEntityWithId,
  MemorySearchQuery,
  MemorySearchResult,
  MemoryQueryParams,
  MemoryUpdateParams,
  MemoryFindOneParams,
  ChatRequest,
  ChatResponse,
  ChatStreamChunk,
  DecideRequest,
  DecideResponse,
  BatchChatRequest,
  Agent,
  CreateAgentParams,
  UpdateAgentParams,
  Script,
  CreateScriptParams,
  UpdateScriptParams,
  InvokeScriptParams,
  ScriptInvocationResult,
  Resource,
  CallResourceParams,
  Template,
  TemplateInstallation,
  MarketplaceItem,
  MarketplaceFilters,
  UploadDocumentParams,
  UploadDocumentResult,
  DocumentGetResult,
  DocumentStatusResult,
  DocumentChunksResult,
  DocumentDeleteResult,
  ShareDocumentParams,
  ShareDocumentResult,
  UnshareDocumentResult,
  ListDocumentGraphsResult,
  SearchDocumentsParams,
  SearchDocumentsResult,
  ListDocumentsParams,
  ListDocumentsResult,
} from './types';

export class MirraSDK {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: MirraSDKConfig) {
    this.apiKey = config.apiKey;
    const baseUrl = config.baseUrl || 'https://api.fxn.world/api/sdk/v1';

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: any) => response,
      (error: AxiosError<MirraResponse>) => {
        if (error.response?.data?.error) {
          const err = new Error(error.response.data.error.message);
          (err as any).code = error.response.data.error.code;
          (err as any).details = error.response.data.error.details;
          (err as any).statusCode = error.response.status;
          throw err;
        }
        throw error;
      }
    );
  }

  // ============================================================================
  // Memory Operations
  // ============================================================================

  memory = {
    /**
     * Create a new memory entity
     */
    create: async (entity: MemoryEntity): Promise<MemoryEntityWithId> => {
      const response = await this.client.post<MirraResponse<MemoryEntityWithId>>(
        '/memory/create',
        entity
      );
      return response.data.data!;
    },

    /**
     * Search memories by semantic similarity
     */
    search: async (
      query: MemorySearchQuery
    ): Promise<MemorySearchResult[]> => {
      const response = await this.client.post<
        MirraResponse<MemorySearchResult[]>
      >('/memory/search', query);
      return response.data.data!;
    },

    /**
     * Query memories with filters
     */
    query: async (params: MemoryQueryParams): Promise<MemoryEntityWithId[]> => {
      const response = await this.client.post<MirraResponse<MemoryEntityWithId[]>>(
        '/memory/query',
        params
      );
      return response.data.data!;
    },

    /**
     * Find a single memory by criteria
     */
    findOne: async (params: MemoryFindOneParams): Promise<MemoryEntityWithId | null> => {
      const response = await this.client.post<
        MirraResponse<MemoryEntityWithId | null>
      >('/memory/findOne', params);
      return response.data.data!;
    },

    /**
     * Update a memory entity
     */
    update: async (
      params: MemoryUpdateParams
    ): Promise<{ id: string; updated: boolean }> => {
      const response = await this.client.post<
        MirraResponse<{ id: string; updated: boolean }>
      >('/memory/update', params);
      return response.data.data!;
    },

    /**
     * Delete a memory entity
     */
    delete: async (id: string): Promise<{ deleted: boolean; message?: string }> => {
      const response = await this.client.post<
        MirraResponse<{ deleted: boolean; message?: string }>
      >('/memory/delete', { id });
      return response.data.data!;
    },
  };

  // ============================================================================
  // AI Operations
  // ============================================================================

  ai = {
    /**
     * Send a chat request to the AI with multi-provider support
     * Supports Anthropic Claude, Google Gemini, and OpenAI
     */
    chat: async (request: ChatRequest): Promise<ChatResponse> => {
      const response = await this.client.post<MirraResponse<ChatResponse>>(
        '/ai/chat',
        request
      );
      return response.data.data!;
    },

    /**
     * Stream AI responses in real-time for long-form content
     * Returns an async generator that yields chunks of the response
     * 
     * @example
     * ```typescript
     * const stream = sdk.ai.chatStream({
     *   messages: [{ role: 'user', content: 'Write a story' }],
     *   provider: 'anthropic'
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
    chatStream: (request: ChatRequest): AsyncGenerator<ChatStreamChunk, void, unknown> => {
      return this._streamChat(request);
    },

    /**
     * Ask AI to make a decision from multiple options with structured reasoning
     */
    decide: async (request: DecideRequest): Promise<DecideResponse> => {
      const response = await this.client.post<MirraResponse<DecideResponse>>(
        '/ai/decide',
        request
      );
      return response.data.data!;
    },

    /**
     * Process multiple chat requests in batch for efficiency
     */
    batchChat: async (
      request: BatchChatRequest
    ): Promise<ChatResponse[]> => {
      const response = await this.client.post<MirraResponse<ChatResponse[]>>(
        '/ai/batchChat',
        request
      );
      return response.data.data!;
    },
  };

  /**
   * Internal method to handle streaming chat
   */
  private async *_streamChat(request: ChatRequest): AsyncGenerator<ChatStreamChunk, void, unknown> {
    const response = await this.client.post<ReadableStream>(
      '/ai/chatStream',
      request,
      {
        responseType: 'stream',
        headers: {
          'Accept': 'text/event-stream',
        },
      }
    );

    // Handle streaming response
    const reader = (response.data as any).getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            try {
              const chunk = JSON.parse(line.slice(6)) as ChatStreamChunk;
              yield chunk;
              if (chunk.done) return;
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ============================================================================
  // Agent Operations
  // ============================================================================

  agents = {
    /**
     * Create a new agent
     */
    create: async (params: CreateAgentParams): Promise<Agent> => {
      const response = await this.client.post<MirraResponse<Agent>>(
        '/agents',
        params
      );
      return response.data.data!;
    },

    /**
     * Get an agent by ID
     */
    get: async (id: string): Promise<Agent> => {
      const response = await this.client.get<MirraResponse<Agent>>(
        `/agents/${id}`
      );
      return response.data.data!;
    },

    /**
     * List all agents
     */
    list: async (): Promise<Agent[]> => {
      const response = await this.client.get<MirraResponse<Agent[]>>(
        '/agents'
      );
      return response.data.data!;
    },

    /**
     * Update an agent
     */
    update: async (id: string, params: UpdateAgentParams): Promise<Agent> => {
      const response = await this.client.patch<MirraResponse<Agent>>(
        `/agents/${id}`,
        params
      );
      return response.data.data!;
    },

    /**
     * Delete an agent
     */
    delete: async (id: string): Promise<{ success: boolean }> => {
      const response = await this.client.delete<
        MirraResponse<{ success: boolean }>
      >(`/agents/${id}`);
      return response.data.data!;
    },
  };

  // ============================================================================
  // Script Operations
  // ============================================================================

  scripts = {
    /**
     * Create a new script
     */
    create: async (params: CreateScriptParams): Promise<Script> => {
      const response = await this.client.post<MirraResponse<Script>>(
        '/scripts',
        params
      );
      return response.data.data!;
    },

    /**
     * Get a script by ID
     */
    get: async (id: string): Promise<Script> => {
      const response = await this.client.get<MirraResponse<Script>>(
        `/scripts/${id}`
      );
      return response.data.data!;
    },

    /**
     * List all scripts
     */
    list: async (): Promise<Script[]> => {
      const response = await this.client.get<MirraResponse<Script[]>>(
        '/scripts'
      );
      return response.data.data!;
    },

    /**
     * Update a script
     */
    update: async (id: string, params: UpdateScriptParams): Promise<Script> => {
      const response = await this.client.patch<MirraResponse<Script>>(
        `/scripts/${id}`,
        params
      );
      return response.data.data!;
    },

    /**
     * Delete a script
     */
    delete: async (id: string): Promise<{ success: boolean }> => {
      const response = await this.client.delete<
        MirraResponse<{ success: boolean }>
      >(`/scripts/${id}`);
      return response.data.data!;
    },

    /**
     * Deploy a script
     */
    deploy: async (id: string): Promise<{ success: boolean }> => {
      const response = await this.client.post<
        MirraResponse<{ success: boolean }>
      >(`/scripts/${id}/deploy`);
      return response.data.data!;
    },

    /**
     * Invoke a script
     */
    invoke: async (
      params: InvokeScriptParams
    ): Promise<ScriptInvocationResult> => {
      const response = await this.client.post<
        MirraResponse<ScriptInvocationResult>
      >(`/scripts/${params.scriptId}/invoke`, {
        payload: params.payload,
      });
      return response.data.data!;
    },
  };

  // ============================================================================
  // Resource Operations
  // ============================================================================

  resources = {
    /**
     * Call a resource method
     */
    call: async (params: CallResourceParams): Promise<any> => {
      const response = await this.client.post<MirraResponse<any>>(
        '/resources/call',
        params
      );
      return response.data.data!;
    },

    /**
     * List available resources
     */
    list: async (): Promise<Resource[]> => {
      const response = await this.client.get<MirraResponse<Resource[]>>(
        '/resources'
      );
      return response.data.data!;
    },

    /**
     * Get a resource by ID
     */
    get: async (id: string): Promise<Resource> => {
      const response = await this.client.get<MirraResponse<Resource>>(
        `/resources/${id}`
      );
      return response.data.data!;
    },
  };

  // ============================================================================
  // Template Operations
  // ============================================================================

  templates = {
    /**
     * List available templates
     */
    list: async (): Promise<Template[]> => {
      const response = await this.client.get<MirraResponse<Template[]>>(
        '/templates'
      );
      return response.data.data!;
    },

    /**
     * Get a template by ID
     */
    get: async (id: string): Promise<Template> => {
      const response = await this.client.get<MirraResponse<Template>>(
        `/templates/${id}`
      );
      return response.data.data!;
    },

    /**
     * Install a template
     */
    install: async (id: string): Promise<{ success: boolean }> => {
      const response = await this.client.post<
        MirraResponse<{ success: boolean }>
      >(`/templates/${id}/install`);
      return response.data.data!;
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
    getCurrentInstallation: async (): Promise<TemplateInstallation> => {
      const response = await this.client.get<MirraResponse<TemplateInstallation>>(
        '/templates/installations/current'
      );
      return response.data.data!;
    },
  };

  // ============================================================================
  // Marketplace Operations
  // ============================================================================

  marketplace = {
    /**
     * Browse marketplace items
     */
    browse: async (filters?: MarketplaceFilters): Promise<MarketplaceItem[]> => {
      const response = await this.client.get<MirraResponse<MarketplaceItem[]>>(
        '/marketplace',
        { params: filters }
      );
      return response.data.data!;
    },

    /**
     * Search marketplace
     */
    search: async (query: string): Promise<MarketplaceItem[]> => {
      const response = await this.client.get<MirraResponse<MarketplaceItem[]>>(
        '/marketplace/search',
        { params: { q: query } }
      );
      return response.data.data!;
    },
  };

  // ============================================================================
  // Document Operations
  // ============================================================================

  documents = {
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
    upload: async (params: UploadDocumentParams): Promise<UploadDocumentResult> => {
      const response = await this.client.post<MirraResponse<UploadDocumentResult>>(
        '/documents/upload',
        params
      );
      return response.data.data!;
    },

    /**
     * Get document metadata and chunks
     */
    get: async (documentId: string): Promise<DocumentGetResult> => {
      const response = await this.client.get<MirraResponse<DocumentGetResult>>(
        `/documents/${documentId}`
      );
      return response.data.data!;
    },

    /**
     * Get document processing status
     */
    getStatus: async (documentId: string): Promise<DocumentStatusResult> => {
      const response = await this.client.get<MirraResponse<DocumentStatusResult>>(
        `/documents/${documentId}/status`
      );
      return response.data.data!;
    },

    /**
     * Get all chunks for a document
     */
    getChunks: async (documentId: string): Promise<DocumentChunksResult> => {
      const response = await this.client.get<MirraResponse<DocumentChunksResult>>(
        `/documents/${documentId}/chunks`
      );
      return response.data.data!;
    },

    /**
     * Delete a document and all its chunks
     */
    delete: async (documentId: string): Promise<DocumentDeleteResult> => {
      const response = await this.client.delete<MirraResponse<DocumentDeleteResult>>(
        `/documents/${documentId}`
      );
      return response.data.data!;
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
    share: async (documentId: string, params: ShareDocumentParams): Promise<ShareDocumentResult> => {
      const response = await this.client.post<MirraResponse<ShareDocumentResult>>(
        `/documents/${documentId}/share`,
        params
      );
      return response.data.data!;
    },

    /**
     * Remove document access from a graph
     * Note: Cannot unshare from the primary (original) graph
     */
    unshare: async (documentId: string, graphId: string): Promise<UnshareDocumentResult> => {
      const response = await this.client.delete<MirraResponse<UnshareDocumentResult>>(
        `/documents/${documentId}/share/${graphId}`
      );
      return response.data.data!;
    },

    /**
     * List all graphs a document is shared in
     */
    listGraphs: async (documentId: string): Promise<ListDocumentGraphsResult> => {
      const response = await this.client.get<MirraResponse<ListDocumentGraphsResult>>(
        `/documents/${documentId}/graphs`
      );
      return response.data.data!;
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
    search: async (params: SearchDocumentsParams): Promise<SearchDocumentsResult> => {
      const response = await this.client.post<MirraResponse<SearchDocumentsResult>>(
        '/documents/search',
        params
      );
      return response.data.data!;
    },

    /**
     * List documents in a graph
     */
    list: async (params?: ListDocumentsParams): Promise<ListDocumentsResult> => {
      const response = await this.client.get<MirraResponse<ListDocumentsResult>>(
        '/documents',
        { params }
      );
      return response.data.data!;
    },
  };
}

