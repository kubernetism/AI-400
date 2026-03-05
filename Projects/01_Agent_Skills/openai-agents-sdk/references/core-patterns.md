# Core Patterns

## Contents
- Agent Factory Pattern
- Tool Registry Pattern
- Composable Guardrails
- Session Management
- Error Handling Strategies

## Agent Factory Pattern

Create agents consistently with dependency injection:

```python
from typing import Protocol, Any
from agents import Agent
from pydantic import BaseModel

class AgentConfig(BaseModel):
    name: str
    instructions: str
    model: str = "gpt-5.2"
    tools: list[str] = []  # Tool names from registry
    handoff_agents: list[str] = []

class AgentFactory:
    """Factory for creating configured agents with DI."""

    def __init__(
        self,
        tool_registry: "ToolRegistry",
        guardrail_engine: "GuardrailEngine",
        default_model: str = "gpt-5.2",
    ):
        self._tool_registry = tool_registry
        self._guardrail_engine = guardrail_engine
        self._default_model = default_model
        self._agents: dict[str, Agent] = {}

    def create(self, config: AgentConfig) -> Agent:
        """Create agent from configuration."""
        tools = [
            self._tool_registry.get(name)
            for name in config.tools
        ]

        agent = Agent(
            name=config.name,
            instructions=config.instructions,
            model=config.model or self._default_model,
            tools=tools,
            input_guardrails=self._guardrail_engine.get_input_guardrails(),
            output_guardrails=self._guardrail_engine.get_output_guardrails(),
        )

        self._agents[config.name] = agent
        return agent

    def get(self, name: str) -> Agent | None:
        return self._agents.get(name)

    def create_with_handoffs(
        self,
        config: AgentConfig,
        handoff_configs: list[AgentConfig],
    ) -> Agent:
        """Create agent with handoff agents."""
        # Create handoff agents first
        handoff_agents = [self.create(hc) for hc in handoff_configs]

        # Create main agent with handoffs
        tools = [self._tool_registry.get(name) for name in config.tools]

        return Agent(
            name=config.name,
            instructions=config.instructions,
            model=config.model or self._default_model,
            tools=tools,
            handoffs=handoff_agents,
            input_guardrails=self._guardrail_engine.get_input_guardrails(),
        )
```

### YAML-Driven Configuration

```yaml
# agents.yaml
agents:
  triage:
    name: "Triage Agent"
    instructions: |
      Route customer queries to appropriate specialists.
      For billing questions, hand off to billing_specialist.
      For technical issues, hand off to tech_support.
    model: "gpt-5.2"
    tools:
      - get_customer_info
      - check_account_status
    handoffs:
      - billing_specialist
      - tech_support

  billing_specialist:
    name: "Billing Specialist"
    handoff_description: "Handles billing and payment inquiries"
    instructions: |
      You are a billing specialist. Help with invoices,
      payments, and subscription management.
    tools:
      - get_invoices
      - process_refund
      - update_payment_method

  tech_support:
    name: "Technical Support"
    handoff_description: "Handles technical issues and troubleshooting"
    instructions: |
      You are technical support. Diagnose issues,
      provide solutions, and escalate when needed.
    tools:
      - check_system_status
      - run_diagnostics
      - create_support_ticket
```

```python
import yaml
from pathlib import Path

def load_agents_from_yaml(
    path: Path,
    factory: AgentFactory,
) -> dict[str, Agent]:
    """Load agent configurations from YAML."""
    with open(path) as f:
        config = yaml.safe_load(f)

    agents = {}
    for name, agent_config in config["agents"].items():
        cfg = AgentConfig(**agent_config)
        agents[name] = factory.create(cfg)

    # Wire up handoffs
    for name, agent_config in config["agents"].items():
        if "handoffs" in agent_config:
            agent = agents[name]
            agent.handoffs = [
                agents[h] for h in agent_config["handoffs"]
            ]

    return agents
```

## Tool Registry Pattern

