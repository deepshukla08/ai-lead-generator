from functools import lru_cache

from pydantic import Field
from shared import BaseServiceSettings


class ApiSettings(BaseServiceSettings):
    service_name: str = "api"

    ai_service_url: str = "http://localhost:8001"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    storage_backend: str = "local"
    storage_local_path: str = "/data/storage"


@lru_cache
def get_settings() -> ApiSettings:
    return ApiSettings()
