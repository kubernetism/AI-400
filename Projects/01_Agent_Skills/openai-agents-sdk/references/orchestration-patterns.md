# Orchestration Patterns

## Contents
- Hierarchical Agent Trees
- Handoff Strategies
- State Machine Agents
- Human-in-the-Loop
- Context Passing Between Agents

## Hierarchical Agent Trees

Build agent hierarchies for complex workflows:

```python
from agents import Agent, Runner
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions

# Level 3: Leaf specialists (no handoffs)
billing_payments = Agent(
    name="Payment Specialist",
    handoff_description="Handles payment processing and refunds",
    instructions="""You are a payment specialist.
    Handle payment methods, process refunds, and resolve payment issues.
    You have access to the payment system.""",
    tools=[process_payment, issue_refund, get_payment_history],
)

billing_invoices = Agent(
    name="Invoice Specialist",
    handoff_description="Handles invoice generation and disputes",
    instructions="""You are an invoice specialist.
    Generate invoices, explain charges, and handle disputes.""",
    tools=[generate_invoice, get_invoice_details, create_credit_note],
)

tech_network = Agent(
    name="Network Specialist",
    handoff_description="Handles network connectivity issues",
    instructions="""You are a network specialist.
    Diagnose connectivity issues and guide network configuration.""",
    tools=[ping_server, check_dns, trace_route],
)

tech_software = Agent(
    name="Software Specialist",
    handoff_description="Handles software installation and bugs",
    instructions="""You are a software specialist.
    Help with installation, updates, and bug resolution.""",
    tools=[check_version, get_release_notes, submit_bug_report],
)

# Level 2: Department leads (hand off to specialists)
billing_lead = Agent(
    name="Billing Department",
    handoff_description="All billing, payment, and invoice questions",
    instructions=prompt_with_handoff_instructions("""
    You are the billing department lead.
    For payment issues (refunds, methods, history), hand off to Payment Specialist.
    For invoice questions (generation, disputes), hand off to Invoice Specialist.
    Answer general billing questions yourself.
    """),
    handoffs=[billing_payments, billing_invoices],
    tools=[get_account_balance, get_subscription_status],
)

tech_lead = Agent(
    name="Technical Support",
    handoff_description="All technical issues and troubleshooting",
    instructions=prompt_with_handoff_instructions("""
    You are the technical support lead.
    For network/connectivity issues, hand off to Network Specialist.
    For software/application issues, hand off to Software Specialist.
    Handle general technical questions yourself.
    """),
    handoffs=[tech_network, tech_software],
    tools=[check_system_status, get_known_issues],
)

# Level 1: Root triage agent
triage = Agent(
    name="Customer Service",
    instructions=prompt_with_handoff_instructions("""
    You are the main customer service agent.
    Greet customers warmly and understand their needs.

    For billing/payment/invoice questions: hand off to Billing Department.
    For technical issues/troubleshooting: hand off to Technical Support.

    Handle simple questions (hours, locations, general info) yourself.
    """),
    handoffs=[billing_lead, tech_lead],
    tools=[get_business_info, check_operating_hours],
)


# Run the hierarchy
async def handle_customer(message: str, session):
    result = await Runner.run(triage, message, session=session)
    return result.final_output
```

## Handoff Strategies

### Strategy 1: Context-Preserving Handoff

Pass relevant context when handing off:

```python
from agents import Agent, Handoff, RunContextWrapper
from typing import Any

async def on_handoff_to_specialist(
    ctx: RunContextWrapper,
    handoff_input: dict,
) -> None:
    """Prepare context for specialist agent."""
    # Extract relevant info from conversation
    ctx.context["customer_id"] = handoff_input.get("customer_id")
    ctx.context["issue_summary"] = handoff_input.get("summary")
    ctx.context["previous_agent"] = handoff_input.get("from_agent")


specialist = Agent(
    name="Specialist",
    instructions="""You are a specialist.
    Check context for customer_id and issue_summary to understand the situation.
    The previous agent has already gathered initial information.""",
)

# Configure handoff with context passing
from agents import handoff

specialist_handoff = handoff(
    specialist,
    on_handoff=on_handoff_to_specialist,
    input_type=dict,
    tool_description="Hand off to specialist with context",
)

main_agent = Agent(
    name="Main Agent",
    handoffs=[specialist_handoff],
)
```

### Strategy 2: Conditional Handoffs

Enable/disable handoffs based on conditions:

```python
from agents import Agent, handoff

async def is_premium_customer(ctx: RunContextWrapper, agent: Agent) -> bool:
    """Check if customer is premium (can access priority support)."""
    customer_id = ctx.context.get("customer_id")
    if not customer_id:
        return False
    # Check customer tier
    return await get_customer_tier(customer_id) == "premium"


priority_support = Agent(
    name="Priority Support",
    handoff_description="Priority support for premium customers",
    instructions="You provide priority support with faster resolution.",
)

standard_support = Agent(
    name="Standard Support",
    handoff_description="Standard support for all customers",
    instructions="You provide standard support.",
)

triage = Agent(
    name="Triage",
    instructions="Route to appropriate support based on customer tier.",
    handoffs=[
        handoff(priority_support, is_enabled=is_premium_customer),
        standard_support,  # Always available
    ],
)
```

