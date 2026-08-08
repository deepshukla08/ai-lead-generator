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
    """SMTP can send but cannot read an inbox or follow a thread.

    Reply monitoring therefore needs an API provider (Gmail, Outlook), which is
    why the provider interface has a read side and not only `send`.
    """

    SMTP = "smtp"
    RESEND = "resend"
    GMAIL = "gmail"
    OUTLOOK = "outlook"


class MessageDirection(StrEnum):
    OUTBOUND = "outbound"
    INBOUND = "inbound"


class ThreadStatus(StrEnum):
    """Where a conversation stands. Drives the hand-off to a human."""

    AWAITING_REPLY = "awaiting_reply"
    REPLIED = "replied"
    HIGH_INTENT = "high_intent"
    HANDED_OFF = "handed_off"
    NOT_INTERESTED = "not_interested"
    BOUNCED = "bounced"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class ReplyClassification(StrEnum):
    """What the Reply Understanding Agent decided an inbound message means."""

    INTERESTED = "interested"
    PRICING = "pricing"
    MEETING_REQUEST = "meeting_request"
    FOLLOW_UP = "follow_up"
    NOT_INTERESTED = "not_interested"
    AUTO_REPLY = "auto_reply"
    UNKNOWN = "unknown"


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
    EMAIL_OPENED = "email_opened"
    EMAIL_REPLIED = "email_replied"
    EMAIL_BOUNCED = "email_bounced"
    HIGH_INTENT = "high_intent"
    HANDED_OFF = "handed_off"
    DEAL_WON = "deal_won"
    DEAL_LOST = "deal_lost"
