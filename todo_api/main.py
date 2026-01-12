from fastapi import FastAPI
from dotenv import load_dotenv
import os
load_dotenv()

app = FastAPI()

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Todo API!", "api_key": os.getenv("API_KEY"), "database_url": os.getenv("DATABASE_URL"), "debug_mode": os.getenv("DEBUG")}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)