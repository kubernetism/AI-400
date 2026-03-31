# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agentic Todo Manager — a three-service application with a Next.js frontend, a FastAPI task CRUD backend, and a separate FastAPI LLM service that uses the OpenAI Agents SDK (gpt-4o-mini) to provide AI-powered task solutions.

## Architecture

```
frontend/          Next.js 16 (React 19, Tailwind v4, App Router)
  app/page.tsx     Single-page client component — all state lives here
  app/components/  TaskCard, SubtaskItem, AddTaskForm, LLMResponseCard, Toast

backend/           FastAPI — task CRUD with JSON file storage
  main.py          Single file: GET/POST/PATCH/DELETE /tasks, /health
  tasks.json       Auto-created file DB (persists across restarts)

llm-call/          FastAPI — LLM agent service
  main.py          Single file: POST /llm, /health
                   Uses openai-agents SDK Agent + Runner with gpt-4o-mini
```

The frontend talks to two backends:
- **Task API** (default `localhost:8000`): CRUD operations on tasks + subtasks
- **LLM API** (default `localhost:8001`): Sends subtask prompts, gets AI solutions back

Configurable via `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_LLM_URL` env vars.

## Development Commands

### Backend (Task API)
```bash
cd backend
uv sync                        # install deps
uv run fastapi dev main.py     # runs on :8000 with hot reload
```

### LLM Service
```bash
cd llm-call
uv sync                        # install deps
# Requires OPENAI_API_KEY in llm-call/.env
uv run fastapi dev main.py --port 8001
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Next.js dev server on :3000
npm run build        # production build
npm run lint         # ESLint
```

## Key Design Decisions

- **JSON file storage**: The backend persists tasks to `backend/tasks.json`. Subtasks (including LLM responses) are stored server-side. Planned migration to PostgreSQL — the storage layer is isolated in `load_tasks()`/`save_tasks()` functions for easy swap.
- **Subtasks are first-class**: The backend Task model includes a `subtasks` list with `id`, `title`, `completed`, and `llm_response` fields. The frontend syncs subtask changes to the backend on every mutation.
- **LLM responses are persisted**: When a subtask gets an AI solution, the response is saved to the backend alongside the subtask data. Dismissing clears it from both frontend state and backend.
- **Brutalist editorial design**: Custom CSS variables in `globals.css` define the theme (ink, paper, accent, done colors). Fonts: Bebas Neue (display), DM Mono (mono), Instrument Serif (serif) loaded via `next/font`. Tailwind v4 with `@theme inline` for custom color tokens.

## Python Dependencies

Both Python services use `uv` for package management with `pyproject.toml`. Python >=3.11 required.

- **backend**: `fastapi[standard]`
- **llm-call**: `fastapi[standard]`, `uvicorn`, `openai-agents`, `python-dotenv`

## Environment Variables

- `llm-call/.env`: Must contain `OPENAI_API_KEY` for the LLM service to start
