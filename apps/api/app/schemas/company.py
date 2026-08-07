import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.models.enums import CompanyProfileStatus, KnowledgeSourceKind, KnowledgeSourceStatus


class CompanyProfileCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    website: HttpUrl | None = None
    description: str | None = Field(default=None, max_length=10_000)
    icp_description: str | None = Field(default=None, max_length=10_000)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("name cannot be blank")
        return stripped


class CompanyProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    website: HttpUrl | None = None
    description: str | None = Field(default=None, max_length=10_000)
    icp_description: str | None = Field(default=None, max_length=10_000)


class KnowledgeSourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: KnowledgeSourceKind
    original_filename: str | None
    source_url: str | None
    mime_type: str | None
    size_bytes: int | None
    status: KnowledgeSourceStatus
    error: str | None
    parsed_at: datetime | None
    created_at: datetime


class CompanyProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    website: str | None
    description: str | None
    icp_description: str | None
    status: CompanyProfileStatus
    product_knowledge: dict[str, Any]
    knowledge_ready_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CompanyProfileWithSources(CompanyProfileRead):
    sources: list[KnowledgeSourceRead] = Field(default_factory=list)