### Strategy 3: Input-Filtered Handoffs

Filter what information passes to the next agent:

```python
from agents import handoff

def filter_sensitive_data(input_data: list) -> list:
    """Remove sensitive information before handoff."""
    filtered = []
    for item in input_data:
        if isinstance(item, dict) and "content" in item:
            # Redact PII patterns
            content = redact_pii(item["content"])
            filtered.append({**item, "content": content})
        else:
            filtered.append(item)
    return filtered


external_agent = Agent(
    name="External Service",
    instructions="You interact with external services.",
)

internal_agent = Agent(
    name="Internal Agent",
    handoffs=[
        handoff(
            external_agent,
            input_filter=filter_sensitive_data,
        ),
    ],
)
```

## State Machine Agents

Implement state machines for complex workflows:

```python
from enum import Enum
from typing import Any
from dataclasses import dataclass
from agents import Agent, Runner, function_tool

class OrderState(Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


VALID_TRANSITIONS = {
    OrderState.DRAFT: [OrderState.CONFIRMED, OrderState.CANCELLED],
    OrderState.CONFIRMED: [OrderState.PROCESSING, OrderState.CANCELLED],
    OrderState.PROCESSING: [OrderState.SHIPPED, OrderState.CANCELLED],
    OrderState.SHIPPED: [OrderState.DELIVERED],
    OrderState.DELIVERED: [],
    OrderState.CANCELLED: [],
}


@dataclass
class OrderContext:
    order_id: str
    state: OrderState
    items: list
    customer_id: str


class StateMachineOrchestrator:
    """Orchestrate agents based on state machine."""

    def __init__(self):
        self.state_agents: dict[OrderState, Agent] = {}
        self._setup_agents()

    def _setup_agents(self):
        """Create agent for each state."""
        self.state_agents[OrderState.DRAFT] = Agent(
            name="Draft Order Agent",
            instructions="""Manage draft orders.
            Help customers add/remove items and confirm when ready.
            Valid actions: confirm order, cancel order, modify items.""",
            tools=[add_item, remove_item, confirm_order, cancel_order],
        )

        self.state_agents[OrderState.CONFIRMED] = Agent(
            name="Confirmed Order Agent",
            instructions="""Process confirmed orders.
            Validate payment and move to processing.
            Valid actions: process payment, cancel order.""",
            tools=[process_payment, cancel_order],
        )

        self.state_agents[OrderState.PROCESSING] = Agent(
            name="Processing Agent",
            instructions="""Handle order processing.
            Prepare items and arrange shipping.
            Valid actions: mark as shipped, cancel order.""",
            tools=[prepare_shipment, mark_shipped, cancel_order],
        )

        self.state_agents[OrderState.SHIPPED] = Agent(
            name="Shipping Agent",
            instructions="""Track shipped orders.
            Provide tracking info and confirm delivery.
            Valid actions: update tracking, confirm delivery.""",
            tools=[get_tracking_info, confirm_delivery],
        )

    def can_transition(self, from_state: OrderState, to_state: OrderState) -> bool:
        """Check if transition is valid."""
        return to_state in VALID_TRANSITIONS.get(from_state, [])

    async def handle(
        self,
        order: OrderContext,
        message: str,
        session,
    ) -> tuple[str, OrderState]:
        """Handle message with state-appropriate agent."""
        agent = self.state_agents.get(order.state)
        if not agent:
            return "Order is in terminal state.", order.state

        # Include state context in the run
        result = await Runner.run(
            agent,
            message,
            session=session,
            context={"order": order, "valid_transitions": VALID_TRANSITIONS[order.state]},
        )

        # Check if state changed (would be indicated in tool calls/output)
        new_state = self._extract_new_state(result)

        return result.final_output, new_state or order.state

    def _extract_new_state(self, result) -> OrderState | None:
        """Extract state change from result if any."""
        # Implementation depends on how tools signal state changes
        return None
```

## Human-in-the-Loop

Integrate human approval for sensitive actions:

