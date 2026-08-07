from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shared import configure_logging, get_logger

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.queue import close_queue
from app.db.session import engine

settings = get_settings()
configure_logging(
    service_name=settings.service_name,
    level=settings.log_level,
    json_logs=not settings.is_local,
)
log = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    log.info("api.startup", environment=settings.environment)
    yield
    await close_queue()
    await engine.dispose()
    log.info("api.shutdown")


app = FastAPI(
    title="AgentSDR API",
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