Centralized tool discovery and management:

```python
from typing import Callable, Any
from agents import function_tool, FunctionTool
from agents.mcp import MCPServerStdio

class ToolRegistry:
    """Centralized registry for all tools."""

    def __init__(self):
        self._tools: dict[str, FunctionTool] = {}
        self._mcp_servers: dict[str, MCPServerStdio] = {}

    def register(self, tool: FunctionTool) -> None:
        """Register a function tool."""
        self._tools[tool.name] = tool

    def register_function(
        self,
        func: Callable,
        name: str | None = None,
    ) -> FunctionTool:
        """Register a function as a tool."""
        tool = function_tool(func, name_override=name)
        self._tools[tool.name] = tool
        return tool

    def register_mcp_server(
        self,
        name: str,
        server: MCPServerStdio,
    ) -> None:
        """Register an MCP server."""
        self._mcp_servers[name] = server

    def get(self, name: str) -> FunctionTool:
        """Get tool by name."""
        if name not in self._tools:
            raise KeyError(f"Tool '{name}' not registered")
        return self._tools[name]

    def get_all(self) -> list[FunctionTool]:
        """Get all registered tools."""
        return list(self._tools.values())

    def get_by_category(self, category: str) -> list[FunctionTool]:
        """Get tools by category tag."""
        return [
            t for t in self._tools.values()
            if hasattr(t, "category") and t.category == category
        ]

    async def get_mcp_tools(self, server_name: str) -> list:
        """Get tools from an MCP server."""
        server = self._mcp_servers.get(server_name)
        if not server:
            raise KeyError(f"MCP server '{server_name}' not registered")
        return await server.list_tools()


# Usage
registry = ToolRegistry()

@registry.register_function
def search_knowledge_base(query: str) -> str:
    """Search the knowledge base for relevant information."""
    # Implementation
    return f"Results for: {query}"

@registry.register_function
def create_ticket(
    title: str,
    description: str,
    priority: str = "medium",
) -> dict:
    """Create a support ticket.

    Args:
        title: Ticket title
        description: Detailed description of the issue
        priority: Priority level (low, medium, high, urgent)
    """
    return {"ticket_id": "TKT-12345", "status": "created"}
```

## Composable Guardrails

Build guardrails from reusable components:

