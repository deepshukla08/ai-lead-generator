"""Chat is the product's front door; everything else is reachable from it."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Timestamped, UUIDPrimaryKey, WorkspaceScoped
from app.db.types import enum_column
from app.models.enums import ChatRole


class Conversation(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    __tablename__ = "conversations"
    __table_args__ = (Index("ix_conversations_workspace_last", "workspace_id", "last_message_at"),)

    title: Mapped[str | None] = mapped_column(String(255))
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan"
    )


class ChatMessage(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    __tablename__ = "chat_messages"
    __table_args__ = (
        Index("ix_chat_messages_conversation_created", "conversation_id", "created_at"),
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )

    role: Mapped[ChatRole] = mapped_column(enum_column(ChatRole, "chat_role"), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)

    # Which agents the supervisor ran and what they returned, so the UI can
    # re-render a lead table or an approval card instead of a wall of prose.
    agent_outputs: Mapped[dict[str, Any]] = mapped_column(
        nullable=False, server_default=text("'{}'::jsonb")
    )

    conversation: Mapped[Conversation] = relationship(back_populates="messages")
