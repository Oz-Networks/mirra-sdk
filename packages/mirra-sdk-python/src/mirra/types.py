"""
Mirra SDK Types
"""

from typing import Any, Dict, List, Optional, TypedDict, Literal


class MirraResponse(TypedDict, total=False):
    """Standard Mirra API response"""
    success: bool
    data: Any
    error: Optional[Dict[str, Any]]


# ============================================================================
# Memory Types
# ============================================================================


class MemoryEntity(TypedDict, total=False):
    """Memory entity structure"""
    content: str
    type: Optional[str]
    metadata: Optional[Dict[str, Any]]
    embedding: Optional[List[float]]


class MemorySearchQuery(TypedDict, total=False):
    """Memory search query parameters"""
    query: str
    limit: Optional[int]
    threshold: Optional[float]
    filters: Optional[Dict[str, Any]]


class MemorySearchResult(TypedDict):
    """Memory search result"""
    id: str
    content: str
    type: Optional[str]
    metadata: Optional[Dict[str, Any]]
    score: float


class MemoryQueryParams(TypedDict, total=False):
    """Memory query parameters"""
    filters: Optional[Dict[str, Any]]
    limit: Optional[int]


class MemoryUpdateParams(TypedDict, total=False):
    """Memory update parameters"""
    content: Optional[str]
    metadata: Optional[Dict[str, Any]]


# ============================================================================
# AI Types
# ============================================================================


class ChatMessage(TypedDict):
    """Chat message structure"""
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(TypedDict, total=False):
    """AI chat request parameters"""
    messages: List[ChatMessage]
    model: Optional[str]
    temperature: Optional[float]
    maxTokens: Optional[int]


class TokenUsage(TypedDict):
    """Token usage information"""
    inputTokens: int
    outputTokens: int


class ChatResponse(TypedDict):
    """AI chat response"""
    content: str
    model: str
    usage: TokenUsage


class DecisionOption(TypedDict, total=False):
    """Decision option structure"""
    id: str
    label: str
    metadata: Optional[Dict[str, Any]]


class DecideRequest(TypedDict, total=False):
    """AI decision request parameters"""
    prompt: str
    options: List[DecisionOption]
    context: Optional[Dict[str, Any]]
    model: Optional[str]


class DecideResponse(TypedDict):
    """AI decision response"""
    selectedOption: str
    reasoning: str


class BatchChatRequest(TypedDict):
    """Batch chat request"""
    requests: List[Dict[str, Any]]


# ============================================================================
# Agent Types
# ============================================================================


class Agent(TypedDict, total=False):
    """Agent structure"""
    id: str
    subdomain: str
    name: str
    description: Optional[str]
    systemPrompt: str
    enabled: bool
    status: Literal["draft", "published"]
    createdAt: str
    updatedAt: Optional[str]


class CreateAgentParams(TypedDict, total=False):
    """Parameters for creating an agent"""
    subdomain: str
    name: str
    systemPrompt: str
    description: Optional[str]
    enabled: Optional[bool]


class UpdateAgentParams(TypedDict, total=False):
    """Parameters for updating an agent"""
    name: Optional[str]
    systemPrompt: Optional[str]
    description: Optional[str]
    enabled: Optional[bool]


# ============================================================================
# Script Types
# ============================================================================


class ScriptConfig(TypedDict, total=False):
    """Script configuration"""
    timeout: int
    memory: int
    allowedResources: Optional[List[str]]


class Script(TypedDict, total=False):
    """Script structure"""
    id: str
    name: str
    description: Optional[str]
    code: str
    runtime: Literal["nodejs18", "python3.11"]
    config: ScriptConfig
    status: Literal["draft", "deployed", "failed"]
    createdAt: str
    updatedAt: Optional[str]


class CreateScriptParams(TypedDict, total=False):
    """Parameters for creating a script"""
    name: str
    description: Optional[str]
    code: str
    runtime: Optional[Literal["nodejs18", "python3.11"]]
    config: Optional[ScriptConfig]


class UpdateScriptParams(TypedDict, total=False):
    """Parameters for updating a script"""
    name: Optional[str]
    description: Optional[str]
    code: Optional[str]
    config: Optional[ScriptConfig]


class InvokeScriptParams(TypedDict, total=False):
    """Parameters for invoking a script"""
    scriptId: str
    payload: Optional[Any]


class ScriptInvocationResult(TypedDict, total=False):
    """Script invocation result"""
    success: bool
    result: Optional[Any]
    logs: Optional[str]
    error: Optional[str]
    duration: Optional[float]


# ============================================================================
# Resource Types
# ============================================================================


class Resource(TypedDict, total=False):
    """Resource structure"""
    id: str
    name: str
    description: Optional[str]
    type: str
    config: Dict[str, Any]
    status: Literal["active", "inactive"]
    createdAt: str


class CallResourceParams(TypedDict, total=False):
    """Parameters for calling a resource"""
    resourceId: str
    method: str
    params: Optional[Dict[str, Any]]


# ============================================================================
# Template Types
# ============================================================================


class TemplateComponents(TypedDict, total=False):
    """Template components"""
    agents: Optional[List[str]]
    scripts: Optional[List[str]]
    resources: Optional[List[str]]


class Template(TypedDict, total=False):
    """Template structure"""
    id: str
    name: str
    description: Optional[str]
    category: Optional[str]
    components: TemplateComponents
    createdAt: str


# ============================================================================
# Marketplace Types
# ============================================================================


class MarketplaceItem(TypedDict, total=False):
    """Marketplace item"""
    id: str
    name: str
    description: Optional[str]
    type: Literal["agent", "script", "resource", "template"]
    author: str
    price: Optional[float]
    rating: Optional[float]
    installs: Optional[int]


class MarketplaceFilters(TypedDict, total=False):
    """Marketplace filter parameters"""
    type: Optional[Literal["agent", "script", "resource", "template"]]
    category: Optional[str]
    search: Optional[str]
    limit: Optional[int]
    offset: Optional[int]

