"""Campaigns, and the per-campaign judgement about a prospect."""

import uuid
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Timestamped, UUIDPrimaryKey, WorkspaceScoped
from app.db.types import enum_column
from app.models.enums import CampaignStatus, LeadStatus
from app.models.prospect import ProspectCompany


class Campaign(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    __tablename__ = "campaigns"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    goal: Mapped[str | None] = mapped_column(Text)
    status: Mapped[CampaignStatus] = mapped_column(
        enum_column(CampaignStatus, "campaign_status"),
        nullable=False,
        server_default=CampaignStatus.DRAFT.value,
    )
    # "fintech startups in Europe, 10-200 employees" as the agent parsed it.
    target_criteria: Mapped[dict[str, Any]] = mapped_column(
        nullable=False, server_default=text("'{}'::jsonb")
    )

    leads: Mapped[list["Lead"]] = relationship(
        back_populates="campaign", cascade="all, delete-orphan"
    )


class Lead(UUIDPrimaryKey, WorkspaceScoped, Timestamped, Base):
    """A prospect company considered *for one campaign*.

    The same company can be a 92 for the enterprise campaign and a 40 for the
    SMB one, because fit is only meaningful relative to what we are selling and
    to whom. That is why the score lives here and not on ProspectCompany.
    """

    __tablename__ = "leads"
    __table_args__ = (
        UniqueConstraint("campaign_id", "prospect_company_id", name="campaign_prospect"),
        CheckConstraint(
            "fit_score IS NULL OR (fit_score >= 0 AND fit_score <= 100)",
            name="fit_score_between_zero_and_hundred",
        ),
        CheckConstraint(
            "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)",
            name="confidence_between_zero_and_one",
        ),
        # Serves "show me everything above 85, best first".
        Index("ix_leads_campaign_score", "campaign_id", "fit_score"),
        Index("ix_leads_workspace_status", "workspace_id", "status"),
    )

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False
    )
    prospect_company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        # RESTRICT, not CASCADE: a prospect is shared across campaigns, so
        # deleting one must not silently gut another campaign's lead list.
        ForeignKey("prospect_companies.id", ondelete="RESTRICT"),
        nullable=False,
    )

    status: Mapped[LeadStatus] = mapped_column(
        enum_column(LeadStatus, "lead_status"),
        nullable=False,
        server_default=LeadStatus.DISCOVERED.value,
    )

    # --- Qualification: should we contact this company at all? ---
    fit_score: Mapped[int | None] = mapped_column(SmallInteger)
    confidence: Mapped[float | None] = mapped_column(Numeric(3, 2))
    qualification_reason: Mapped[str | None] = mapped_column(Text)
    qualification_evidence: Mapped[list[Any]] = mapped_column(
        nullable=False, server_default=text("'[]'::jsonb")
    )

    # --- Opportunity: how does OUR product help THIS company? ---
    opportunity_summary: Mapped[str | None] = mapped_column(Text)
    opportunity_evidence: Mapped[list[Any]] = mapped_column(
        nullable=False, server_default=text("'[]'::jsonb")
    )

    rejected_reason: Mapped[str | None] = mapped_column(Text)

    campaign: Mapped[Campaign] = relationship(back_populates="leads")
    prospect_company: Mapped[ProspectCompany] = relationship()
    drafts: Mapped[list["EmailDraft"]] = relationship(  # noqa: F821
        back_populates="lead", cascade="all, delete-orphan"
    )
