import os
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

app = FastAPI(title="Task Manager Frontend", version="1.0.0")

templates = Jinja2Templates(directory="templates")

API_URL = os.getenv("API_URL", "http://localhost:8000")


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"api_url": API_URL}
    )
