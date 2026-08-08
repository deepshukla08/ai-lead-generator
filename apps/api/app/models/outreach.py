"""Generated outreach, and the conversation it starts.

The draft/message split is the human-in-the-loop guarantee: a draft is a
proposal, a message is a fact. Nothing writes EmailMessage except the send path
and the inbox reader.

Outbound and inbound share one table because a conversation is one thing. The
Reply Understanding Agent has to read "we sent X, they answered Y, we sent Z"
in order, and two tables joined by timestamp would make that a sort rather than
a read.
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
from app.models.enums import (
    DraftStatus,
    EmailProvider,
    MessageDirection,
    ReplyClassification,
    ThreadStatus,
)


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
    # Read by the Learning Agent: a human rewriting a draft is the strongest
    # signal we get about what the Outreach Agent gets wrong.
    edited_by_human: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )

    # The Critic's verdict, stored rather than logged: quality, factuality and
    # compliance findings have to be auditable after the fact.
    critic_verdict: Mapped[dict[str, Any]] = mapped_column(
        nullable=False, server_default=text("'{}'::jsonb")
    )

    lead: Mapped[Lead] = relationship(back_populates="drafts")
    messages: Mapped[list["EmailMessage"]] = relationship(back_populates="draft")


class EmailThread(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    """One conversation with one contact.

    `status` is what the hand-off runs on: high_intent tells a human to take
    over, closed_won/closed_lost is what the Learning Agent scores against.
    """

    __tablename__ = "email_threads"
    __table_args__ = (
        Index("ix_email_threads_workspace_status", "workspace_id", "status"),
        Index("ix_email_threads_last_activity", "workspace_id", "last_activity_at"),
        # Inbound mail is matched to a thread by the provider's thread id, so it
        # has to be a fast, unique lookup.
        Index(
            "ix_email_threads_provider_thread",
            "provider",
            "provider_thread_id",
            unique=True,
            postgresql_where=text("provider_thread_id IS NOT NULL"),
        ),
    )

    lead_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False
    )
    contact_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL")
    )

    provider: Mapped[EmailProvider] = mapped_column(
        enum_column(EmailProvider, "email_provider"), nullable=False
    )
    provider_thread_id: Mapped[str | None] = mapped_column(String(512))
    subject: Mapped[str | None] = mapped_column(String(512))

    status: Mapped[ThreadStatus] = mapped_column(
        enum_column(ThreadStatus, "thread_status"),
        nullable=False,
        server_default=ThreadStatus.AWAITING_REPLY.value,
    )
    last_activity_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Set when High Intent Detection fires, then when a human is told, then when
    # they take over. Three timestamps rather than one status because the gap
    # between them is the metric that matters.
    high_intent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    human_notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    handed_off_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    lead: Mapped[Lead] = relationship()
    messages: Mapped[list["EmailMessage"]] = relationship(
        back_populates="thread", cascade="all, delete-orphan"
    )


class EmailMessage(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    """A message that actually crossed the wire, in either direction."""

    __tablename__ = "email_messages"
    __table_args__ = (
        # Reading a conversation in order is the single most common query here.
        Index("ix_email_messages_thread_created", "thread_id", "created_at"),
        Index("ix_email_messages_workspace_direction", "workspace_id", "direction"),
        # Webhooks (opens, bounces, replies) arrive keyed by the provider's id.
        Index(
            "ix_email_messages_provider_message",
            "provider",
            "provider_message_id",
            unique=True,
            postgresql_where=text("provider_message_id IS NOT NULL"),
        ),
    )

    thread_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("email_threads.id", ondelete="CASCADE"), nullable=False
    )
    # Outbound only. SET NULL so send history survives a draft being deleted —
    # proof that we emailed someone must not be erasable.
    email_draft_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("email_drafts.id", ondelete="SET NULL")
    )

    direction: Mapped[MessageDirection] = mapped_column(
        enum_column(MessageDirection, "message_direction"), nullable=False
    )
    provider: Mapped[EmailProvider] = mapped_column(
        enum_column(EmailProvider, "email_provider"), nullable=False
    )
    provider_message_id: Mapped[str | None] = mapped_column(String(512))
    # The provider's id of the message this answers. Threading survives even
    # when a reply arrives before we have processed our own send.
    in_reply_to: Mapped[str | None] = mapped_column(String(512))

    from_email: Mapped[str | None] = mapped_column(String(320))
    to_email: Mapped[str | None] = mapped_column(String(320))
    subject: Mapped[str | None] = mapped_column(String(512))
    # Copied, not referenced: the draft may be edited later, but this is what
    # the recipient actually received.
    body: Mapped[str | None] = mapped_column(Text)

    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    bounced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error: Mapped[str | None] = mapped_column(Text)

    # --- Inbound only: the Reply Understanding Agent's output ---
    classification: Mapped[ReplyClassification | None] = mapped_column(
        enum_column(ReplyClassification, "reply_classification")
    )
    summary: Mapped[str | None] = mapped_column(Text)
    analysis: Mapped[dict[str, Any]] = mapped_column(
        nullable=False, server_default=text("'{}'::jsonb")
    )

    thread: Mapped[EmailThread] = relationship(back_populates="messages")
    draft: Mapped[EmailDraft | None] = relationship(back_populates="messages")
