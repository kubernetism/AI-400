import json
import uuid
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Task Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── File-based storage ──

DB_PATH = Path(__file__).parent / "tasks.json"


def load_tasks() -> dict[str, dict]:
    if DB_PATH.exists():
        return json.loads(DB_PATH.read_text())
    return {}


def save_tasks(tasks: dict[str, dict]) -> None:
    DB_PATH.write_text(json.dumps(tasks, indent=2))


# ── Models ──


class SubtaskCreate(BaseModel):
    id: Optional[str] = None
    title: str
    completed: bool = False
    llm_response: Optional[str] = None
    llm_loading: Optional[bool] = None


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    completed: bool = False
    subtasks: list[SubtaskCreate] = []


class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    llm_response: Optional[str] = None
    llm_loading: Optional[bool] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    subtasks: Optional[list[SubtaskCreate]] = None


# ── Routes ──


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/tasks")
def list_tasks():
    tasks = load_tasks()
    return list(tasks.values())


@app.get("/tasks/{task_id}")
def get_task(task_id: str):
    tasks = load_tasks()
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]


@app.post("/tasks", status_code=201)
def create_task(task: TaskCreate):
    tasks = load_tasks()
    task_id = str(uuid.uuid4())
    subtasks = []
    for st in task.subtasks:
        subtasks.append({
            "id": st.id or str(uuid.uuid4()),
            "title": st.title,
            "completed": st.completed,
            "llm_response": st.llm_response,
        })
    task_data = {
        "id": task_id,
        "title": task.title,
        "description": task.description or "",
        "completed": task.completed,
        "subtasks": subtasks,
    }
    tasks[task_id] = task_data
    save_tasks(tasks)
    return task_data


@app.patch("/tasks/{task_id}")
def update_task(task_id: str, task: TaskUpdate):
    tasks = load_tasks()
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task.model_dump(exclude_unset=True)

    # Handle subtasks separately — replace the whole list if provided
    if "subtasks" in update_data and update_data["subtasks"] is not None:
        subtasks = []
        for st in update_data["subtasks"]:
            subtasks.append({
                "id": st.get("id") or str(uuid.uuid4()),
                "title": st["title"],
                "completed": st.get("completed", False),
                "llm_response": st.get("llm_response"),
            })
        tasks[task_id]["subtasks"] = subtasks
        del update_data["subtasks"]

    tasks[task_id].update(update_data)
    save_tasks(tasks)
    return tasks[task_id]


@app.patch("/tasks/{task_id}/subtasks/{subtask_id}")
def update_subtask(task_id: str, subtask_id: str, update: SubtaskUpdate):
    tasks = load_tasks()
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    for st in tasks[task_id]["subtasks"]:
        if st["id"] == subtask_id:
            update_data = update.model_dump(exclude_unset=True)
            st.update(update_data)
            save_tasks(tasks)
            return tasks[task_id]
    raise HTTPException(status_code=404, detail="Subtask not found")


@app.delete("/tasks/{task_id}")
def delete_task(task_id: str):
    tasks = load_tasks()
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    deleted = tasks.pop(task_id)
    save_tasks(tasks)
    return {"message": "Task deleted", "task": deleted}
