"""Every enum stored in the database.

Rendered as VARCHAR + CHECK rather than a native Postgres enum: adding a value
to a native enum requires ALTER TYPE, which cannot run inside a transaction
block on older servers and cannot be reversed at all. A CHECK constraint is one
ordinary migration to drop and recreate.
"""

from enum import StrEnum


class CompanyProfileStatus(StrEnum):
    ONBOARDING = "onboarding"
    ANALYZING = "analyzing"
    READY = "ready"


class KnowledgeSourceKind(StrEnum):
    BROCHURE = "brochure"
    PITCH_DECK = "pitch_deck"
    CASE_STUDY = "case_study"
    DOCUMENTATION = "documentation"
    WEBSITE = "website"
    OTHER = "other"


class KnowledgeSourceStatus(StrEnum):
    PENDING = "pending"
    PARSING = "parsing"
    READY = "ready"
    FAILED = "failed"


class CampaignStatus(StrEnum):
    DRAFT = "draft"
    PROSPECTING = "prospecting"
    RESEARCHING = "researching"
    READY = "ready"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


class LeadStatus(StrEnum):
    DISCOVERED = "discovered"
    RESEARCHING = "researching"
    QUALIFIED = "qualified"
    REJECTED = "rejected"
    OUTREACH_READY = "outreach_ready"
    APPROVED = "approved"
    SENT = "sent"


class ContactRole(StrEnum):
    FOUNDER = "founder"
    CEO = "ceo"
    MARKETING = "marketing"
    GROWTH = "growth"
    SALES = "sales"
    OPERATIONS = "operations"
    ENGINEERING = "engineering"
    OTHER = "other"


class EmailStatus(StrEnum):
    """Provenance of a contact's address. Never guess into `verified`."""

    VERIFIED = "verified"
    GUESSED = "guessed"
    UNKNOWN = "unknown"
    NOT_FOUND = "not_found"


class DraftStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EDITED = "edited"
    SKIPPED = "skipped"


class EmailProvider(StrEnum):
    SMTP = "smtp"
    RESEND = "resend"


class ChatRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ExecutionStatus(StrEnum):
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class TimelineEventKind(StrEnum):
    DISCOVERED = "discovered"
    RESEARCHED = "researched"
    QUALIFIED = "qualified"
    REJECTED = "rejected"
    CONTACT_FOUND = "contact_found"
    DRAFT_GENERATED = "draft_generated"
    DRAFT_APPROVED = "draft_approved"
    DRAFT_REJECTED = "draft_rejected"
    EMAIL_SENT = "email_sent"
    EMAIL_REPLIED = "email_replied"
