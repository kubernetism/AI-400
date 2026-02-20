FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml /app/

COPY uv.lock /app/

RUN uv sync --frozen

COPY main.py .

EXPOSE 8000

LABEL   NAME="SyedSafdarAliShah"\
    VERSION="1.0.P"\
    DESCRIPTION="A Simple FastAPI application developed by Sfdr"\
    AUTHOR="SAFDAR ALI"

CMD [ "uv","run","uvicorn","main:app","--host","0.0.0.0","--port","8000"]