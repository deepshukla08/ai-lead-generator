"""Import every model here.

Alembic autogenerate only sees what is attached to Base.metadata, and a model
nobody imported is a table nobody migrates.
"""

from app.db.base import Base
from app.models.activity import AgentExecution, TimelineEvent
from app.models.campaign import Campaign, Lead
from app.models.chat import ChatMessage, Conversation
from app.models.company import CompanyProfile, KnowledgeChunk, KnowledgeSource
from app.models.outreach import EmailDraft, SentEmail
from app.models.prospect import Contact, ProspectCompany, Research

__all__ = [
    "AgentExecution",
    "Base",
    "Campaign",
    "ChatMessage",
    "CompanyProfile",
    "Contact",
    "Conversation",
    "EmailDraft",
    "KnowledgeChunk",
    "KnowledgeSource",
    "Lead",
    "ProspectCompany",
    "Research",
    "SentEmail",
    "TimelineEvent",
]
