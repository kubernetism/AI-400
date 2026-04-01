import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents import Agent, Runner, set_tracing_disabled

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set in .env")

set_tracing_disabled(True)

SKILLS_DIR = Path(__file__).parent / "Skills"


# ── Skill loader ──


def load_skill(skill_folder: str) -> str:
    """Load SKILL.md + all reference .md files from a skill folder."""
    folder = SKILLS_DIR / skill_folder
    parts = []

    skill_file = folder / "SKILL.md"
    if skill_file.exists():
        parts.append(skill_file.read_text())

    # Load reference files
    refs_dir = folder / "references"
    if refs_dir.exists():
        for ref_file in sorted(refs_dir.glob("*.md")):
            parts.append(f"\n\n--- Reference: {ref_file.name} ---\n\n{ref_file.read_text()}")

    # Also check for top-level .md files (not SKILL.md)
    for md_file in sorted(folder.glob("*.md")):
        if md_file.name != "SKILL.md":
            parts.append(f"\n\n--- Reference: {md_file.name} ---\n\n{md_file.read_text()}")

    return "\n".join(parts)


# ── Agent definitions ──


# Default general-purpose agent
task_solver = Agent(
    name="TaskSolver",
    model="gpt-4o-mini",
    instructions="""You are an expert task solver. When given a task or subtask,
provide a complete, actionable solution. Be concise but thorough.

Format your response with:
- A brief summary of the approach
- Step-by-step instructions or solution
- Code examples if relevant
- Any important notes or considerations

Use markdown formatting for clarity.""",
)

# Planning Agent — powered by universal-planner skill
planning_instructions = load_skill("universal-planner")
planning_agent = Agent(
    name="PlanningAgent",
    model="gpt-4o-mini",
    instructions=f"""You are a Planning Agent. Your expertise is creating structured, actionable plans.
Use the following skill knowledge to produce excellent plans:

{planning_instructions}

When given a task or subtask, produce a complete, structured plan as your response.
Use markdown formatting for clarity.""",
)

# Teaching Specialist — powered by kubernetes-educator skill
teaching_instructions = load_skill("kubernetes-educator")
teaching_agent = Agent(
    name="TeachingSpecialist",
    model="gpt-4o-mini",
    instructions=f"""You are a Teaching Specialist Agent. Your expertise is educating learners about Kubernetes
and related infrastructure topics clearly and progressively.
Use the following skill knowledge to teach effectively:

{teaching_instructions}

When given a task or subtask, provide a clear, educational explanation with diagrams and examples.
Use markdown formatting for clarity.""",
)

# Kubernetes Specialist — powered by kubernetes-specialist skill
k8s_instructions = load_skill("kubernetes-specialist")
k8s_specialist_agent = Agent(
    name="KubernetesSpecialist",
    model="gpt-4o-mini",
    instructions=f"""You are a Kubernetes Specialist Agent. Your expertise is creating production-grade
Kubernetes manifests, RBAC policies, networking configs, and deployment strategies.
Use the following skill knowledge to produce expert K8s solutions:

{k8s_instructions}

When given a task or subtask, produce complete, production-ready Kubernetes manifests and configurations.
Use markdown formatting for clarity.""",
)

# Final Reviewer Agent
reviewer_agent = Agent(
    name="FinalReviewer",
    model="gpt-4o-mini",
    instructions="""You are a Final Reviewer Agent. Your job is to review all subtask solutions
for a given task and produce a consolidated, comprehensive summary.

When given a task title and all subtask solutions:
1. Evaluate each subtask solution for completeness and accuracy
2. Identify any gaps, inconsistencies, or areas for improvement
3. Produce a final consolidated review that ties all solutions together
4. Add an executive summary at the top
5. Rate the overall completeness (e.g., "90% complete — missing X")

Format your review with clear sections using markdown:
- Executive Summary
- Per-Subtask Review (brief assessment of each)
- Consolidated Solution / Final Answer
- Gaps & Recommendations

Be thorough but concise.""",
)

# Agent registry
AGENTS = {
    "task_solver": {
        "agent": task_solver,
        "name": "Task Solver",
        "description": "General-purpose task solver — provides actionable solutions for any topic",
    },
    "planning": {
        "agent": planning_agent,
        "name": "Planning Agent",
        "description": "Creates structured, actionable plans for projects, learning, events, and more",
    },
    "teaching": {
        "agent": teaching_agent,
        "name": "Teaching Specialist",
        "description": "Teaches Kubernetes concepts with diagrams, examples, and progressive disclosure",
    },
    "k8s_specialist": {
        "agent": k8s_specialist_agent,
        "name": "Kubernetes Specialist",
        "description": "Produces production-grade K8s manifests, RBAC, networking, and deployment configs",
    },
    "reviewer": {
        "agent": reviewer_agent,
        "name": "Final Reviewer",
        "description": "Reviews all subtask solutions and produces a consolidated summary with gap analysis",
    },
}


# ── FastAPI app ──


app = FastAPI(title="LLM Call Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ──


class LLMRequest(BaseModel):
    prompt: str
    agent_id: str | None = None


class LLMResponse(BaseModel):
    response: str
    agent_id: str
    agent_name: str


class AgentInfo(BaseModel):
    id: str
    name: str
    description: str


class SubtaskSolution(BaseModel):
    title: str
    response: str


class ReviewRequest(BaseModel):
    task_title: str
    subtask_solutions: list[SubtaskSolution]


class ReviewResponse(BaseModel):
    response: str


# ── Routes ──


@app.get("/health")
def health():
    return {"status": "healthy", "model": "gpt-4o-mini", "provider": "openai", "agents": len(AGENTS)}


@app.get("/agents", response_model=list[AgentInfo])
def list_agents():
    return [
        AgentInfo(id=agent_id, name=info["name"], description=info["description"])
        for agent_id, info in AGENTS.items()
        if agent_id != "reviewer"  # Reviewer is not assignable to subtasks
    ]


@app.post("/llm", response_model=LLMResponse)
async def llm_call(request: LLMRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    agent_id = request.agent_id or "task_solver"
    if agent_id not in AGENTS:
        raise HTTPException(status_code=400, detail=f"Unknown agent: {agent_id}")

    agent_info = AGENTS[agent_id]

    try:
        result = await Runner.run(agent_info["agent"], request.prompt)
        return LLMResponse(
            response=result.final_output,
            agent_id=agent_id,
            agent_name=agent_info["name"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")


@app.post("/review", response_model=ReviewResponse)
async def review_task(request: ReviewRequest):
    if not request.subtask_solutions:
        raise HTTPException(status_code=400, detail="No subtask solutions to review")

    # Build the review prompt
    parts = [f'# Task: "{request.task_title}"\n\nBelow are all subtask solutions to review:\n']
    for i, sol in enumerate(request.subtask_solutions, 1):
        parts.append(f"## Subtask {i}: {sol.title}\n\n{sol.response}\n\n---\n")
    parts.append("\nPlease provide your comprehensive review of all the above solutions.")

    prompt = "\n".join(parts)

    try:
        result = await Runner.run(reviewer_agent, prompt)
        return ReviewResponse(response=result.final_output)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Review failed: {str(e)}")
