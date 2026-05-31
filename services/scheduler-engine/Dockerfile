# syntax=docker/dockerfile:1

FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app

FROM base AS builder
RUN pip install --upgrade pip
COPY requirements.txt pyproject.toml README.md ./
RUN pip install -r requirements.txt
COPY src ./src
RUN pip install --no-deps .

FROM base AS runner
ENV ENVIRONMENT=production \
    PORT=8000
COPY --from=builder /usr/local /usr/local
COPY requirements.txt pyproject.toml README.md ./
COPY src ./src
EXPOSE 8000
CMD ["uvicorn", "scheduler_engine.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM base AS dev
RUN pip install --upgrade pip
COPY requirements-dev.txt requirements.txt pyproject.toml README.md ./
RUN pip install -r requirements-dev.txt
COPY src ./src
RUN pip install --no-deps -e .
EXPOSE 8000
CMD ["uvicorn", "scheduler_engine.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
