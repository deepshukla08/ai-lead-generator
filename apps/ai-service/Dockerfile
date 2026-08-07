# Build context is the repo root.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/models

WORKDIR /srv

COPY packages/shared /srv/packages/shared
RUN pip install -e /srv/packages/shared

COPY apps/ai-service/pyproject.toml /srv/apps/ai-service/
RUN mkdir -p /srv/apps/ai-service/ai_service \
    && touch /srv/apps/ai-service/ai_service/__init__.py \
    && pip install -e "/srv/apps/ai-service[dev]"

COPY apps/ai-service /srv/apps/ai-service
WORKDIR /srv/apps/ai-service

EXPOSE 8001
CMD ["uvicorn", "ai_service.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
