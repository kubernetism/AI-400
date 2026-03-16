import os

import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI(title="Todo Progress Monitoring")

TODO_MANAGER_URL = os.getenv("TODO_MANAGER_URL", "http://todo-manager:8001")


async def fetch_todos() -> list[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{TODO_MANAGER_URL}/todos", timeout=5.0)
        resp.raise_for_status()
        return resp.json()


@app.get("/")
def health_check():
    return {"service": "todo_progress_monitoring", "status": "ok"}


@app.get("/progress")
async def get_progress():
    try:
        todos = await fetch_todos()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Failed to reach todo_manager service")
    total = len(todos)
    completed = sum(1 for t in todos if t["status"] == "completed")
    in_progress = sum(1 for t in todos if t["status"] == "in_progress")
    pending = sum(1 for t in todos if t["status"] == "pending")
    completion_percentage = round((completed / total) * 100, 2) if total > 0 else 0.0
    return {
        "total": total,
        "completed": completed,
        "in_progress": in_progress,
        "pending": pending,
        "completion_percentage": completion_percentage,
    }


@app.get("/progress/{todo_id}")
async def get_todo_progress(todo_id: int):
    try:
        todos = await fetch_todos()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Failed to reach todo_manager service")
    for todo in todos:
        if todo["id"] == todo_id:
            return {"id": todo["id"], "title": todo["title"], "status": todo["status"]}
    raise HTTPException(status_code=404, detail="Todo not found")
