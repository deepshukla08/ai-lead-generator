# Build context is the repo root, so the shared package is copyable.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /srv

COPY packages/shared /srv/packages/shared
RUN pip install -e /srv/packages/shared

# Install dependencies from the manifest alone so editing source code does not
# re-run pip. The empty package stub is what makes the editable build succeed
# before the real source is copied in.
COPY apps/api/pyproject.toml /srv/apps/api/
RUN mkdir -p /srv/apps/api/app \
    && touch /srv/apps/api/app/__init__.py \
    && pip install -e "/srv/apps/api[dev]"

COPY apps/api /srv/apps/api
WORKDIR /srv/apps/api

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
