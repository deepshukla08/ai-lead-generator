from fastapi import FastAPI
from shared import configure_logging, get_logger

from ai_service.config import get_settings

settings = get_settings()
configure_logging(
    service_name=settings.service_name,
    level=settings.log_level,
    json_logs=not settings.is_local,
)
log = get_logger(__name__)

app = FastAPI(title="AgentSDR AI Service", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "llm_provider": settings.llm_provider,
        "embedding_model": settings.embedding_model,
        "langfuse": settings.langfuse_enabled,
    }


# Graph invocation endpoints (/graphs/{name}/invoke, /graphs/{name}/stream)
# are added once the first LangGraph agent exists.
