"""FastAPI Hello World Application."""
from fastapi import FastAPI
from pydantic import BaseModel

### FastAPI Instance
app = FastAPI(
    title="Hello FastAPI",
    description="A simple hello world FastAPI application",
    version="0.1.0",
)

# Data Classes
class TodoItem(BaseModel):
    id:int
    task:str = "Default Value of Task"

class TodoItemResponse(BaseModel):
    id:int
    task:str
    is_completed: bool = False



todo_items = [
{
"id":1,"task":"this is first task",
},
{
"id":2,"task":"this is second task",
},
{
"id":3,"task":"this is third task",
}
]


#End Points
@app.get("/")
def root() -> dict[str, str]:
    """Root endpoint returning a hello world message."""
    return {"message": "Hello, World!"}

@app.get("/todos")
def get_todos():
    return todo_items



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app,host="0.0.0.0",port=9999)