from fastapi import FastAPI, HTTPException

app = FastAPI(title="Todo Progress Monitoring")

# In-memory storage — static snapshot matching todo_manager seed data
todos = [
    {"id": 1, "title": "Learn FastAPI", "description": "Build REST APIs with FastAPI", "status": "completed"},
    {"id": 2, "title": "Learn Docker", "description": "Containerize Python applications", "status": "in_progress"},
    {"id": 3, "title": "Learn Kubernetes", "description": "Deploy containers to K8s", "status": "pending"},
]


@app.get("/")
def health_check():
    return {"service": "todo_progress_monitoring", "status": "ok"}


@app.get("/progress")
def get_progress():
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
def get_todo_progress(todo_id: int):
    for todo in todos:
        if todo["id"] == todo_id:
            return {"id": todo["id"], "title": todo["title"], "status": todo["status"]}
    raise HTTPException(status_code=404, detail="Todo not found")
