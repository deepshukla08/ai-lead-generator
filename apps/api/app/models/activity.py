"""What the system did, at two altitudes.

`agent_execution` is operational: it lets us resume a graph, retry a failed
node, and show "Researching..." in the UI. Deep detail — every prompt, token
and tool call — lives in Langfuse; `langfuse_trace_id` is the join.

`timeline_event` is the customer-facing story of a lead. Different audience,
different retention, different table.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Timestamped, UUIDPrimaryKey, WorkspaceScoped
from app.db.types import enum_column
from app.models.enums import ExecutionStatus, TimelineEventKind


class AgentExecution(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    __tablename__ = "agent_executions"
    __table_args__ = (
        Index("ix_agent_executions_workspace_status", "workspace_id", "status"),
        Index("ix_agent_executions_agent_created", "agent_name", "created_at"),
    )

    # All nullable and SET NULL: an execution record must survive the thing it
    # ran against being deleted, or the audit trail lies.
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="SET NULL")
    )
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL")
    )
    lead_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL")
    )

    agent_name: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[ExecutionStatus] = mapped_column(
        enum_column(ExecutionStatus, "execution_status"),
        nullable=False,
        server_default=ExecutionStatus.RUNNING.value,
    )

    input: Mapped[dict[str, Any]] = mapped_column(
        nullable=False, server_default=text("'{}'::jsonb")
    )
    output: Mapped[dict[str, Any]] = mapped_column(
        nullable=False, server_default=text("'{}'::jsonb")
    )
    error: Mapped[str | None] = mapped_column(Text)
    retry_count: Mapped[int] = mapped_column(nullable=False, server_default=text("0"))

    langfuse_trace_id: Mapped[str | None] = mapped_column(String(128))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class TimelineEvent(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    __tablename__ = "timeline_events"
    __table_args__ = (
        Index("ix_timeline_events_lead_created", "lead_id", "created_at"),
        Index("ix_timeline_events_campaign_created", "campaign_id", "created_at"),
    )

    lead_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE")
    )
    prospect_company_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("prospect_companies.id", ondelete="CASCADE")
    )
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE")
    )

    kind: Mapped[TimelineEventKind] = mapped_column(
        enum_column(TimelineEventKind, "timeline_event_kind"), nullable=False
    )
    message: Mapped[str | None] = mapped_column(Text)
    payload: Mapped[dict[str, Any]] = mapped_column(
        nullable=False, server_default=text("'{}'::jsonb")
    )
