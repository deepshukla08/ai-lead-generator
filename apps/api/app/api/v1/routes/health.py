from typing import Annotated

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import ApiSettings, get_settings
from app.core.db import get_session

router = APIRouter(tags=["health"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]
SettingsDep = Annotated[ApiSettings, Depends(get_settings)]


@router.get("/health")
async def liveness() -> dict[str, str]:
    """Is the process up? Used by Docker/K8s liveness probes."""
    return {"status": "ok"}


@router.get("/health/ready")
async def readiness(
    response: Response,
    session: SessionDep,
    settings: SettingsDep,
) -> dict[str, object]:
    """Are our dependencies reachable? Degraded != dead, so report per-check."""
    checks: dict[str, str] = {}

    try:
        await session.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as exc:
        # Reported, never swallowed: the caller sees which dependency is down.
        checks["postgres"] = f"error: {exc.__class__.__name__}"

    redis_client = aioredis.from_url(settings.redis_url)
    try:
        await redis_client.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc.__class__.__name__}"
    finally:
        await redis_client.aclose()

    healthy = all(v == "ok" for v in checks.values())
    if not healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"status": "ok" if healthy else "degraded", "checks": checks}
