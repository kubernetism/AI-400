from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlmodel import SQLModel, Session, create_engine, select
from dotenv import load_dotenv
from typing import Optional, List
from datetime import datetime
import os

load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/todo_db")
engine = create_engine(DATABASE_URL, echo=True)


# Todo Model
class Todo(SQLModel, table=True):
    id: Optional[int] = None
    title: str
    description: str
    creation_time: datetime
    completion_time: Optional[datetime] = None
    completion_status: bool = False
    ending_note: Optional[str] = None


# Create tables
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# Dependency to get database session
def get_session():
    with Session(engine) as session:
        yield session


# Request/Response models
class TodoCreate(SQLModel):
    title: str
    description: str
    ending_note: Optional[str] = None


class TodoUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completion_status: Optional[bool] = None
    ending_note: Optional[str] = None


class TodoResponse(SQLModel):
    id: int
    title: str
    description: str
    creation_time: datetime
    completion_time: Optional[datetime]
    completion_status: bool
    ending_note: Optional[str]


# FastAPI app
app = FastAPI(
    title="Todo API",
    description="A Todo API with CRUD operations",
    version="1.0.0"
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
async def read_root():
    return {
        "message": "Welcome to the Todo API!",
        "api_key": os.getenv("API_KEY"),
        "database_url": os.getenv("DATABASE_URL"),
        "debug_mode": os.getenv("DEBUG")
    }


# CREATE - Add a new todo
@app.post("/todos/", response_model=TodoResponse, status_code=201)
async def create_todo(todo: TodoCreate, session: Session = Depends(get_session)):
    db_todo = Todo(
        title=todo.title,
        description=todo.description,
        creation_time=datetime.now(),
        completion_status=False,
        ending_note=todo.ending_note
    )
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo


# READ - Get all todos
@app.get("/todos/", response_model=List[TodoResponse])
async def get_todos(session: Session = Depends(get_session)):
    todos = session.exec(select(Todo)).all()
    return todos


# READ - Get a single todo by ID
@app.get("/todos/{todo_id}", response_model=TodoResponse)
async def get_todo(todo_id: int, session: Session = Depends(get_session)):
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


# UPDATE - Update a todo
@app.put("/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: int, todo_update: TodoUpdate, session: Session = Depends(get_session)):
    db_todo = session.get(Todo, todo_id)
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Update fields if provided
    if todo_update.title is not None:
        db_todo.title = todo_update.title
    if todo_update.description is not None:
        db_todo.description = todo_update.description
    if todo_update.ending_note is not None:
        db_todo.ending_note = todo_update.ending_note
    
    # Handle completion status
    if todo_update.completion_status is not None:
        db_todo.completion_status = todo_update.completion_status
        # Set completion_time when marking as completed
        if todo_update.completion_status and db_todo.completion_time is None:
            db_todo.completion_time = datetime.now()
        # Clear completion_time when marking as incomplete
        elif not todo_update.completion_status:
            db_todo.completion_time = None
    
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return db_todo


# DELETE - Delete a todo
@app.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: int, session: Session = Depends(get_session)):
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    session.delete(todo)
    session.commit()
    return None


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
