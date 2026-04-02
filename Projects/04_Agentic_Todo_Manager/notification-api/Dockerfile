FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml .

RUN pip install --no-cache-dir uv && \
    uv pip install --system --no-cache -r pyproject.toml

COPY main.py .

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
