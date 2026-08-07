from functools import lru_cache

from shared import BaseServiceSettings


class WorkerConfig(BaseServiceSettings):
    service_name: str = "worker"
    ai_service_url: str = "http://localhost:8001"


@lru_cache
def get_settings() -> WorkerConfig:
    return WorkerConfig()
