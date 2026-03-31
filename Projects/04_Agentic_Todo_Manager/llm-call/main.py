import os
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

solver_agent = Agent(
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

app = FastAPI(title="LLM Call Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class LLMRequest(BaseModel):
    prompt: str


class LLMResponse(BaseModel):
    response: str


@app.get("/health")
def health():
    return {"status": "healthy", "model": "gpt-4o-mini", "provider": "openai"}


@app.post("/llm", response_model=LLMResponse)
async def llm_call(request: LLMRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    try:
        result = await Runner.run(solver_agent, request.prompt)
        return LLMResponse(response=result.final_output)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")
