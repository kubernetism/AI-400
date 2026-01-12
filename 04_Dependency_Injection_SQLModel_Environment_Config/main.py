from fastapi import Depends, FastAPI
import uvicorn

app = FastAPI(
    title="Dependency Injection with FastAPI",
    description="A simple FastAPI application demonstrating dependency injection.",
    version="1.0.0",
)
def get_config():
    return {"setting_1": "value_1", "setting_2": "value_2"}
# @app.get("/")
# async def read_root():
#     config = get_config()
#     return {"message": "Welcome to the Dependency Injection FastAPI example!", "config": config}

@app.get("/")
async def read_root(config: dict = Depends(get_config)):
    return {"message": "Welcome to the Dependency Injection FastAPI example!", "config": config}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
