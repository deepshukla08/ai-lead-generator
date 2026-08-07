"""The companies we might sell to, and what we know about them.

Deliberately campaign-agnostic. A prospect is researched once and reused by
every campaign that touches it; only the *judgement* about it is per-campaign,
and that lives on Lead.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Timestamped, UUIDPrimaryKey, WorkspaceScoped
from app.db.types import enum_column
from app.models.enums import ContactRole, EmailStatus


class ProspectCompany(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    __tablename__ = "prospect_companies"
    __table_args__ = (
        # The dedup key. A CSV import and an agent discovery run converge on the
        # same row instead of researching the same business twice.
        UniqueConstraint("workspace_id", "domain", name="workspace_domain"),
        Index("ix_prospect_companies_industry", "workspace_id", "industry"),
    )

    domain: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255))
    website: Mapped[str | None] = mapped_column(String(512))
    description: Mapped[str | None] = mapped_column(Text)
    industry: Mapped[str | None] = mapped_column(String(128))
    employee_range: Mapped[str | None] = mapped_column(String(64))
    country: Mapped[str | None] = mapped_column(String(128))
    linkedin_url: Mapped[str | None] = mapped_column(String(512))

    # Raw payload from whichever enrichment provider answered. Kept verbatim so
    # we can re-derive fields later without paying for the lookup again.
    enrichment: Mapped[dict[str, Any]] = mapped_column(
        nullable=False, server_default=text("'{}'::jsonb")
    )
    last_researched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    research: Mapped[list["Research"]] = relationship(
        back_populates="prospect_company", cascade="all, delete-orphan"
    )
    contacts: Mapped[list["Contact"]] = relationship(
        back_populates="prospect_company", cascade="all, delete-orphan"
    )


class Research(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    """One research pass. Appended, never updated in place.

    Findings go stale, and a lead scored last month must stay explainable by the
    evidence that existed when it was scored.
    """

    __tablename__ = "research"
    __table_args__ = (
        Index("ix_research_company_created", "prospect_company_id", "created_at"),
    )

    prospect_company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("prospect_companies.id", ondelete="CASCADE"),
        nullable=False,
    )

    summary: Mapped[str | None] = mapped_column(Text)
    # Hiring, funding, tech stack, recent news.
    signals: Mapped[dict[str, Any]] = mapped_column(
        nullable=False, server_default=text("'{}'::jsonb")
    )
    # Every URL the agent actually read. The no-hallucination rule is only
    # enforceable if the evidence is stored next to the claim.
    sources: Mapped[list[Any]] = mapped_column(
        nullable=False, server_default=text("'[]'::jsonb")
    )

    model: Mapped[str | None] = mapped_column(String(128))
    langfuse_trace_id: Mapped[str | None] = mapped_column(String(128))

    prospect_company: Mapped[ProspectCompany] = relationship(back_populates="research")


class Contact(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    """A decision maker.

    `email` is nullable on purpose. "We could not find an address" is a valid,
    useful answer; an invented one is a bounced send and a burned domain.
    """

    __tablename__ = "contacts"
    __table_args__ = (
        CheckConstraint(
            "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)",
            name="confidence_between_zero_and_one",
        ),
        Index("ix_contacts_company_role", "prospect_company_id", "role_category"),
    )

    prospect_company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("prospect_companies.id", ondelete="CASCADE"),
        nullable=False,
    )

    full_name: Mapped[str | None] = mapped_column(String(255))
    title: Mapped[str | None] = mapped_column(String(255))
    role_category: Mapped[ContactRole | None] = mapped_column(
        enum_column(ContactRole, "contact_role")
    )

    email: Mapped[str | None] = mapped_column(String(320))
    email_status: Mapped[EmailStatus] = mapped_column(
        enum_column(EmailStatus, "email_status"),
        nullable=False,
        server_default=EmailStatus.UNKNOWN.value,
    )
    linkedin_url: Mapped[str | None] = mapped_column(String(512))

    source: Mapped[str | None] = mapped_column(String(128))
    confidence: Mapped[float | None] = mapped_column(Numeric(3, 2))

    prospect_company: Mapped[ProspectCompany] = relationship(back_populates="contacts")
