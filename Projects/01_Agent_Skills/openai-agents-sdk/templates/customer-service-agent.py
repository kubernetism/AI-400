"""
Customer Service Agent Template

Production-ready multi-agent customer service system with:
- Triage routing
- Specialist agents
- Session persistence
- Comprehensive guardrails
- Full observability
"""

import asyncio
from typing import Any
from pydantic import BaseModel, Field
from agents import (
    Agent,
    Runner,
    SQLiteSession,
    function_tool,
    input_guardrail,
    output_guardrail,
    GuardrailFunctionOutput,
)
from agents.extensions.handoff_prompt import prompt_with_handoff_instructions
from agents.tracing import add_trace_processor, TracingProcessor, Trace, Span


# =============================================================================
# Configuration
# =============================================================================

class Config:
    MODEL = "gpt-5.2"
    SESSION_DB = "customer_service.db"
    MAX_TURNS_PER_SESSION = 50


# =============================================================================
# Output Types
# =============================================================================

class CustomerResponse(BaseModel):
    """Structured response to customer."""
    message: str = Field(description="Response message to the customer")
    sentiment: str = Field(description="Detected customer sentiment: positive, neutral, negative")
    needs_followup: bool = Field(description="Whether this needs follow-up action")


class ValidationResult(BaseModel):
    """Result of input validation."""
    is_valid: bool
    reasoning: str


# =============================================================================
# Tools
# =============================================================================

@function_tool
async def lookup_customer(customer_id: str) -> dict:
    """Look up customer information.

    Args:
        customer_id: The customer's unique identifier
    """
    # In production, this would query your database
    return {
        "customer_id": customer_id,
        "name": "Jane Smith",
        "email": "jane.smith@example.com",
        "tier": "premium",
        "account_status": "active",
        "member_since": "2023-01-15",
    }


@function_tool
async def get_order_history(customer_id: str, limit: int = 5) -> list[dict]:
    """Get customer's recent orders.

    Args:
        customer_id: The customer's unique identifier
        limit: Maximum number of orders to return
    """
    # In production, this would query your database
    return [
        {"order_id": "ORD-001", "date": "2024-01-10", "total": 150.00, "status": "delivered"},
        {"order_id": "ORD-002", "date": "2024-01-05", "total": 75.50, "status": "shipped"},
    ]


@function_tool
async def create_support_ticket(
    customer_id: str,
    subject: str,
    description: str,
    priority: str = "medium",
) -> dict:
    """Create a support ticket.

    Args:
        customer_id: The customer's unique identifier
        subject: Ticket subject
        description: Detailed description of the issue
        priority: Ticket priority (low, medium, high, urgent)
    """
    # In production, this would create a ticket in your system
    return {
        "ticket_id": "TKT-12345",
        "status": "created",
        "message": f"Support ticket created with priority: {priority}",
    }


@function_tool
async def process_refund(
    order_id: str,
    amount: float,
    reason: str,
) -> dict:
    """Process a refund for an order.

    Args:
        order_id: The order to refund
        amount: Refund amount in dollars
        reason: Reason for the refund
    """
    # In production, this would process the refund
    return {
        "refund_id": "REF-98765",
        "order_id": order_id,
        "amount": amount,
        "status": "processed",
        "message": f"Refund of ${amount:.2f} processed successfully",
    }


@function_tool
async def check_product_availability(product_id: str) -> dict:
    """Check if a product is in stock.

    Args:
        product_id: The product identifier
    """
    return {
        "product_id": product_id,
        "in_stock": True,
        "quantity_available": 42,
        "estimated_restock": None,
    }


# =============================================================================
# Guardrails
# =============================================================================

# Validation agent for guardrails
validation_agent = Agent(
    name="Input Validator",
    instructions="Validate if the input is a legitimate customer service request.",
    output_type=ValidationResult,
    model=Config.MODEL,
)


@input_guardrail
async def customer_input_guardrail(ctx, agent, input_data) -> GuardrailFunctionOutput:
    """Validate customer input before processing."""
    text = str(input_data).lower()

    # Check for obviously inappropriate content
    inappropriate_patterns = [
        "ignore previous",
        "you are now",
        "pretend to be",
        "bypass",
    ]

    for pattern in inappropriate_patterns:
        if pattern in text:
            return GuardrailFunctionOutput(
                output_info={"reason": "Potentially inappropriate content"},
                tripwire_triggered=True,
            )

    # Run validation agent for more nuanced checks
    result = await Runner.run(validation_agent, input_data, context=ctx.context)
    validation = result.final_output_as(ValidationResult)

    return GuardrailFunctionOutput(
        output_info={"validation": validation.reasoning},
        tripwire_triggered=not validation.is_valid,
    )


@output_guardrail
async def pii_output_guardrail(ctx, agent, output) -> GuardrailFunctionOutput:
    """Ensure no PII is leaked in responses."""
    import re

    text = str(output)

    # Check for PII patterns
    pii_patterns = {
        "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
        "credit_card": r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b",
    }

    for pii_type, pattern in pii_patterns.items():
        if re.search(pattern, text):
            return GuardrailFunctionOutput(
                output_info={"reason": f"Response contains {pii_type}"},
                tripwire_triggered=True,
            )

    return GuardrailFunctionOutput(
        output_info={"status": "clean"},
        tripwire_triggered=False,
    )


# =============================================================================
# Specialist Agents
# =============================================================================

