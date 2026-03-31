import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents import Agent, Runner, set_tracing_disabled
from agents.extensions.models.litellm_model import LitellmModel

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in .env")

# Disable OpenAI tracing since we're using Gemini
set_tracing_disabled(True)

# Create the Gemini model via LiteLLM
gemini_model = LitellmModel(
    model="gemini-2.0-flash",
    api_key=GEMINI_API_KEY,
)

# Create the solver agent
solver_agent = Agent(
    name="TaskSolver",
    model=gemini_model,
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
    return {"status": "healthy", "model": "gemini-2.0-flash", "provider": "litellm"}


@app.post("/llm", response_model=LLMResponse)
async def llm_call(request: LLMRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    try:
        result = await Runner.run(solver_agent, request.prompt)
        return LLMResponse(response=result.final_output)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")
