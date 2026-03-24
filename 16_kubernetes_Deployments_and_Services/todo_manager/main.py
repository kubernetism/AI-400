import os

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Todo Manager")

TODO_PROGRESS_URL = os.getenv("TODO_PROGRESS_URL", "http://todo-progress-monitoring:8002")

# In-memory storage
todos = [
    {"id": 1, "title": "Learn FastAPI", "description": "Build REST APIs with FastAPI", "status": "completed"},
    {"id": 2, "title": "Learn Docker", "description": "Containerize Python applications", "status": "in_progress"},
    {"id": 3, "title": "Learn Kubernetes", "description": "Deploy containers to K8s", "status": "pending"},
]

counter = len(todos)


class TodoCreate(BaseModel):
    title: str
    description: str
    status: str = "pending"


@app.get("/")
def health_check():
    return {"service": "todo_manager", "status": "ok"}


@app.get("/todos")
def get_todos():
    return todos


@app.post("/todos", status_code=201)
def create_todo(todo: TodoCreate):
    global counter
    counter += 1
    new_todo = {"id": counter, "title": todo.title, "description": todo.description, "status": todo.status}
    todos.append(new_todo)
    return new_todo


@app.get("/todos/progress")
async def get_todos_progress():
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{TODO_PROGRESS_URL}/progress", timeout=5.0)
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Failed to reach todo_progress_monitoring service")
