import uuid
from functools import lru_cache

from pydantic import Field
from shared import BaseServiceSettings

# The MVP has exactly one workspace. Every row still carries the column, so
# switching to real tenancy is a change to how this value is resolved, not a
# schema migration across a live database.
DEFAULT_WORKSPACE_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class ApiSettings(BaseServiceSettings):
    service_name: str = "api"

    ai_service_url: str = "http://localhost:8001"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    storage_backend: str = "local"
    storage_local_path: str = "/data/storage"

    # Trust boundary. A pitch deck is a few MB; anything near this is a mistake
    # or an attack, and either way we reject it before it touches the disk.
    max_upload_bytes: int = 25 * 1024 * 1024
    allowed_upload_mime_types: list[str] = Field(
        default_factory=lambda: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/msword",
            "application/vnd.ms-powerpoint",
            "text/plain",
            "text/markdown",
            "text/csv",
        ]
    )

    @property
    def workspace_id(self) -> uuid.UUID:
        return DEFAULT_WORKSPACE_ID


@lru_cache
def get_settings() -> ApiSettings:
    return ApiSettings()
