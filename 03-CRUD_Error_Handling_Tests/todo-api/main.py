from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from sqlmodel import SQLModel, Field , create_engine, Session, select
from dotenv import load_dotenv
import os
# Load environment variables from .env file
load_dotenv()

# Database setup
engine = create_engine(os.getenv("DATABASE_URL"),echo=True)

# FastAPI application setup
app = FastAPI(
    title="Todo API",
    description="A simple Todo API with CRUD operations and error handling",
    version="1.0.0"
)
#DB Structure and Model/Tables + same used at API
class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    description: str | None = Field(default=None)
    completed: bool = False

#how to create the database tables
# def create_db_and_tables():
#     print("Creating database and tables...")
#     SQLModel.metadata.create_all(engine)
#     print("Database and tables created.")
def get_session():
    with Session(engine) as session:
        yield session
# how to create the database tables
# create_db_and_tables
@app.post("/tasks")
def create_task(task: Task, session: Session = Depends(get_session)):
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@app.get("/tasks")
def read_tasks(session: Session = Depends(get_session)):
    task = session.exec(select(Task)).all()
    return task

@app.get("/tasks/{task_id}")
def read_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.update("/tasks/{task_id}")
def update_task(task_id: int, updated_task: Task, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.title = updated_task.title
    task.description = updated_task.description
    task.completed = updated_task.completed
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

# ## Pydantic model for Todo item
# class TodoItem(BaseModel):
#     id: int
#     title: str
#     description: str | None = None
#     completed: bool = False

# # In-memory storage for Todo items
# todo_items = []

# # CRUD Endpoints

# # Create Todo item
# @app.post("/todos/", response_model=TodoItem)
# def create_todo_item(item: TodoItem):
#     todo_items.append(item)
#     return item

# # Read Todo items
# @app.get("/todos/", response_model=List[TodoItem])
# def read_todo_items():
#     return todo_items

# # Read, single Todo item
# @app.get("/todos/{item_id}", response_model=TodoItem)
# def read_todo_item(item_id: int):
#     for item in todo_items:
#         if item.id == item_id:
#             return item
#     raise HTTPException(status_code=404, detail="Item not found")

# # Update Todo item
# @app.put("/todos/{item_id}", response_model=TodoItem)
# def update_todo_item(item_id: int, updated_item: TodoItem):
#     for index, item in enumerate(todo_items):
#         if item.id == item_id:
#             todo_items[index] = updated_item
#             return updated_item
#     raise HTTPException(status_code=404, detail="Item not found")


# # Delete Todo item
# @app.delete("/todos/{item_id}")
# def delete_todo_item(item_id: int):
#     for index, item in enumerate(todo_items):
#         if item.id == item_id:
#             del todo_items[index]
#             return {"detail": "Item deleted"}
#     raise HTTPException(status_code=404, detail="Item not found")