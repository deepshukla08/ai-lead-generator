"""Generated outreach, and what was actually sent.

The split between the two tables is the human-in-the-loop guarantee: a draft is
a proposal, a sent_email is a fact. Nothing writes the second table except the
send path, and it runs only after a human approves.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
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
from app.models.campaign import Lead
from app.models.enums import DraftStatus, EmailProvider


class EmailDraft(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    __tablename__ = "email_drafts"
    __table_args__ = (
        # Drives the approval queue.
        Index("ix_email_drafts_workspace_status", "workspace_id", "status"),
        Index("ix_email_drafts_lead_revision", "lead_id", "revision"),
    )

    lead_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False
    )
    contact_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL")
    )

    subject: Mapped[str | None] = mapped_column(String(512))
    body: Mapped[str | None] = mapped_column(Text)
    linkedin_message: Mapped[str | None] = mapped_column(Text)
    follow_up: Mapped[str | None] = mapped_column(Text)
    cta: Mapped[str | None] = mapped_column(Text)

    status: Mapped[DraftStatus] = mapped_column(
        enum_column(DraftStatus, "draft_status"),
        nullable=False,
        server_default=DraftStatus.PENDING.value,
    )
    # "Regenerate this email" appends a revision rather than destroying the
    # previous one, so a reviewer can compare and roll back.
    revision: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    edited_by_human: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    # The Critic's verdict, stored rather than logged: quality, factuality and
    # compliance findings have to be auditable after the fact.
    critic_verdict: Mapped[dict[str, Any]] = mapped_column(
        nullable=False, server_default=text("'{}'::jsonb")
    )

    lead: Mapped[Lead] = relationship(back_populates="drafts")
    sent: Mapped["SentEmail | None"] = relationship(back_populates="draft", uselist=False)


class SentEmail(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    """An immutable record of a message that left the building."""

    __tablename__ = "sent_emails"
    __table_args__ = (
        # Inbound webhooks (opens, bounces, replies) arrive keyed by the
        # provider's id, so it has to be a fast, unique lookup.
        Index(
            "ix_sent_emails_provider_message",
            "provider",
            "provider_message_id",
            unique=True,
            postgresql_where=text("provider_message_id IS NOT NULL"),
        ),
    )

    email_draft_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        # RESTRICT: send history outlives everything. Deleting a draft must
        # never erase proof that we emailed someone.
        ForeignKey("email_drafts.id", ondelete="RESTRICT"),
        nullable=False,
    )

    provider: Mapped[EmailProvider] = mapped_column(
        enum_column(EmailProvider, "email_provider"), nullable=False
    )
    provider_message_id: Mapped[str | None] = mapped_column(String(512))

    to_email: Mapped[str] = mapped_column(String(320), nullable=False)
    subject: Mapped[str | None] = mapped_column(String(512))
    # Copied, not referenced: the draft may be edited later, but this is what
    # the recipient actually received.
    body: Mapped[str | None] = mapped_column(Text)

    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    replied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    bounced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error: Mapped[str | None] = mapped_column(Text)

    draft: Mapped[EmailDraft] = relationship(back_populates="sent")
