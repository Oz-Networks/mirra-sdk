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

// ============================================================================
// Memory Types
// ============================================================================

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

// ============================================================================
// AI Types
// ============================================================================

export type AIProvider = 'anthropic' | 'openai' | 'google';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  provider?: AIProvider;
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
  provider?: AIProvider;
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

// ============================================================================
// Agent Types
// ============================================================================

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

// ============================================================================
// Script Types
// ============================================================================

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

// ============================================================================
// Resource Types
// ============================================================================

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

// ============================================================================
// Template Types
// ============================================================================

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

// ============================================================================
// Marketplace Types
// ============================================================================

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

