# main.py
from fastapi import FastAPI
from pydantic import BaseModel
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class NotificationRequest(BaseModel):
    message: str
    task_id: str | None = None

@app.post("/notify")
async def notify(request: NotificationRequest):
    """Receive notification from other services."""
    logger.info(f"Notification received: {request.message}")
    # In production: send email, push notification, Slack message
    return {
        "status": "delivered",
        "message": request.message
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}