```python
from abc import ABC, abstractmethod
from typing import Any
from agents import (
    Agent, Runner, GuardrailFunctionOutput,
    InputGuardrail, OutputGuardrail,
    input_guardrail, output_guardrail,
)
from pydantic import BaseModel

class GuardrailCheck(ABC):
    """Base class for composable guardrail checks."""

    @abstractmethod
    async def check(self, content: str, context: Any) -> tuple[bool, str]:
        """
        Check content against this guardrail.

        Returns:
            (passed, reason) - True if check passed, reason for failure
        """
        pass


class ContentPolicyCheck(GuardrailCheck):
    """Check content against policies."""

    def __init__(self, policies: list[str]):
        self.policies = policies

    async def check(self, content: str, context: Any) -> tuple[bool, str]:
        # Implement policy checking
        for policy in self.policies:
            if self._violates_policy(content, policy):
                return False, f"Violates policy: {policy}"
        return True, ""

    def _violates_policy(self, content: str, policy: str) -> bool:
        # Policy checking logic
        return False


class PIIDetectionCheck(GuardrailCheck):
    """Detect and flag PII in content."""

    PII_PATTERNS = {
        "ssn": r"\d{3}-\d{2}-\d{4}",
        "credit_card": r"\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}",
        "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    }

    async def check(self, content: str, context: Any) -> tuple[bool, str]:
        import re
        for pii_type, pattern in self.PII_PATTERNS.items():
            if re.search(pattern, content):
                return False, f"Contains {pii_type}"
        return True, ""


class LengthCheck(GuardrailCheck):
    """Check content length bounds."""

    def __init__(self, min_length: int = 0, max_length: int = 10000):
        self.min_length = min_length
        self.max_length = max_length

    async def check(self, content: str, context: Any) -> tuple[bool, str]:
        if len(content) < self.min_length:
            return False, f"Too short (min: {self.min_length})"
        if len(content) > self.max_length:
            return False, f"Too long (max: {self.max_length})"
        return True, ""


class GuardrailEngine:
    """Compose multiple guardrail checks."""

    def __init__(self):
        self._input_checks: list[GuardrailCheck] = []
        self._output_checks: list[GuardrailCheck] = []

    def add_input_check(self, check: GuardrailCheck) -> "GuardrailEngine":
        self._input_checks.append(check)
        return self

    def add_output_check(self, check: GuardrailCheck) -> "GuardrailEngine":
        self._output_checks.append(check)
        return self

    def get_input_guardrails(self) -> list[InputGuardrail]:
        """Build input guardrails from checks."""
        if not self._input_checks:
            return []

        @input_guardrail
        async def composite_input_guardrail(ctx, agent, input_data):
            content = str(input_data)
            for check in self._input_checks:
                passed, reason = await check.check(content, ctx.context)
                if not passed:
                    return GuardrailFunctionOutput(
                        output_info={"check": check.__class__.__name__, "reason": reason},
                        tripwire_triggered=True,
                    )
            return GuardrailFunctionOutput(
                output_info={"status": "passed"},
                tripwire_triggered=False,
            )

        return [composite_input_guardrail]

    def get_output_guardrails(self) -> list[OutputGuardrail]:
        """Build output guardrails from checks."""
        if not self._output_checks:
            return []

        @output_guardrail
        async def composite_output_guardrail(ctx, agent, output):
            content = str(output)
            for check in self._output_checks:
                passed, reason = await check.check(content, ctx.context)
                if not passed:
                    return GuardrailFunctionOutput(
                        output_info={"check": check.__class__.__name__, "reason": reason},
                        tripwire_triggered=True,
                    )
            return GuardrailFunctionOutput(
                output_info={"status": "passed"},
                tripwire_triggered=False,
            )

        return [composite_output_guardrail]


# Usage
engine = (
    GuardrailEngine()
    .add_input_check(LengthCheck(min_length=1, max_length=5000))
    .add_input_check(ContentPolicyCheck(["no_harmful_content"]))
    .add_output_check(PIIDetectionCheck())
)
```

## Session Management

Multi-backend session factory:

```python
from abc import ABC, abstractmethod
from enum import Enum
from agents import SQLiteSession
from agents.extensions.memory import SQLAlchemySession, EncryptedSession

class SessionBackend(Enum):
    MEMORY = "memory"
    SQLITE = "sqlite"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"

class SessionFactory:
    """Factory for creating sessions with different backends."""

    def __init__(
        self,
        backend: SessionBackend,
        connection_string: str | None = None,
        encryption_key: str | None = None,
        ttl: int = 3600,
    ):
        self.backend = backend
        self.connection_string = connection_string
        self.encryption_key = encryption_key
        self.ttl = ttl

    def create(self, session_id: str):
        """Create session for given ID."""
        if self.backend == SessionBackend.MEMORY:
            return SQLiteSession(session_id, ":memory:")

        elif self.backend == SessionBackend.SQLITE:
            session = SQLiteSession(session_id, self.connection_string or "sessions.db")

        elif self.backend in (SessionBackend.POSTGRESQL, SessionBackend.MYSQL):
            session = SQLAlchemySession.from_url(
                session_id,
                url=self.connection_string,
                create_tables=True,
            )
        else:
            raise ValueError(f"Unknown backend: {self.backend}")

        # Wrap with encryption if key provided
        if self.encryption_key:
            return EncryptedSession(
                session_id=session_id,
                underlying_session=session,
                encryption_key=self.encryption_key,
                ttl=self.ttl,
            )

        return session


# Request-scoped session binding
from contextvars import ContextVar

_current_session: ContextVar = ContextVar("current_session", default=None)

class SessionScope:
    """Context manager for request-scoped sessions."""

    def __init__(self, factory: SessionFactory, session_id: str):
        self.factory = factory
        self.session_id = session_id
        self.session = None
        self._token = None

    async def __aenter__(self):
        self.session = self.factory.create(self.session_id)
        self._token = _current_session.set(self.session)
        return self.session

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        _current_session.reset(self._token)
        # Cleanup if needed

def get_current_session():
    """Get the current request's session."""
    session = _current_session.get()
    if session is None:
        raise RuntimeError("No session in current scope")
    return session
```

