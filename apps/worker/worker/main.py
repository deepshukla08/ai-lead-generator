"""ARQ worker entrypoint.

The worker never imports the AI service and never touches the database. It
calls both over HTTP, so the three can be scaled, deployed and crashed
independently.
"""

from arq.connections import RedisSettings
from shared import configure_logging, get_logger

from worker.config import get_settings
from worker.fetching import UnsafeUrl
from worker.scraper import crawl, publish_pages

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


async def scrape_website(
    _ctx: dict, company_id: str, url: str, max_pages: int = 15
) -> dict[str, object]:
    """Crawl a company's own site and file each page as a knowledge source."""
    log.info("scrape.start", company_id=company_id, url=url, max_pages=max_pages)
    try:
        pages = await crawl(url, max_pages=max_pages)
    except UnsafeUrl as exc:
        log.warning("scrape.rejected", url=url, reason=str(exc))
        return {"pages_found": 0, "pages_published": 0, "error": str(exc)}

    published = await publish_pages(settings.api_url, company_id, pages)
    log.info("scrape.done", company_id=company_id, found=len(pages), published=published)
    return {"pages_found": len(pages), "pages_published": published}


async def startup(_ctx: dict) -> None:
    log.info("worker.startup", api_url=settings.api_url, ai_service_url=settings.ai_service_url)


async def shutdown(_ctx: dict) -> None:
    log.info("worker.shutdown")


class WorkerSettings:
    functions = [ping, scrape_website]  # noqa: RUF012 - arq reads this as config
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    max_jobs = 10
    job_timeout = 600  # research and enrichment jobs are slow by nature
