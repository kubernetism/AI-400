from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from sqlmodel import SQLModel, Session, create_engine, select, Field
from dotenv import load_dotenv
from typing import Optional, List
from datetime import datetime
from contextlib import asynccontextmanager
import os
import logging
import time

load_dotenv()

# Configure logging for terminal output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/todo_db")
logger.info(f"Connecting to database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'local'}")
engine = create_engine(DATABASE_URL, echo=True)


# Todo Model
class Todo(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    creation_time: datetime
    completion_time: Optional[datetime] = None
    completion_status: bool = False
    ending_note: Optional[str] = None


# Create tables
def create_db_and_tables():
    logger.info("Creating database tables...")
    SQLModel.metadata.create_all(engine, checkfirst=True)
    logger.info("Database tables created/verified successfully")


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


# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("=" * 60)
    logger.info("🚀 Starting Todo API Server...")
    logger.info("=" * 60)
    create_db_and_tables()
    logger.info("✅ Server started successfully on http://0.0.0.0:8000")
    logger.info("📚 API Documentation available at http://0.0.0.0:8000/docs")
    yield
    # Shutdown
    logger.info("=" * 60)
    logger.info("🛑 Shutting down Todo API Server...")
    logger.info("=" * 60)


# FastAPI app
app = FastAPI(
    title="Todo API",
    description="A Todo API with CRUD operations",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware to log HTTP requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"📥 {request.method} {request.url.path} - Client: {request.client.host if request.client else 'unknown'}")
    
    # Log request body for POST/PUT requests
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            body = await request.body()
            if body:
                logger.info(f"📝 Request Body: {body.decode()[:200]}")  # Log first 200 chars
        except Exception as e:
            logger.warning(f"⚠️  Could not read request body: {e}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"📤 {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.3f}s")
    
    return response


# @app.get("/")
# async def read_root():
#     return {
#         "message": "Welcome to the Todo API!",
#         "api_key": os.getenv("API_KEY"),
#         "database_url": os.getenv("DATABASE_URL"),
#         "debug_mode": os.getenv("DEBUG")
#     }


# CREATE - Add a new todo
@app.post("/todos/", response_model=TodoResponse, status_code=201)
async def create_todo(todo: TodoCreate, session: Session = Depends(get_session)):
    logger.info(f"➕ Creating new todo: '{todo.title}'")
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
    logger.info(f"✅ Todo created successfully with ID: {db_todo.id}")
    return db_todo


# READ - Get all todos
@app.get("/todos/", response_model=List[TodoResponse])
async def get_todos(session: Session = Depends(get_session)):
    logger.info("📋 Fetching all todos")
    todos = session.exec(select(Todo)).all()
    logger.info(f"✅ Retrieved {len(todos)} todo(s)")
    return todos


# READ - Get a single todo by ID
@app.get("/todos/{todo_id}", response_model=TodoResponse)
async def get_todo(todo_id: int, session: Session = Depends(get_session)):
    logger.info(f"🔍 Fetching todo with ID: {todo_id}")
    todo = session.get(Todo, todo_id)
    if not todo:
        logger.warning(f"❌ Todo with ID {todo_id} not found")
        raise HTTPException(status_code=404, detail="Todo not found")
    logger.info(f"✅ Todo {todo_id} retrieved: '{todo.title}'")
    return todo


# UPDATE - Update a todo
@app.put("/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: int, todo_update: TodoUpdate, session: Session = Depends(get_session)):
    logger.info(f"✏️  Updating todo with ID: {todo_id}")
    db_todo = session.get(Todo, todo_id)
    if not db_todo:
        logger.warning(f"❌ Todo with ID {todo_id} not found for update")
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Log what's being updated
    updates = []
    if todo_update.title is not None:
        updates.append(f"title: '{db_todo.title}' -> '{todo_update.title}'")
        db_todo.title = todo_update.title
    if todo_update.description is not None:
        updates.append(f"description updated")
        db_todo.description = todo_update.description
    if todo_update.ending_note is not None:
        updates.append(f"ending_note updated")
        db_todo.ending_note = todo_update.ending_note
    
    # Handle completion status
    if todo_update.completion_status is not None:
        status_change = f"completion_status: {db_todo.completion_status} -> {todo_update.completion_status}"
        updates.append(status_change)
        db_todo.completion_status = todo_update.completion_status
        # Set completion_time when marking as completed
        if todo_update.completion_status and db_todo.completion_time is None:
            db_todo.completion_time = datetime.now()
            logger.info(f"⏰ Completion time set for todo {todo_id}")
        # Clear completion_time when marking as incomplete
        elif not todo_update.completion_status:
            db_todo.completion_time = None
            logger.info(f"⏰ Completion time cleared for todo {todo_id}")
    
    if updates:
        logger.info(f"📝 Updates for todo {todo_id}: {', '.join(updates)}")
    
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    logger.info(f"✅ Todo {todo_id} updated successfully")
    return db_todo


# DELETE - Delete a todo
@app.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: int, session: Session = Depends(get_session)):
    logger.info(f"🗑️  Deleting todo with ID: {todo_id}")
    todo = session.get(Todo, todo_id)
    if not todo:
        logger.warning(f"❌ Todo with ID {todo_id} not found for deletion")
        raise HTTPException(status_code=404, detail="Todo not found")
    logger.info(f"🗑️  Deleting todo: '{todo.title}' (ID: {todo_id})")
    session.delete(todo)
    session.commit()
    logger.info(f"✅ Todo {todo_id} deleted successfully")
    return None


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
