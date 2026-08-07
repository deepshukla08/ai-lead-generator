# Build context is the repo root.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /srv

COPY packages/shared /srv/packages/shared
RUN pip install -e /srv/packages/shared

COPY apps/worker/pyproject.toml /srv/apps/worker/
RUN mkdir -p /srv/apps/worker/worker \
    && touch /srv/apps/worker/worker/__init__.py \
    && pip install -e "/srv/apps/worker[dev]"

COPY apps/worker /srv/apps/worker
WORKDIR /srv/apps/worker

CMD ["arq", "worker.main.WorkerSettings", "--watch", "."]
