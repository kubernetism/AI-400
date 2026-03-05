"""
Workflow Automation Agent Template

Production-ready agent for automating business workflows with:
- Task orchestration
- Approval workflows
- External service integration
- State management
"""

import asyncio
from enum import Enum
from typing import Any
from dataclasses import dataclass, field
from datetime import datetime
from pydantic import BaseModel, Field
from agents import Agent, Runner, function_tool, SQLiteSession
from agents.tracing import custom_span


# =============================================================================
# Workflow State Machine
# =============================================================================

class WorkflowState(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


VALID_TRANSITIONS = {
    WorkflowState.PENDING: [WorkflowState.IN_PROGRESS, WorkflowState.CANCELLED],
    WorkflowState.IN_PROGRESS: [
        WorkflowState.AWAITING_APPROVAL,
        WorkflowState.COMPLETED,
        WorkflowState.FAILED,
        WorkflowState.CANCELLED,
    ],
    WorkflowState.AWAITING_APPROVAL: [
        WorkflowState.APPROVED,
        WorkflowState.REJECTED,
        WorkflowState.CANCELLED,
    ],
    WorkflowState.APPROVED: [WorkflowState.IN_PROGRESS, WorkflowState.COMPLETED],
    WorkflowState.REJECTED: [WorkflowState.PENDING, WorkflowState.CANCELLED],
    WorkflowState.COMPLETED: [],
    WorkflowState.FAILED: [WorkflowState.PENDING],
    WorkflowState.CANCELLED: [],
}


@dataclass
class WorkflowInstance:
    """Instance of a running workflow."""
    workflow_id: str
    workflow_type: str
    state: WorkflowState
    created_at: datetime
    created_by: str
    data: dict = field(default_factory=dict)
    history: list[dict] = field(default_factory=list)

    def can_transition(self, to_state: WorkflowState) -> bool:
        return to_state in VALID_TRANSITIONS.get(self.state, [])

    def transition(self, to_state: WorkflowState, reason: str = ""):
        if not self.can_transition(to_state):
            raise ValueError(
                f"Cannot transition from {self.state.value} to {to_state.value}"
            )
        self.history.append({
            "from": self.state.value,
            "to": to_state.value,
            "timestamp": datetime.utcnow().isoformat(),
            "reason": reason,
        })
        self.state = to_state


# In-memory workflow storage (use database in production)
_workflows: dict[str, WorkflowInstance] = {}


# =============================================================================
# Output Types
# =============================================================================

class TaskResult(BaseModel):
    """Result of a task execution."""
    success: bool = Field(description="Whether the task succeeded")
    message: str = Field(description="Result message")
    output: dict = Field(default_factory=dict, description="Task output data")


class ApprovalRequest(BaseModel):
    """Request for workflow approval."""
    workflow_id: str
    description: str
    requested_by: str
    required_approvers: list[str]
    deadline: str | None = None


# =============================================================================
# Tools
# =============================================================================

@function_tool
async def create_workflow(
    workflow_type: str,
    initial_data: dict,
    created_by: str,
) -> dict:
    """Create a new workflow instance.

    Args:
        workflow_type: Type of workflow (e.g., 'employee_onboarding', 'purchase_request')
        initial_data: Initial data for the workflow
        created_by: User ID of creator
    """
    workflow_id = f"WF-{len(_workflows) + 1:05d}"

    workflow = WorkflowInstance(
        workflow_id=workflow_id,
        workflow_type=workflow_type,
        state=WorkflowState.PENDING,
        created_at=datetime.utcnow(),
        created_by=created_by,
        data=initial_data,
    )
    _workflows[workflow_id] = workflow

    return {
        "workflow_id": workflow_id,
        "state": workflow.state.value,
        "message": f"Workflow created: {workflow_type}",
    }


@function_tool
async def get_workflow_status(workflow_id: str) -> dict:
    """Get the current status of a workflow.

    Args:
        workflow_id: The workflow identifier
    """
    workflow = _workflows.get(workflow_id)
    if not workflow:
        return {"error": f"Workflow {workflow_id} not found"}

    return {
        "workflow_id": workflow_id,
        "type": workflow.workflow_type,
        "state": workflow.state.value,
        "created_at": workflow.created_at.isoformat(),
        "created_by": workflow.created_by,
        "data": workflow.data,
        "history": workflow.history,
    }


@function_tool
async def update_workflow_state(
    workflow_id: str,
    new_state: str,
    reason: str = "",
) -> dict:
    """Update workflow state.

    Args:
        workflow_id: The workflow identifier
        new_state: New state to transition to
        reason: Reason for the transition
    """
    workflow = _workflows.get(workflow_id)
    if not workflow:
        return {"error": f"Workflow {workflow_id} not found"}

    try:
        target_state = WorkflowState(new_state)
        workflow.transition(target_state, reason)
        return {
            "workflow_id": workflow_id,
            "state": workflow.state.value,
            "message": f"Transitioned to {new_state}",
        }
    except ValueError as e:
        return {"error": str(e)}


@function_tool
async def execute_task(
    task_name: str,
    parameters: dict,
    workflow_id: str | None = None,
) -> dict:
    """Execute a workflow task.

    Args:
        task_name: Name of the task to execute
        parameters: Task parameters
        workflow_id: Optional associated workflow
    """
    with custom_span("task_execution", {"task": task_name}):
        # Simulate task execution
        await asyncio.sleep(0.5)

        # Mock task results based on task type
        task_handlers = {
            "send_email": lambda p: {
                "success": True,
                "message": f"Email sent to {p.get('to', 'unknown')}",
            },
            "create_account": lambda p: {
                "success": True,
                "message": f"Account created for {p.get('username', 'unknown')}",
                "account_id": "ACC-12345",
            },
            "provision_resources": lambda p: {
                "success": True,
                "message": f"Provisioned {p.get('resource_type', 'unknown')}",
                "resource_id": "RES-67890",
            },
            "notify_slack": lambda p: {
                "success": True,
                "message": f"Slack notification sent to #{p.get('channel', 'general')}",
            },
        }

        handler = task_handlers.get(
            task_name,
            lambda p: {"success": True, "message": f"Task {task_name} completed"},
        )
        result = handler(parameters)

        if workflow_id:
            result["workflow_id"] = workflow_id

        return result


@function_tool
async def request_approval(
    workflow_id: str,
    description: str,
    approvers: list[str],
) -> dict:
    """Request approval for a workflow step.

    Args:
        workflow_id: The workflow requiring approval
        description: Description of what needs approval
        approvers: List of user IDs who can approve
    """
    workflow = _workflows.get(workflow_id)
    if not workflow:
        return {"error": f"Workflow {workflow_id} not found"}

    # Transition to awaiting approval
    try:
        workflow.transition(WorkflowState.AWAITING_APPROVAL, "Approval requested")
    except ValueError as e:
        return {"error": str(e)}

    return {
        "workflow_id": workflow_id,
        "approval_id": f"APR-{workflow_id}",
        "status": "pending_approval",
        "approvers": approvers,
        "message": f"Approval requested from: {', '.join(approvers)}",
    }


@function_tool
async def submit_approval_decision(
    workflow_id: str,
    approved: bool,
    approver: str,
    comments: str = "",
) -> dict:
    """Submit an approval decision.

    Args:
        workflow_id: The workflow to approve/reject
        approved: True to approve, False to reject
        approver: User ID of the approver
        comments: Optional comments
    """
    workflow = _workflows.get(workflow_id)
    if not workflow:
        return {"error": f"Workflow {workflow_id} not found"}

    new_state = WorkflowState.APPROVED if approved else WorkflowState.REJECTED
    reason = f"{'Approved' if approved else 'Rejected'} by {approver}"
    if comments:
        reason += f": {comments}"

    try:
        workflow.transition(new_state, reason)
        return {
            "workflow_id": workflow_id,
            "state": workflow.state.value,
            "decision": "approved" if approved else "rejected",
            "approver": approver,
        }
    except ValueError as e:
        return {"error": str(e)}


@function_tool
async def list_pending_workflows(
    workflow_type: str | None = None,
    state: str | None = None,
) -> list[dict]:
    """List workflows matching criteria.

    Args:
        workflow_type: Filter by workflow type
        state: Filter by state
    """
    results = []
    for wf in _workflows.values():
        if workflow_type and wf.workflow_type != workflow_type:
            continue
        if state and wf.state.value != state:
            continue

        results.append({
            "workflow_id": wf.workflow_id,
            "type": wf.workflow_type,
            "state": wf.state.value,
            "created_at": wf.created_at.isoformat(),
        })

    return results


# =============================================================================
# Agents
# =============================================================================

# Task Executor Agent
task_executor = Agent(
    name="Task Executor",
    handoff_description="Executes individual workflow tasks",
    instructions="""You execute workflow tasks.

Available tasks:
- send_email: Send email notifications (requires: to, subject, body)
- create_account: Create user accounts (requires: username, email)
- provision_resources: Provision cloud resources (requires: resource_type, config)
- notify_slack: Send Slack notifications (requires: channel, message)

For each task:
1. Validate required parameters
2. Execute the task
3. Report success/failure
4. Handle errors gracefully

Always log task execution for audit purposes.
""",
    model="gpt-5.2",
    tools=[execute_task, get_workflow_status],
)

# Approval Manager Agent
approval_manager = Agent(
    name="Approval Manager",
    handoff_description="Manages workflow approvals",
    instructions="""You manage the approval process for workflows.

Responsibilities:
1. Request approvals from appropriate people
2. Track pending approvals
3. Process approval decisions
4. Handle escalations for overdue approvals

Approval guidelines:
- Financial requests over $10,000 need VP approval
- Resource provisioning needs team lead approval
- User account creation needs IT approval

Always provide clear context for approval requests.
""",
    model="gpt-5.2",
    tools=[
        request_approval,
        submit_approval_decision,
        list_pending_workflows,
        get_workflow_status,
    ],
)

# Workflow Orchestrator
workflow_orchestrator = Agent(
    name="Workflow Orchestrator",
    instructions="""You orchestrate business workflows.

Your role:
1. Create and manage workflow instances
2. Determine next steps based on workflow state
3. Delegate tasks to appropriate agents
4. Handle errors and retries
5. Report workflow completion

Workflow types you manage:
- employee_onboarding: New employee setup
- purchase_request: Procurement workflow
- access_request: System access provisioning
- expense_approval: Expense report processing

Workflow patterns:
1. Start workflow in PENDING state
2. Move to IN_PROGRESS when executing
3. Request approvals when needed
4. Complete tasks in proper order
5. Mark COMPLETED or FAILED at end

Always:
- Validate state transitions
- Log all actions
- Handle failures gracefully
- Keep stakeholders informed
""",
    model="gpt-5.2",
    tools=[
        create_workflow,
        get_workflow_status,
        update_workflow_state,
        list_pending_workflows,
    ],
    handoffs=[task_executor, approval_manager],
)


# =============================================================================
# Workflow Templates
# =============================================================================

WORKFLOW_TEMPLATES = {
    "employee_onboarding": {
        "name": "Employee Onboarding",
        "steps": [
            {"task": "create_account", "params": ["username", "email"]},
            {"task": "provision_resources", "params": ["resource_type"]},
            {"task": "send_email", "params": ["to", "subject", "body"]},
            {"approval": True, "approvers": ["hr_manager"]},
            {"task": "notify_slack", "params": ["channel", "message"]},
        ],
    },
    "purchase_request": {
        "name": "Purchase Request",
        "steps": [
            {"approval": True, "approvers": ["manager"], "condition": "amount < 1000"},
            {"approval": True, "approvers": ["vp"], "condition": "amount >= 1000"},
            {"task": "send_email", "params": ["to", "subject", "body"]},
        ],
    },
}


# =============================================================================
# Main Runner
# =============================================================================

async def handle_workflow_request(
    request: str,
    user_id: str,
) -> str:
    """Handle a workflow-related request."""

    session = SQLiteSession(f"workflow-{user_id}", "workflows.db")

    with custom_span("workflow_request", {"user": user_id}):
        result = await Runner.run(
            workflow_orchestrator,
            request,
            session=session,
            context={"user_id": user_id},
        )
        return result.final_output


async def main():
    """Example usage."""
    print("Workflow Automation Agent Ready")
    print("=" * 50)

    user_id = "user-123"

    # Example workflow requests
    requests = [
        "Start an employee onboarding workflow for John Doe (john.doe@company.com)",
        "Check the status of workflow WF-00001",
        "Submit approval for workflow WF-00001",
        "List all pending workflows",
    ]

    for request in requests:
        print(f"\nRequest: {request}")
        print("-" * 40)
        response = await handle_workflow_request(request, user_id)
        print(f"Response:\n{response}")


if __name__ == "__main__":
    asyncio.run(main())
