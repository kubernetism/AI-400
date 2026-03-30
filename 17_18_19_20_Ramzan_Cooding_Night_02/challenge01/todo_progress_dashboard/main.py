import os
from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import httpx

app = FastAPI(title="Task Progress Dashboard", version="1.0.0")

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
        context={"api_url": "/api"}
    )


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PATCH", "PUT", "DELETE"])
async def proxy(request: Request, path: str):
    async with httpx.AsyncClient() as client:
        resp = await client.request(
            method=request.method,
            url=f"{API_URL}/{path}",
            headers={"content-type": "application/json"},
            content=await request.body(),
        )
    return Response(content=resp.content, status_code=resp.status_code,
                    headers={"content-type": resp.headers.get("content-type", "application/json")})
