---
name: openai-agents-sdk
description: |
  Build production-grade AI agents with OpenAI Agents SDK. Use when creating agents with tools,
  handoffs, guardrails, sessions, tracing, or multi-agent orchestration. Triggers on agent
  development, tool creation, conversation memory, agent coordination, observability, voice
  pipelines, and realtime agent tasks.
---

# OpenAI Agents SDK

Build production-ready AI agents using OpenAI's official Agents SDK primitives.

## Before Implementation

| Source | Gather |
|--------|--------|
| **Codebase** | Existing agent patterns, tool definitions, session configurations |
| **Conversation** | Agent purpose, required tools, handoff logic, guardrail requirements |
| **Context7** | Latest SDK documentation via `resolve-library-id` + `query-docs` |
| **User Guidelines** | Team patterns for error handling, observability, deployment |

**Always fetch current docs**: `resolve-library-id("openai-agents-python")` then `query-docs`.

## Clarifications

Before implementing, clarify:

| Ask About | Why |
|-----------|-----|
| Agent purpose | Determines instructions, tools, and output type |
| Tool requirements | Function tools, MCP servers, or both |
| Handoff needs | Single agent or multi-agent coordination |
| Session persistence | In-memory, SQLite, SQLAlchemy, encrypted |
| Guardrails | Input validation, output filtering, content policies |
| Observability | Tracing requirements, custom processors |

## Core Primitives

### Agent

```python
from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant.",
    model="gpt-5.2",
    tools=[my_tool],
    handoffs=[specialist_agent],
    output_type=ResponseModel,  # Optional Pydantic model
    input_guardrails=[my_guardrail],
    output_guardrails=[output_check],
)

result = await Runner.run(agent, "User message")
print(result.final_output)
```

### Function Tools

```python
from agents import function_tool

@function_tool
def get_weather(city: str) -> str:
    """Get weather for a city.

    Args:
        city: Name of the city to check weather for.
    """
    return f"Weather in {city}: sunny, 72F"

# With context access
@function_tool
async def save_data(ctx: ToolContext, data: str) -> str:
    """Save data using context."""
    # Access ctx.context for shared state
    return "Saved"
```

### Guardrails

```python
from agents import InputGuardrail, GuardrailFunctionOutput, input_guardrail
from pydantic import BaseModel

class ValidationResult(BaseModel):
    is_valid: bool
    reasoning: str

@input_guardrail
async def content_filter(ctx, agent, input) -> GuardrailFunctionOutput:
    # Run validation logic
    result = await Runner.run(validator_agent, input, context=ctx.context)
    return GuardrailFunctionOutput(
        output_info=result.final_output,
        tripwire_triggered=not result.final_output.is_valid,
    )

agent = Agent(
    name="Protected Agent",
    input_guardrails=[content_filter],
)
```

### Handoffs

```python
from agents import Agent

specialist = Agent(
    name="Specialist",
    handoff_description="Expert for technical questions",
    instructions="You handle technical inquiries.",
)

triage = Agent(
    name="Triage",
    instructions="Route to specialist for technical questions.",
    handoffs=[specialist],
)
```

### Sessions

```python
from agents import Agent, Runner, SQLiteSession
from agents.extensions.memory import SQLAlchemySession, EncryptedSession

# SQLite (simple persistence)
session = SQLiteSession("user-123", "conversations.db")

# SQLAlchemy (production databases)
session = SQLAlchemySession.from_url(
    "user-123",
    url="postgresql+asyncpg://user:pass@host/db",
    create_tables=True,
)

# Encrypted (sensitive data)
session = EncryptedSession(
    session_id="user-123",
    underlying_session=underlying,
    encryption_key="secret-key",
    ttl=600,
)

result = await Runner.run(agent, "Message", session=session)
```

### Tracing

```python
from agents.tracing import custom_span, TracingProcessor

# Custom spans
with custom_span("my_operation", {"key": "value"}) as span:
    result = do_work()
    span.set_output({"result": result})

# Custom processor
class MetricsProcessor(TracingProcessor):
    def on_span_start(self, span): pass
    def on_span_end(self, span):
        # Export metrics
        pass
    def on_trace_start(self, trace): pass
    def on_trace_end(self, trace): pass
    def shutdown(self): pass
    def force_flush(self): pass
```

## Project Structure

