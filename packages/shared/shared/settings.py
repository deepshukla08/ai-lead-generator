"""Settings every Python service needs.

Each service subclasses this and adds only what it actually uses, so a missing
LLM key can never break the API container and a missing SMTP host can never
break the worker.
"""

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseServiceSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # one shared .env feeds several services
    )

    environment: Literal["local", "staging", "production"] = "local"
    log_level: str = "INFO"
    service_name: str = "service"

    database_url: str = "postgresql+asyncpg://agentsdr:agentsdr@localhost:5432/agentsdr"
    redis_url: str = "redis://localhost:6379/0"

    langfuse_host: str = "http://localhost:3001"
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""

    @property
    def is_local(self) -> bool:
        return self.environment == "local"

    @property
    def langfuse_enabled(self) -> bool:
        return bool(self.langfuse_public_key and self.langfuse_secret_key)
