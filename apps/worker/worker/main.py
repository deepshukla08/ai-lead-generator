"""ARQ worker entrypoint.

The worker never imports the AI service. It calls it over HTTP, so the two can
be scaled, deployed and crashed independently. Jobs are enqueued by the API.
"""

from arq.connections import RedisSettings
from shared import configure_logging, get_logger

from worker.config import get_settings

settings = get_settings()
configure_logging(
    service_name=settings.service_name,
    level=settings.log_level,
    json_logs=not settings.is_local,
)
log = get_logger(__name__)


async def ping(_ctx: dict, message: str = "pong") -> str:
    """Smoke-test job. Enqueue it to prove the API -> Redis -> worker path works."""
    log.info("worker.ping", message=message)
    return message


async def startup(_ctx: dict) -> None:
    log.info("worker.startup", ai_service_url=settings.ai_service_url)


async def shutdown(_ctx: dict) -> None:
    log.info("worker.shutdown")


class WorkerSettings:
    functions = [ping]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    max_jobs = 10
    job_timeout = 600  # research and enrichment jobs are slow by nature