```python
from agents import Agent, function_tool
from typing import Literal
import asyncio

class HumanApprovalRequired(Exception):
    """Raised when human approval is needed."""
    def __init__(self, action: str, details: dict):
        self.action = action
        self.details = details
        super().__init__(f"Human approval required for: {action}")


class ApprovalQueue:
    """Queue for human approval requests."""

    def __init__(self):
        self._pending: dict[str, asyncio.Future] = {}

    async def request_approval(
        self,
        request_id: str,
        action: str,
        details: dict,
    ) -> bool:
        """Request human approval and wait for response."""
        future = asyncio.get_event_loop().create_future()
        self._pending[request_id] = {
            "future": future,
            "action": action,
            "details": details,
        }

        # Notify human (webhook, UI update, etc.)
        await self._notify_human(request_id, action, details)

        # Wait for approval (with timeout)
        try:
            return await asyncio.wait_for(future, timeout=3600)  # 1 hour
        except asyncio.TimeoutError:
            del self._pending[request_id]
            return False

    def approve(self, request_id: str) -> None:
        """Approve a pending request."""
        if request_id in self._pending:
            self._pending[request_id]["future"].set_result(True)
            del self._pending[request_id]

    def reject(self, request_id: str) -> None:
        """Reject a pending request."""
        if request_id in self._pending:
            self._pending[request_id]["future"].set_result(False)
            del self._pending[request_id]

    async def _notify_human(self, request_id: str, action: str, details: dict):
        """Send notification to human reviewer."""
        # Implementation: webhook, email, Slack, etc.
        pass


approval_queue = ApprovalQueue()


@function_tool
async def process_large_refund(
    ctx,
    order_id: str,
    amount: float,
    reason: str,
) -> str:
    """Process a refund that requires approval.

    Args:
        order_id: The order to refund
        amount: Refund amount in dollars
        reason: Reason for refund
    """
    # Automatic approval for small amounts
    if amount < 100:
        return await _execute_refund(order_id, amount)

    # Human approval for large amounts
    request_id = f"refund-{order_id}-{amount}"
    approved = await approval_queue.request_approval(
        request_id,
        action="large_refund",
        details={"order_id": order_id, "amount": amount, "reason": reason},
    )

    if approved:
        return await _execute_refund(order_id, amount)
    else:
        return f"Refund of ${amount} was not approved."


async def _execute_refund(order_id: str, amount: float) -> str:
    # Execute the refund
    return f"Refund of ${amount} processed for order {order_id}"


# Agent with human-in-the-loop tool
support_agent = Agent(
    name="Support Agent",
    instructions="""You help customers with refunds.
    For refunds over $100, the system will automatically request human approval.
    Explain to the customer that large refunds require manager approval.""",
    tools=[process_large_refund],
)
```

## Context Passing Between Agents

Efficient context management across handoffs:

```python
from typing import Any, TypeVar
from dataclasses import dataclass, field
from agents import Agent, Runner

T = TypeVar("T")


@dataclass
class ConversationContext:
    """Shared context across all agents in a conversation."""

    # User information
    user_id: str | None = None
    user_name: str | None = None
    user_tier: str = "standard"

    # Conversation tracking
    interaction_count: int = 0
    agents_visited: list[str] = field(default_factory=list)

    # Accumulated data
    gathered_info: dict[str, Any] = field(default_factory=dict)
    action_history: list[dict] = field(default_factory=list)

    # Flags
    requires_followup: bool = False
    escalation_level: int = 0

    def record_agent_visit(self, agent_name: str):
        self.agents_visited.append(agent_name)
        self.interaction_count += 1

    def add_gathered_info(self, key: str, value: Any):
        self.gathered_info[key] = value

    def record_action(self, action: str, result: str):
        self.action_history.append({
            "action": action,
            "result": result,
            "agent": self.agents_visited[-1] if self.agents_visited else None,
        })


class ContextAwareRunner:
    """Runner that maintains context across agent handoffs."""

    def __init__(self):
        self._contexts: dict[str, ConversationContext] = {}

    def get_or_create_context(self, session_id: str) -> ConversationContext:
        if session_id not in self._contexts:
            self._contexts[session_id] = ConversationContext()
        return self._contexts[session_id]

    async def run(
        self,
        agent: Agent,
        message: str,
        session_id: str,
        session=None,
    ):
        """Run agent with context tracking."""
        ctx = self.get_or_create_context(session_id)
        ctx.record_agent_visit(agent.name)

        # Build context-aware instructions
        context_info = self._build_context_summary(ctx)

        result = await Runner.run(
            agent,
            message,
            session=session,
            context=ctx,
        )

        return result

    def _build_context_summary(self, ctx: ConversationContext) -> str:
        """Build summary of context for agent."""
        parts = []

        if ctx.user_name:
            parts.append(f"Customer: {ctx.user_name} ({ctx.user_tier})")

        if ctx.gathered_info:
            parts.append(f"Known info: {ctx.gathered_info}")

        if ctx.agents_visited:
            parts.append(f"Previous agents: {' -> '.join(ctx.agents_visited[-3:])}")

        if ctx.action_history:
            recent = ctx.action_history[-3:]
            parts.append(f"Recent actions: {recent}")

        return "\n".join(parts)


# Usage
runner = ContextAwareRunner()

async def handle_message(session_id: str, message: str):
    ctx = runner.get_or_create_context(session_id)

    # Set user info if available
    user = await get_user(session_id)
    if user:
        ctx.user_id = user.id
        ctx.user_name = user.name
        ctx.user_tier = user.tier

    result = await runner.run(
        triage_agent,
        message,
        session_id=session_id,
    )

    return result.final_output
```
