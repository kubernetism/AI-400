from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Multistage Container API",
    description="An API for the multistage container example",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define a simple endpoint that returns a greeting message

@app.get("/")
def read_root():
    return {"message": "The Container Application is running!"}

# creating todo application with in memory storage
todos = [
    {"id": 1, "task": "Buy groceries"},
    {"id": 2, "task": "Walk the dog"},
    {"id": 3, "task": "Read a book"},
    {"id": 4, "task": "Write code"},
    {"id": 5, "task": "Go to the gym"},
    {"id": 6, "task": "Cook dinner"},
] 

#get all todos
@app.get("/todos")
def get_todos():
    return {"todos": todos}

#get a todo by id
@app.get("/todos/{todo_id}")
def get_todo(todo_id: int):
    for todo in todos:
        if todo["id"] == todo_id:
            return {"todo": todo}
    return {"error": "Todo not found"}, 404
#create a new todo
@app.post("/todos")
def create_todo(task: str):
    new_id = max(todo["id"] for todo in todos) + 1
    new_todo = {"id": new_id, "task": task}
    todos.append(new_todo)
    return {"todo": new_todo}
#update a todo
@app.put("/todos/{todo_id}")
def update_todo(todo_id: int, task: str):
    for todo in todos:
        if todo["id"] == todo_id:
            todo["task"] = task
            return {"todo": todo}
    return {"error": "Todo not found"}, 404
#delete a todo
@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):
    for todo in todos:
        if todo["id"] == todo_id:
            todos.remove(todo)
            return {"message": "Todo deleted"}
    return {"error": "Todo not found"}, 404

