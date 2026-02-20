import time
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware import Middleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown."""
    print("Lifespan: Starting up the application...")
    yield  # Control is passed to the application
    print("Lifespan: Shutting down the application...")


app = FastAPI(lifespan=lifespan)
origins = ["http://127.0.0.1:3000"]  # Allow all origins for CORS
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])

@app.middleware("http")
async def middleware_one(request: Request, call_next) -> Response:
    """Add processing time to every response."""

    print("Middleware One: Before processing request")
    time.sleep(1)  
    response = await call_next(request)  # Pass to route
    print("Middleware One: After processing request")
    return response

@app.middleware("http")
async def middleware_two(request: Request, call_next) -> Response:
    """Simulate a delay in processing."""
    print("Middleware Two: Before processing request")
    time.sleep(1)  # Simulate delay
    response = await call_next(request)  # Pass to route
    print("Middleware Two: After processing request")
    return response

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": " 🎲 Hello World from FastAPI 🫆 with Middleware! 🎃"}