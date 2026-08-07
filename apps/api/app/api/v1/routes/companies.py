import uuid
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.api.deps import SessionDep, SettingsDep, StorageDep
from app.core.queue import get_queue
from app.models.enums import KnowledgeSourceKind
from app.schemas.company import (
    CompanyProfileCreate,
    CompanyProfileRead,
    CompanyProfileUpdate,
    CompanyProfileWithSources,
    KnowledgeSourceRead,
    ScrapeAccepted,
    ScrapeRequest,
    SourceContent,
)
from app.services import company as service

router = APIRouter(prefix="/companies", tags=["company"])


@router.post("", response_model=CompanyProfileRead, status_code=status.HTTP_201_CREATED)
async def create_company_profile(
    payload: CompanyProfileCreate, session: SessionDep, settings: SettingsDep
) -> CompanyProfileRead:
    profile = await service.create_profile(session, payload, workspace_id=settings.workspace_id)
    return CompanyProfileRead.model_validate(profile)


@router.get("", response_model=list[CompanyProfileWithSources])
async def list_company_profiles(
    session: SessionDep, settings: SettingsDep
) -> list[CompanyProfileWithSources]:
    """Every profile in the workspace. Backs the company switcher."""
    profiles = await service.list_profiles(session, workspace_id=settings.workspace_id)
    return [CompanyProfileWithSources.model_validate(p) for p in profiles]


# Declared before /{profile_id} so "current" is never parsed as a UUID.
@router.get("/current", response_model=CompanyProfileWithSources)
async def read_current_company_profile(
    session: SessionDep, settings: SettingsDep
) -> CompanyProfileWithSources:
    """The onboarding screen calls this to decide between 'set up' and 'resume'."""
    profile = await service.get_current_profile(session, workspace_id=settings.workspace_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no company profile yet")
    return CompanyProfileWithSources.model_validate(profile)


@router.get("/{profile_id}", response_model=CompanyProfileWithSources)
async def read_company_profile(
    profile_id: uuid.UUID, session: SessionDep, settings: SettingsDep
) -> CompanyProfileWithSources:
    profile = await service.get_profile(session, profile_id, workspace_id=settings.workspace_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "company profile not found")
    return CompanyProfileWithSources.model_validate(profile)


@router.patch("/{profile_id}", response_model=CompanyProfileRead)
async def update_company_profile(
    profile_id: uuid.UUID,
    payload: CompanyProfileUpdate,
    session: SessionDep,
    settings: SettingsDep,
) -> CompanyProfileRead:
    profile = await service.get_profile(session, profile_id, workspace_id=settings.workspace_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "company profile not found")
    updated = await service.update_profile(session, profile, payload)
    return CompanyProfileRead.model_validate(updated)


@router.post(
    "/{profile_id}/knowledge-sources",
    response_model=KnowledgeSourceRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_knowledge_source(
    profile_id: uuid.UUID,
    session: SessionDep,
    settings: SettingsDep,
    storage: StorageDep,
    kind: Annotated[KnowledgeSourceKind, Form()],
    file: Annotated[UploadFile, File()],
    source_url: Annotated[str | None, Form()] = None,
) -> KnowledgeSourceRead:
    profile = await service.get_profile(session, profile_id, workspace_id=settings.workspace_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "company profile not found")

    try:
        service.validate_upload(
            filename=file.filename,
            content_type=file.content_type,
            size=file.size,
            settings=settings,
        )
    except service.UploadRejected as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc

    data = await file.read()
    # Starlette reports `size` from the multipart headers; re-check the bytes we
    # actually received so a lying Content-Length cannot fill the disk.
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"file exceeds {settings.max_upload_bytes} bytes",
        )

    source = await service.add_knowledge_source(
        session,
        storage,
        profile=profile,
        kind=kind,
        filename=file.filename or "upload",
        content_type=file.content_type,
        data=data,
        source_url=source_url,
    )
    return KnowledgeSourceRead.model_validate(source)


@router.post(
    "/{profile_id}/scrape",
    response_model=ScrapeAccepted,
    status_code=status.HTTP_202_ACCEPTED,
)
async def scrape_company_website(
    profile_id: uuid.UUID,
    payload: ScrapeRequest,
    session: SessionDep,
    settings: SettingsDep,
) -> ScrapeAccepted:
    """Queue a crawl of the company's own site.

    Returns immediately: crawling a site takes far longer than a request should.
    Pages appear as knowledge sources while the job runs.
    """
    profile = await service.get_profile(session, profile_id, workspace_id=settings.workspace_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "company profile not found")

    target = str(payload.url) if payload.url else profile.website
    if not target:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "no URL given and this company has no website on file",
        )

    queue = await get_queue()
    job = await queue.enqueue_job("scrape_website", str(profile.id), target, payload.max_pages)
    if job is None:  # pragma: no cover - arq returns None only on a duplicate job id
        raise HTTPException(status.HTTP_409_CONFLICT, "a scrape is already queued")

    return ScrapeAccepted(job_id=job.job_id, url=target, max_pages=payload.max_pages)


@router.get("/{profile_id}/knowledge-sources/{source_id}/content", response_model=SourceContent)
async def read_knowledge_source_content(
    profile_id: uuid.UUID,
    source_id: uuid.UUID,
    session: SessionDep,
    settings: SettingsDep,
    storage: StorageDep,
) -> SourceContent:
    source = await service.get_knowledge_source(
        session, source_id, company_profile_id=profile_id, workspace_id=settings.workspace_id
    )
    if source is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "knowledge source not found")
    return SourceContent(content=await service.read_source_content(storage, source))


@router.put(
    "/{profile_id}/knowledge-sources/{source_id}/content",
    response_model=KnowledgeSourceRead,
)
async def update_knowledge_source_content(
    profile_id: uuid.UUID,
    source_id: uuid.UUID,
    payload: SourceContent,
    session: SessionDep,
    settings: SettingsDep,
    storage: StorageDep,
) -> KnowledgeSourceRead:
    source = await service.get_knowledge_source(
        session, source_id, company_profile_id=profile_id, workspace_id=settings.workspace_id
    )
    if source is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "knowledge source not found")
    updated = await service.update_source_content(session, storage, source, payload.content)
    return KnowledgeSourceRead.model_validate(updated)


@router.delete(
    "/{profile_id}/knowledge-sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_knowledge_source(
    profile_id: uuid.UUID,
    source_id: uuid.UUID,
    session: SessionDep,
    settings: SettingsDep,
    storage: StorageDep,
) -> None:
    source = await service.get_knowledge_source(
        session,
        source_id,
        company_profile_id=profile_id,
        workspace_id=settings.workspace_id,
    )
    if source is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "knowledge source not found")
    await service.delete_knowledge_source(session, storage, source)


@router.get("/{profile_id}/knowledge-sources", response_model=list[KnowledgeSourceRead])
async def list_knowledge_sources(
    profile_id: uuid.UUID, session: SessionDep, settings: SettingsDep
) -> list[KnowledgeSourceRead]:
    profile = await service.get_profile(session, profile_id, workspace_id=settings.workspace_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "company profile not found")
    return [KnowledgeSourceRead.model_validate(s) for s in profile.sources]
