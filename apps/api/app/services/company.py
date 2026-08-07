"""Onboarding orchestration.

Routes stay thin because this is not CRUD: creating a knowledge source means
validating an upload, writing to storage, writing a row, and — from Phase 3 —
enqueuing a parse job. Those steps have to succeed or fail together.
"""

import uuid

from shared import get_logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import ApiSettings
from app.models.company import CompanyProfile, KnowledgeSource
from app.models.enums import KnowledgeSourceKind, KnowledgeSourceStatus
from app.schemas.company import CompanyProfileCreate, CompanyProfileUpdate
from app.services.storage import Storage, build_key

log = get_logger(__name__)


class UploadRejected(Exception):
    """The file failed validation at the trust boundary."""


async def create_profile(
    session: AsyncSession, payload: CompanyProfileCreate, *, workspace_id: uuid.UUID
) -> CompanyProfile:
    profile = CompanyProfile(
        workspace_id=workspace_id,
        name=payload.name,
        website=str(payload.website) if payload.website else None,
        description=payload.description,
        icp_description=payload.icp_description,
    )
    session.add(profile)
    await session.flush()
    log.info("company_profile.created", company_profile_id=str(profile.id), name=profile.name)
    return profile


async def update_profile(
    session: AsyncSession, profile: CompanyProfile, payload: CompanyProfileUpdate
) -> CompanyProfile:
    data = payload.model_dump(exclude_unset=True)
    if "website" in data and data["website"] is not None:
        data["website"] = str(data["website"])
    for field, value in data.items():
        setattr(profile, field, value)
    await session.flush()
    return profile


async def get_profile(
    session: AsyncSession, profile_id: uuid.UUID, *, workspace_id: uuid.UUID
) -> CompanyProfile | None:
    result = await session.execute(
        select(CompanyProfile)
        .where(CompanyProfile.id == profile_id, CompanyProfile.workspace_id == workspace_id)
        .options(selectinload(CompanyProfile.sources))
    )
    return result.scalar_one_or_none()


async def get_current_profile(
    session: AsyncSession, *, workspace_id: uuid.UUID
) -> CompanyProfile | None:
    """The MVP's single profile.

    Becomes "the profile for the authenticated workspace" without changing the
    call site, because the workspace is already a parameter.
    """
    result = await session.execute(
        select(CompanyProfile)
        .where(CompanyProfile.workspace_id == workspace_id)
        .options(selectinload(CompanyProfile.sources))
        .order_by(CompanyProfile.created_at)
        .limit(1)
    )
    return result.scalar_one_or_none()


def validate_upload(
    *, filename: str | None, content_type: str | None, size: int | None, settings: ApiSettings
) -> None:
    """Reject before anything touches the disk."""
    if not filename:
        raise UploadRejected("a filename is required")
    if size is not None and size > settings.max_upload_bytes:
        raise UploadRejected(
            f"file is {size} bytes; the limit is {settings.max_upload_bytes} bytes"
        )
    if size == 0:
        raise UploadRejected("file is empty")
    if content_type and content_type not in settings.allowed_upload_mime_types:
        raise UploadRejected(f"unsupported content type: {content_type}")


async def add_knowledge_source(
    session: AsyncSession,
    storage: Storage,
    *,
    profile: CompanyProfile,
    kind: KnowledgeSourceKind,
    filename: str,
    content_type: str | None,
    data: bytes,
) -> KnowledgeSource:
    """Persist an uploaded document and register it for parsing.

    Storage first, row second: an orphaned file wastes disk, whereas a row
    pointing at a file that was never written breaks every later read.
    """
    key = build_key(
        workspace_id=profile.workspace_id, company_id=profile.id, filename=filename
    )
    await storage.save(key, data)

    source = KnowledgeSource(
        workspace_id=profile.workspace_id,
        company_profile_id=profile.id,
        kind=kind,
        original_filename=filename,
        storage_key=key,
        mime_type=content_type,
        size_bytes=len(data),
        status=KnowledgeSourceStatus.PENDING,
    )
    session.add(source)
    await session.flush()

    log.info(
        "knowledge_source.created",
        knowledge_source_id=str(source.id),
        kind=kind.value,
        size_bytes=len(data),
    )
    # TODO(phase-3): enqueue the parse + embed job here.
    return source
