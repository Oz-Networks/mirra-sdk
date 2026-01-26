/**
 * Mirra SDK Types
 */
export interface MirraSDKConfig {
    apiKey: string;
    baseUrl?: string;
}
export interface MirraResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export interface MemoryEntity {
    type: string;
    content: string;
    metadata?: Record<string, any>;
}
export interface MemoryEntityWithId extends MemoryEntity {
    id: string;
}
export interface MemorySearchQuery {
    query: string;
    limit?: number;
}
export interface MemorySearchResult {
    id: string;
    content: string;
    type: string;
    metadata?: Record<string, any>;
    score: number;
}
export interface MemoryQueryParams {
    type?: string;
    filters?: Record<string, any>;
    limit?: number;
    offset?: number;
}
export interface MemoryUpdateParams {
    id: string;
    type?: string;
    content?: string;
    metadata?: Record<string, any>;
}
export interface MemoryFindOneParams {
    filters: {
        id?: string;
        name?: string;
        [key: string]: any;
    };
}
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface ChatRequest {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface ChatResponse {
    content: string;
    model: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
}
export interface ChatStreamChunk {
    delta: string;
    done: boolean;
    model?: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
}
export interface DecisionOption {
    id: string;
    label: string;
    metadata?: Record<string, any>;
}
export interface DecideRequest {
    prompt: string;
    options: DecisionOption[];
    context?: string;
    model?: string;
}
export interface DecideResponse {
    selectedOption: string;
    reasoning: string;
}
export interface BatchChatRequest {
    requests: Array<{
        message: string;
        model?: string;
    }>;
}
export interface Agent {
    id: string;
    subdomain: string;
    name: string;
    description?: string;
    systemPrompt: string;
    enabled: boolean;
    status: 'draft' | 'published';
    createdAt: string;
    updatedAt?: string;
}
export interface CreateAgentParams {
    subdomain: string;
    name: string;
    systemPrompt: string;
    description?: string;
    enabled?: boolean;
}
export interface UpdateAgentParams {
    name?: string;
    systemPrompt?: string;
    description?: string;
    enabled?: boolean;
}
export interface Script {
    id: string;
    name: string;
    description?: string;
    code: string;
    runtime: 'nodejs18' | 'python3.11';
    config: {
        timeout: number;
        memory: number;
        allowedResources?: string[];
    };
    status: 'draft' | 'deployed' | 'failed';
    createdAt: string;
    updatedAt?: string;
}
export interface CreateScriptParams {
    name: string;
    description?: string;
    code: string;
    runtime?: 'nodejs18' | 'python3.11';
    config?: {
        timeout?: number;
        memory?: number;
        allowedResources?: string[];
    };
}
export interface UpdateScriptParams {
    name?: string;
    description?: string;
    code?: string;
    config?: {
        timeout?: number;
        memory?: number;
        allowedResources?: string[];
    };
}
export interface InvokeScriptParams {
    scriptId: string;
    payload?: any;
}
export interface ScriptInvocationResult {
    success: boolean;
    result?: any;
    logs?: string;
    error?: string;
    duration?: number;
}
export interface Resource {
    id: string;
    name: string;
    description?: string;
    type: string;
    config: Record<string, any>;
    status: 'active' | 'inactive';
    createdAt: string;
}
export interface CallResourceParams {
    resourceId: string;
    method: string;
    params?: Record<string, any>;
}
export interface ResourceEndpointMethod {
    name: string;
    httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description?: string;
    parameters?: Record<string, any>;
    response?: Record<string, any>;
    examples?: Array<{
        description: string;
        input: Record<string, any>;
        output: Record<string, any>;
        note?: string;
    }>;
}
export interface ResourceEndpoint {
    baseUrl: string;
    authentication: 'none' | 'bearer' | 'api_key' | 'oauth2' | 'basic';
    methods: ResourceEndpointMethod[];
}
export interface CreateResourceParams {
    name: string;
    description?: string;
    resourceType: 'integration' | 'api' | 'webhook' | 'custom';
    category?: string;
    isPrivate?: boolean;
    endpoint: ResourceEndpoint;
    pricing?: { model: 'free' | 'pay-per-call' | 'subscription' };
    openApiSpec?: object;
}
export interface UpdateResourceParams {
    id: string;
    name?: string;
    description?: string;
    endpoint?: Partial<ResourceEndpoint>;
    pricing?: { model: 'free' | 'pay-per-call' | 'subscription' };
    openApiSpec?: object;
}
export interface Template {
    id: string;
    name: string;
    description?: string;
    category?: string;
    components: {
        agents?: string[];
        scripts?: string[];
        resources?: string[];
    };
    createdAt: string;
}
export interface TemplatePermissions {
    memoryAccess?: 'none' | 'filtered' | 'all';
    memoryTags?: string[];
    calendarAccess?: 'read-only' | 'read-write';
    workingHours?: {
        timezone: string;
        schedule: Array<{
            day: number;
            start: string;
            end: string;
        }>;
    };
}
export interface TemplateInstallation {
    installationId: string;
    userId: string;
    templateId: string;
    pagePath: string;
    version: string;
    status: string;
    configurationStatus: string;
    permissions: TemplatePermissions;
    config: Record<string, any>;
    configuration: Record<string, any>;
}
export interface MarketplaceItem {
    id: string;
    name: string;
    description?: string;
    type: 'agent' | 'script' | 'resource' | 'template';
    author: string;
    price?: number;
    rating?: number;
    installs?: number;
}
export interface MarketplaceFilters {
    type?: 'agent' | 'script' | 'resource' | 'template';
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
}
export type DocumentAccessLevel = 'public' | 'internal' | 'confidential' | 'private';
export interface Document {
    documentId: string;
    title?: string;
    filename: string;
    mimeType: string;
    fileSize: number;
    processingStatus: 'processing' | 'completed' | 'failed';
    chunkCount?: number;
    graphIds: string[];
    primaryGraphId: string;
    createdAt: number;
    createdByUserId: string;
    extractedText?: string;
    processingError?: string;
}
export interface DocumentChunk {
    chunkId: string;
    documentId: string;
    content: string;
    position: number;
    tokenCount?: number;
}
export interface UploadDocumentParams {
    /** Base64 encoded file content */
    file: string;
    /** Original filename with extension */
    filename: string;
    /** MIME type (application/pdf, text/plain, etc.) */
    mimeType: string;
    /** Target graph ID (defaults to user's personal graph) */
    graphId?: string;
    /** Custom document title */
    title?: string;
    /** Document author */
    author?: string;
    /** Product tags for categorization */
    productTags?: string[];
    /** Access level for the document */
    accessLevel?: DocumentAccessLevel;
}
export interface UploadDocumentResult {
    documentId: string;
    chunkCount: number;
    graphIds: string[];
    primaryGraphId: string;
    processingTimeMs: number;
}
export interface DocumentGetResult {
    document: Document;
    chunks: DocumentChunk[];
    chunkCount: number;
}
export interface DocumentStatusResult {
    documentId: string;
    processingStatus: 'processing' | 'completed' | 'failed';
    chunkCount?: number;
    processingError?: string;
    extractedAt?: number;
    processingCompletedAt?: number;
}
export interface DocumentChunksResult {
    chunks: DocumentChunk[];
    count: number;
}
export interface DocumentDeleteResult {
    deleted: boolean;
    documentId: string;
    chunksDeleted: number;
}
export interface ShareDocumentParams {
    /** Target graph ID to share to */
    targetGraphId: string;
    /** Optional reason for sharing */
    shareReason?: string;
}
export interface DocumentShareEvent {
    sharedToGraphId: string;
    sharedByUserId: string;
    sharedAt: number;
    shareReason?: string;
    shareType: 'manual' | 'automatic';
}
export interface ShareDocumentResult {
    documentId: string;
    graphIds: string[];
    shareEvent: DocumentShareEvent;
}
export interface UnshareDocumentResult {
    documentId: string;
    graphIds: string[];
}
export interface DocumentGraphInfo {
    graphId: string;
    isPrimary: boolean;
    sharedAt: number;
    sharedByUserId?: string;
    shareReason?: string;
}
export interface ListDocumentGraphsResult {
    documentId: string;
    graphs: DocumentGraphInfo[];
}
export interface SearchDocumentsParams {
    /** Search query */
    query: string;
    /** Graph ID to search in (defaults to user's graph) */
    graphId?: string;
    /** Maximum results (default: 10) */
    limit?: number;
    /** Similarity threshold 0-1 (default: 0.7) */
    threshold?: number;
}
export interface DocumentSearchResult {
    chunkId: string;
    documentId: string;
    content: string;
    score: number;
    position: number;
}
export interface SearchDocumentsResult {
    results: DocumentSearchResult[];
    count: number;
    graphId: string;
}
export interface ListDocumentsParams {
    /** Graph ID to list documents from (defaults to user's graph) */
    graphId?: string;
    /** Maximum results (default: 50) */
    limit?: number;
    /** Pagination offset (default: 0) */
    offset?: number;
}
export interface ListDocumentsResult {
    documents: Document[];
    count: number;
    graphId: string;
}
/**
 * Flow condition operator types
 */
export type FlowConditionOperator = 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists' | 'matchesRegex' | 'and' | 'or' | 'not';
/**
 * Flow condition for event filtering
 */
export interface FlowCondition {
    operator: FlowConditionOperator;
    field?: string;
    value?: any;
    conditions?: FlowCondition[];
    condition?: FlowCondition;
}
/**
 * Flow trigger configuration
 */
export interface FlowTriggerConfig {
    /** Cron expression for time-based triggers */
    cronExpression?: string;
    /** Event source for event-based triggers (e.g., 'mirra', 'gmail', 'telegram') */
    eventSource?: string;
    /** Root condition for event filtering */
    rootCondition?: FlowCondition;
    /** Alternative event filter format */
    eventFilter?: FlowCondition;
    /** How to combine multiple conditions */
    combineMethod?: 'AND' | 'OR';
}
/**
 * Flow trigger definition
 */
export interface FlowTrigger {
    type: 'time' | 'event';
    config: FlowTriggerConfig;
}
/**
 * Flow status
 */
export type FlowStatus = 'active' | 'paused' | 'completed' | 'failed';
/**
 * Flow execution result
 */
export interface FlowExecutionResult {
    timestamp: string;
    success: boolean;
    result?: any;
    error?: string;
    tokensConsumed?: number;
}
/**
 * Flow entity
 */
export interface Flow {
    id: string;
    userId: string;
    title: string;
    description: string;
    status: FlowStatus;
    trigger: FlowTrigger;
    scriptId: string;
    scriptInput?: Record<string, any>;
    executionCount?: number;
    lastExecutedAt?: string;
    executionResults?: FlowExecutionResult[];
    createdAt?: string;
    updatedAt?: string;
}
/**
 * Parameters for creating an event-based flow
 */
export interface CreateEventFlowParams {
    title: string;
    description: string;
    trigger: {
        type: 'event';
        config: FlowTriggerConfig;
    };
    scriptId: string;
    scriptInput?: Record<string, any>;
    status?: FlowStatus;
}
/**
 * Parameters for creating a time-based flow
 */
export interface CreateTimeFlowParams {
    title: string;
    description: string;
    trigger: {
        type: 'time';
        config: {
            cronExpression: string;
        };
    };
    scriptId: string;
    scriptInput?: Record<string, any>;
    status?: FlowStatus;
}
/**
 * Parameters for updating a flow
 */
export interface UpdateFlowParams {
    title?: string;
    description?: string;
    trigger?: FlowTrigger;
    scriptId?: string;
    scriptInput?: Record<string, any>;
    status?: FlowStatus;
}
/**
 * Parameters for listing flows
 */
export interface ListFlowsParams {
    status?: FlowStatus;
    limit?: number;
    offset?: number;
}
/**
 * Available event type info
 */
export interface EventTypeInfo {
    eventType: string;
    source: string;
    displayName: string;
    description: string;
    icon: string;
    enabled: boolean;
}
//# sourceMappingURL=types.d.ts.map