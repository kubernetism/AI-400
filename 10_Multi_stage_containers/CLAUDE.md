# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack Todo application demonstrating multi-stage Docker container builds. The project has two services:

- **backend/**: FastAPI (Python) REST API with in-memory Todo storage
- **frontend/**: Next.js 16 (React 19, TypeScript, Tailwind CSS) app

No Dockerfiles exist yet — creating multi-stage Dockerfiles for both services is the primary purpose of this project.

## Backend (FastAPI)

Uses `uv` as the package manager (not pip).

```bash
# Install dependencies
cd backend && uv sync

# Run development server
cd backend && uv run fastapi dev main.py
# Runs on http://localhost:8000
# Interactive API docs at http://localhost:8000/docs
```

API endpoints: `GET /`, `GET /todos`, `GET /todos/{id}`, `POST /todos`, `PUT /todos/{id}`, `DELETE /todos/{id}`

## Frontend (Next.js)

```bash
# Install dependencies
cd frontend && npm install

# Run development server
cd frontend && npm run dev
# Runs on http://localhost:3000

# Build for production
cd frontend && npm run build

# Lint
cd frontend && npm run lint
```

## Multi-Stage Docker Context

When writing Dockerfiles for this project:

- **Backend**: Use Python 3.11-slim base. Build stage installs uv and dependencies; runtime stage copies only the virtualenv and app code. The app entrypoint is `uvicorn main:app`.
- **Frontend**: Use Node.js alpine base. Build stage runs `npm ci && npm run build`; runtime stage uses a minimal Node image and copies only `.next/standalone` and static assets (Next.js standalone output mode must be enabled in `next.config.ts`).
- Both containers should run as non-root users.
