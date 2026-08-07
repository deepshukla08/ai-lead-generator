"""The customer's own business: what we sell, and the documents that prove it."""

import uuid
from datetime import datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Timestamped, UUIDPrimaryKey, WorkspaceScoped
from app.db.types import enum_column
from app.models.enums import CompanyProfileStatus, KnowledgeSourceKind, KnowledgeSourceStatus

# Must match EMBEDDING_DIM in the environment. all-MiniLM-L6-v2 produces 384.
# Changing the embedding model changes this column, and therefore needs a
# migration plus a full re-embed — it is not a runtime setting.
EMBEDDING_DIM = 384


class CompanyProfile(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    __tablename__ = "company_profiles"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    website: Mapped[str | None] = mapped_column(String(512))
    description: Mapped[str | None] = mapped_column(Text)
    icp_description: Mapped[str | None] = mapped_column(Text)

    status: Mapped[CompanyProfileStatus] = mapped_column(
        enum_column(CompanyProfileStatus, "company_profile_status"),
        nullable=False,
        server_default=CompanyProfileStatus.ONBOARDING.value,
    )

    # Written by the Company Knowledge Agent: products, services, features,
    # capabilities, benefits, pain_points, industries, company_sizes,
    # differentiators, competitors, use_cases, success_stories, value_props.
    # JSONB because we read it whole to build a prompt and never filter inside
    # it — and because its shape changes every time that agent is tuned.
    product_knowledge: Mapped[dict[str, Any]] = mapped_column(
        nullable=False, server_default=text("'{}'::jsonb")
    )
    knowledge_ready_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    sources: Mapped[list["KnowledgeSource"]] = relationship(
        back_populates="company_profile", cascade="all, delete-orphan"
    )


class KnowledgeSource(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    """One uploaded document or scraped URL."""

    __tablename__ = "knowledge_sources"
    __table_args__ = (
        CheckConstraint("size_bytes >= 0", name="size_bytes_non_negative"),
        Index("ix_knowledge_sources_company_status", "company_profile_id", "status"),
    )

    company_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("company_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )

    kind: Mapped[KnowledgeSourceKind] = mapped_column(
        enum_column(KnowledgeSourceKind, "knowledge_source_kind"), nullable=False
    )
    original_filename: Mapped[str | None] = mapped_column(String(512))
    source_url: Mapped[str | None] = mapped_column(String(2048))
    # Opaque to the API: a local path today, an S3 key tomorrow.
    storage_key: Mapped[str | None] = mapped_column(String(1024))
    mime_type: Mapped[str | None] = mapped_column(String(255))
    size_bytes: Mapped[int | None] = mapped_column(BigInteger)

    status: Mapped[KnowledgeSourceStatus] = mapped_column(
        enum_column(KnowledgeSourceStatus, "knowledge_source_status"),
        nullable=False,
        server_default=KnowledgeSourceStatus.PENDING.value,
    )
    error: Mapped[str | None] = mapped_column(Text)
    parsed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    company_profile: Mapped[CompanyProfile] = relationship(back_populates="sources")
    chunks: Mapped[list["KnowledgeChunk"]] = relationship(
        back_populates="source", cascade="all, delete-orphan"
    )


class KnowledgeChunk(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    """A retrievable slice of a source, with its embedding."""

    __tablename__ = "knowledge_chunks"
    __table_args__ = (
        Index(
            "ix_knowledge_chunks_embedding",
            "embedding",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        Index("ix_knowledge_chunks_source_index", "knowledge_source_id", "chunk_index"),
    )

    knowledge_source_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_sources.id", ondelete="CASCADE"),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    token_count: Mapped[int | None] = mapped_column(Integer)
    embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM))

    # Page number, section heading, sheet name — whatever the parser can give us
    # so a generated claim can cite where it came from.
    meta: Mapped[dict[str, Any]] = mapped_column(nullable=False, server_default=text("'{}'::jsonb"))

    source: Mapped[KnowledgeSource] = relationship(back_populates="chunks")