## Error Handling Strategies

Robust error handling with retry logic:

```python
import asyncio
from functools import wraps
from typing import TypeVar, Callable, Any
from agents.exceptions import (
    InputGuardrailTripwireTriggered,
    OutputGuardrailTripwireTriggered,
    ModelBehaviorError,
)

T = TypeVar("T")

class RetryConfig:
    """Configuration for retry behavior."""

    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 30.0,
        exponential_base: float = 2.0,
        retryable_exceptions: tuple = (Exception,),
    ):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.retryable_exceptions = retryable_exceptions


def with_retry(config: RetryConfig | None = None):
    """Decorator for retry logic with exponential backoff."""
    cfg = config or RetryConfig()

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            last_exception = None

            for attempt in range(cfg.max_attempts):
                try:
                    return await func(*args, **kwargs)
                except cfg.retryable_exceptions as e:
                    last_exception = e

                    if attempt < cfg.max_attempts - 1:
                        delay = min(
                            cfg.base_delay * (cfg.exponential_base ** attempt),
                            cfg.max_delay,
                        )
                        await asyncio.sleep(delay)

            raise last_exception

        return wrapper
    return decorator


class CircuitBreaker:
    """Circuit breaker for failing operations."""

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._failures = 0
        self._last_failure_time = 0
        self._state = "closed"  # closed, open, half-open

    async def call(self, func: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection."""
        if self._state == "open":
            if (asyncio.get_event_loop().time() - self._last_failure_time
                    > self.recovery_timeout):
                self._state = "half-open"
            else:
                raise RuntimeError("Circuit breaker is open")

        try:
            result = await func(*args, **kwargs)
            if self._state == "half-open":
                self._state = "closed"
                self._failures = 0
            return result

        except Exception as e:
            self._failures += 1
            self._last_failure_time = asyncio.get_event_loop().time()

            if self._failures >= self.failure_threshold:
                self._state = "open"

            raise


# Exception-specific handlers
class AgentErrorHandler:
    """Centralized error handling for agent operations."""

    @staticmethod
    async def handle_guardrail_error(
        error: InputGuardrailTripwireTriggered | OutputGuardrailTripwireTriggered,
    ) -> str:
        """Handle guardrail violations."""
        if isinstance(error, InputGuardrailTripwireTriggered):
            return "I cannot process this request due to content policy."
        else:
            return "I cannot provide this response due to content policy."

    @staticmethod
    async def handle_model_error(error: ModelBehaviorError) -> str:
        """Handle model behavior errors."""
        # Log for debugging
        return "I encountered an issue. Let me try a different approach."

    @staticmethod
    async def safe_run(runner_func: Callable, *args, **kwargs) -> tuple[Any, str | None]:
        """Run agent with comprehensive error handling."""
        try:
            result = await runner_func(*args, **kwargs)
            return result, None

        except InputGuardrailTripwireTriggered as e:
            msg = await AgentErrorHandler.handle_guardrail_error(e)
            return None, msg

        except OutputGuardrailTripwireTriggered as e:
            msg = await AgentErrorHandler.handle_guardrail_error(e)
            return None, msg

        except ModelBehaviorError as e:
            msg = await AgentErrorHandler.handle_model_error(e)
            return None, msg

        except Exception as e:
            # Log unexpected errors
            return None, "An unexpected error occurred."
```