billing_specialist = Agent(
    name="Billing Specialist",
    handoff_description="Expert for billing, payments, refunds, and invoice questions",
    instructions=prompt_with_handoff_instructions("""
    You are a billing specialist for customer service.

    Your responsibilities:
    - Help with payment inquiries
    - Process refunds (use the process_refund tool)
    - Explain charges and invoices
    - Handle payment method updates

    Guidelines:
    - Always verify the customer before processing refunds
    - Explain any charges clearly
    - Be empathetic about billing concerns
    - For refunds over $500, create a support ticket for manager review
    """),
    model=Config.MODEL,
    tools=[lookup_customer, get_order_history, process_refund, create_support_ticket],
    output_guardrails=[pii_output_guardrail],
)

orders_specialist = Agent(
    name="Orders Specialist",
    handoff_description="Expert for order status, shipping, and delivery questions",
    instructions=prompt_with_handoff_instructions("""
    You are an orders specialist for customer service.

    Your responsibilities:
    - Check order status
    - Track shipments
    - Handle delivery issues
    - Process order modifications

    Guidelines:
    - Provide specific tracking information when available
    - Set realistic expectations for delivery times
    - Escalate complex shipping issues to support tickets
    """),
    model=Config.MODEL,
    tools=[lookup_customer, get_order_history, create_support_ticket],
    output_guardrails=[pii_output_guardrail],
)

product_specialist = Agent(
    name="Product Specialist",
    handoff_description="Expert for product information, availability, and recommendations",
    instructions=prompt_with_handoff_instructions("""
    You are a product specialist for customer service.

    Your responsibilities:
    - Answer product questions
    - Check product availability
    - Provide product recommendations
    - Explain product features

    Guidelines:
    - Be knowledgeable about products
    - Check availability before making promises
    - Suggest alternatives if products are out of stock
    """),
    model=Config.MODEL,
    tools=[check_product_availability, lookup_customer],
    output_guardrails=[pii_output_guardrail],
)


# =============================================================================
# Triage Agent
# =============================================================================

triage_agent = Agent(
    name="Customer Service",
    instructions=prompt_with_handoff_instructions("""
    You are the main customer service agent. Your job is to greet customers
    warmly and route them to the right specialist.

    Routing guidelines:
    - Billing questions (payments, refunds, charges) → Billing Specialist
    - Order questions (status, shipping, delivery) → Orders Specialist
    - Product questions (availability, features, recommendations) → Product Specialist

    For general questions you can answer directly:
    - Business hours (9 AM - 6 PM EST, Monday-Friday)
    - Return policy (30 days with receipt)
    - Contact information

    Always:
    - Be friendly and professional
    - Acknowledge the customer's concern
    - Use the customer lookup tool to personalize the experience
    """),
    model=Config.MODEL,
    tools=[lookup_customer],
    handoffs=[billing_specialist, orders_specialist, product_specialist],
    input_guardrails=[customer_input_guardrail],
    output_guardrails=[pii_output_guardrail],
)


# =============================================================================
# Observability
# =============================================================================

class CustomerServiceMetrics(TracingProcessor):
    """Collect metrics for customer service operations."""

    def __init__(self):
        self.total_interactions = 0
        self.interactions_by_agent = {}
        self.handoff_count = 0
        self.error_count = 0

    def on_trace_start(self, trace: Trace) -> None:
        self.total_interactions += 1

    def on_trace_end(self, trace: Trace) -> None:
        pass

    def on_span_start(self, span: Span[Any]) -> None:
        span_type = span.span_data.__class__.__name__
        if "Agent" in span_type:
            name = getattr(span.span_data, "name", "unknown")
            self.interactions_by_agent[name] = (
                self.interactions_by_agent.get(name, 0) + 1
            )

    def on_span_end(self, span: Span[Any]) -> None:
        if span.error:
            self.error_count += 1

    def shutdown(self) -> None:
        pass

    def force_flush(self) -> None:
        pass

    def report(self) -> dict:
        return {
            "total_interactions": self.total_interactions,
            "by_agent": self.interactions_by_agent,
            "handoffs": self.handoff_count,
            "errors": self.error_count,
        }


# =============================================================================
# Main Runner
# =============================================================================

async def handle_customer_message(
    customer_id: str,
    message: str,
    session_id: str | None = None,
) -> str:
    """Handle a customer message."""

    # Create or get session
    session = SQLiteSession(
        session_id or f"session-{customer_id}",
        Config.SESSION_DB,
    )

    try:
        result = await Runner.run(
            triage_agent,
            message,
            session=session,
            context={"customer_id": customer_id},
        )
        return result.final_output

    except Exception as e:
        # Log error and return graceful message
        print(f"Error handling message: {e}")
        return "I apologize, but I'm experiencing a technical issue. Please try again or contact us at support@example.com."


async def main():
    """Example usage."""
    # Set up metrics
    metrics = CustomerServiceMetrics()
    add_trace_processor(metrics)

    print("Customer Service Agent Ready")
    print("=" * 50)

    # Simulate customer interactions
    customer_id = "CUST-12345"

    messages = [
        "Hi, I need help with my recent order",
        "Can you check the status of order ORD-001?",
        "I'd like a refund for that order",
    ]

    for message in messages:
        print(f"\nCustomer: {message}")
        response = await handle_customer_message(customer_id, message)
        print(f"Agent: {response}")

    # Print metrics
    print("\n" + "=" * 50)
    print("Session Metrics:")
    print(metrics.report())


if __name__ == "__main__":
    asyncio.run(main())
