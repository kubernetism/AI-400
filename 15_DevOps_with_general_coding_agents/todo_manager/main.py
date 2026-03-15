from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Todo Manager")

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
