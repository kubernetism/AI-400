from fastapi import FastAPI

app = FastAPI(
    title="Containerized FastAPI Application",
    description="A simple FastAPI application to demonstrate containerization with Docker.",
    version="1.0.0"
)

@app.get("/")
async def read_root():
    """Root endpoint."""
    return {"message": "🎲 Hello Pakistan from FastAPI in a Docker container!💌"}

@app.get("/application")
async def read_application():
    """Application endpoint."""
    return {"message": "🎲 This is the application endpoint for the containerized FastAPI application💌."}