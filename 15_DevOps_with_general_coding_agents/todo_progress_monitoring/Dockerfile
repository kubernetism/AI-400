FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN pip install uv && uv sync

COPY main.py .

EXPOSE 8002

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