```
agents_app/
├── main.py              # Entry point, runner setup
├── config.py            # Settings (Pydantic BaseSettings)
├── agents/
│   ├── __init__.py
│   ├── triage.py        # Triage/router agent
│   └── specialists/     # Domain-specific agents
├── tools/
│   ├── __init__.py
│   └── registry.py      # Centralized tool registry
├── guardrails/
│   ├── input.py         # Input validation
│   └── output.py        # Output filtering
├── sessions/
│   ├── factory.py       # Session creation
│   └── encrypted.py     # Encryption wrapper
├── tracing/
│   ├── processors.py    # Custom trace processors
│   └── exporters.py     # OpenTelemetry export
└── tests/
    ├── test_agents.py
    └── test_tools.py
```

## Quick Reference Tables

### Agent Configuration

| Parameter | Type | Purpose |
|-----------|------|---------|
| `name` | str | Agent identifier |
| `instructions` | str | System prompt |
| `model` | str | Model name (gpt-4o, gpt-5.2) |
| `tools` | list | Function tools, MCP tools |
| `handoffs` | list | Agents to delegate to |
| `output_type` | BaseModel | Structured output schema |
| `input_guardrails` | list | Pre-execution validation |
| `output_guardrails` | list | Post-execution filtering |

### Session Types

| Type | Use Case | Persistence |
|------|----------|-------------|
| `SQLiteSession` | Development, simple apps | File-based |
| `SQLAlchemySession` | Production, any DB | Database |
| `EncryptedSession` | Sensitive data | Wrapped session |

### Error Handling

| Exception | Cause | Handle |
|-----------|-------|--------|
| `InputGuardrailTripwireTriggered` | Input validation failed | Reject input |
| `OutputGuardrailTripwireTriggered` | Output failed policy | Filter/retry |
| `ModelBehaviorError` | Invalid tool call JSON | Log, provide feedback |
| `UserError` | Configuration error | Fix config |

## Common Workflows

### Multi-Agent Coordination

See `references/orchestration-patterns.md` for:
- Hierarchical agent trees
- Handoff strategies with context passing
- State machine patterns
- Human-in-the-loop integration

### Production Observability

See `references/observability-patterns.md` for:
- OpenTelemetry integration
- Custom trace processors
- Metrics collection
- Distributed tracing

### Scalable Deployment

See `references/scalability-patterns.md` for:
- Horizontal scaling strategies
- Load balancing agents
- Caching patterns
- Resource management

### Security Hardening

See `references/security-patterns.md` for:
- Input sanitization
- Output filtering
- Credential management
- Audit logging

## Reference Documentation

| File | Content |
|------|---------|
| `references/core-patterns.md` | Agent, tool, guardrail patterns |
| `references/orchestration-patterns.md` | Multi-agent, handoffs, state machines |
| `references/observability-patterns.md` | Tracing, metrics, logging |
| `references/scalability-patterns.md` | Scaling, caching, load balancing |
| `references/security-patterns.md` | Input/output guardrails, encryption |
| `references/voice-realtime.md` | Voice pipelines, realtime agents |
| `templates/` | Starter templates for common use cases |
| `examples/` | Production-ready implementations |

## Anti-Patterns

| Avoid | Why | Instead |
|-------|-----|---------|
| Business logic in agent instructions | Hard to test, maintain | Create tool functions |
| Catching generic Exception | Hides errors | Catch specific SDK exceptions |
| Hardcoded model names | Inflexible | Use config/environment |
| Missing guardrails on user-facing agents | Security risk | Always validate input |
| Synchronous blocking in async handlers | Performance degradation | Use async/await properly |
| No session persistence in production | Lost conversation context | Use SQLAlchemy/encrypted sessions |
| Skipping tracing | No observability | Always instrument |

## Quality Checklist

Before delivering agent code:

- [ ] Agent has clear, specific instructions
- [ ] Tools have docstrings with argument descriptions
- [ ] Input guardrails validate user content
- [ ] Output guardrails filter sensitive data
- [ ] Sessions persist across requests (if needed)
- [ ] Tracing captures all agent operations
- [ ] Errors handled with specific exception types
- [ ] Configuration via environment/settings, not hardcoded
- [ ] Tests cover agent behavior and tool execution
- [ ] MCP tools use fully qualified names (Server:tool_name)
