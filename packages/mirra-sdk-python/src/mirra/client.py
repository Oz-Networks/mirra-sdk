"""
Mirra SDK Client
"""

import requests
from typing import Any, Dict, List, Optional
from .types import (
    MirraResponse,
    MemoryEntity,
    MemorySearchQuery,
    MemorySearchResult,
    MemoryQueryParams,
    MemoryUpdateParams,
    ChatRequest,
    ChatResponse,
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
    MarketplaceItem,
    MarketplaceFilters,
)


class MirraError(Exception):
    """Base exception for Mirra SDK errors"""

    def __init__(self, message: str, code: str = None, status_code: int = None, details: Any = None):
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        self.details = details


class MirraSDK:
    """
    Official Python SDK for the Mirra API
    
    Args:
        api_key: Your Mirra API key
        base_url: Base URL for the API (default: https://api.fxn.world/api/sdk/v1)
    
    Example:
        >>> from mirra import MirraSDK
        >>> mirra = MirraSDK(api_key="your_api_key")
        >>> response = mirra.ai.chat({"messages": [{"role": "user", "content": "Hello!"}]})
    """

    def __init__(self, api_key: str, base_url: str = "https://api.fxn.world/api/sdk/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "X-API-Key": api_key,
        })

        # Initialize service namespaces
        self.memory = MemoryService(self)
        self.ai = AIService(self)
        self.agents = AgentService(self)
        self.scripts = ScriptService(self)
        self.resources = ResourceService(self)
        self.templates = TemplateService(self)
        self.marketplace = MarketplaceService(self)

    def _request(
        self,
        method: str,
        path: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """Make an HTTP request to the API"""
        url = f"{self.base_url}{path}"
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                params=params,
            )
            
            # Parse response
            try:
                result: MirraResponse = response.json()
            except ValueError:
                raise MirraError(
                    f"Invalid JSON response from API",
                    status_code=response.status_code
                )
            
            # Check for errors
            if not result.get("success", False) or response.status_code >= 400:
                error = result.get("error", {})
                raise MirraError(
                    message=error.get("message", "Unknown error"),
                    code=error.get("code"),
                    status_code=response.status_code,
                    details=error.get("details"),
                )
            
            return result.get("data")
            
        except requests.RequestException as e:
            raise MirraError(f"Request failed: {str(e)}")


class MemoryService:
    """Memory operations"""

    def __init__(self, client: MirraSDK):
        self.client = client

    def create(self, entity: MemoryEntity) -> Dict[str, str]:
        """Create a new memory entity"""
        return self.client._request("POST", "/memory", data=entity)

    def search(self, query: MemorySearchQuery) -> List[MemorySearchResult]:
        """Search memories by semantic similarity"""
        return self.client._request("POST", "/memory/search", data=query)

    def query(self, params: MemoryQueryParams) -> List[MemoryEntity]:
        """Query memories with filters"""
        return self.client._request("POST", "/memory/query", data=params)

    def find_one(self, id: str) -> Optional[MemoryEntity]:
        """Find a single memory by ID"""
        return self.client._request("POST", "/memory/findOne", data={"id": id})

    def update(self, id: str, updates: MemoryUpdateParams) -> Dict[str, bool]:
        """Update a memory entity"""
        return self.client._request("POST", "/memory/update", data={"id": id, **updates})

    def delete(self, id: str) -> Dict[str, bool]:
        """Delete a memory entity"""
        return self.client._request("POST", "/memory/delete", data={"id": id})


class AIService:
    """AI operations"""

    def __init__(self, client: MirraSDK):
        self.client = client

    def chat(self, request: ChatRequest) -> ChatResponse:
        """Send a chat request to the AI"""
        return self.client._request("POST", "/ai/chat", data=request)

    def decide(self, request: DecideRequest) -> DecideResponse:
        """Ask AI to make a decision from options"""
        return self.client._request("POST", "/ai/decide", data=request)

    def batch_chat(self, request: BatchChatRequest) -> List[ChatResponse]:
        """Process multiple chat requests in batch"""
        return self.client._request("POST", "/ai/batchChat", data=request)


class AgentService:
    """Agent management operations"""

    def __init__(self, client: MirraSDK):
        self.client = client

    def create(self, params: CreateAgentParams) -> Agent:
        """Create a new agent"""
        return self.client._request("POST", "/agents", data=params)

    def get(self, id: str) -> Agent:
        """Get an agent by ID"""
        return self.client._request("GET", f"/agents/{id}")

    def list(self) -> List[Agent]:
        """List all agents"""
        return self.client._request("GET", "/agents")

    def update(self, id: str, params: UpdateAgentParams) -> Agent:
        """Update an agent"""
        return self.client._request("PATCH", f"/agents/{id}", data=params)

    def delete(self, id: str) -> Dict[str, bool]:
        """Delete an agent"""
        return self.client._request("DELETE", f"/agents/{id}")


class ScriptService:
    """Script operations"""

    def __init__(self, client: MirraSDK):
        self.client = client

    def create(self, params: CreateScriptParams) -> Script:
        """Create a new script"""
        return self.client._request("POST", "/scripts", data=params)

    def get(self, id: str) -> Script:
        """Get a script by ID"""
        return self.client._request("GET", f"/scripts/{id}")

    def list(self) -> List[Script]:
        """List all scripts"""
        return self.client._request("GET", "/scripts")

    def update(self, id: str, params: UpdateScriptParams) -> Script:
        """Update a script"""
        return self.client._request("PATCH", f"/scripts/{id}", data=params)

    def delete(self, id: str) -> Dict[str, bool]:
        """Delete a script"""
        return self.client._request("DELETE", f"/scripts/{id}")

    def deploy(self, id: str) -> Dict[str, bool]:
        """Deploy a script"""
        return self.client._request("POST", f"/scripts/{id}/deploy")

    def invoke(self, params: InvokeScriptParams) -> ScriptInvocationResult:
        """Invoke a script"""
        script_id = params["scriptId"]
        payload = params.get("payload")
        return self.client._request(
            "POST",
            f"/scripts/{script_id}/invoke",
            data={"payload": payload}
        )


class ResourceService:
    """Resource operations"""

    def __init__(self, client: MirraSDK):
        self.client = client

    def call(self, params: CallResourceParams) -> Any:
        """Call a resource method"""
        return self.client._request("POST", "/resources/call", data=params)

    def list(self) -> List[Resource]:
        """List available resources"""
        return self.client._request("GET", "/resources")

    def get(self, id: str) -> Resource:
        """Get a resource by ID"""
        return self.client._request("GET", f"/resources/{id}")


class TemplateService:
    """Template operations"""

    def __init__(self, client: MirraSDK):
        self.client = client

    def list(self) -> List[Template]:
        """List available templates"""
        return self.client._request("GET", "/templates")

    def get(self, id: str) -> Template:
        """Get a template by ID"""
        return self.client._request("GET", f"/templates/{id}")

    def install(self, id: str) -> Dict[str, bool]:
        """Install a template"""
        return self.client._request("POST", f"/templates/{id}/install")


class MarketplaceService:
    """Marketplace operations"""

    def __init__(self, client: MirraSDK):
        self.client = client

    def browse(self, filters: Optional[MarketplaceFilters] = None) -> List[MarketplaceItem]:
        """Browse marketplace items"""
        return self.client._request("GET", "/marketplace", params=filters)

    def search(self, query: str) -> List[MarketplaceItem]:
        """Search marketplace"""
        return self.client._request("GET", "/marketplace/search", params={"q": query})

