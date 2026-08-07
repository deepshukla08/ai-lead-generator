import uuid
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.api.deps import SessionDep, SettingsDep, StorageDep
from app.models.enums import KnowledgeSourceKind
from app.schemas.company import (
    CompanyProfileCreate,
    CompanyProfileRead,
    CompanyProfileUpdate,
    CompanyProfileWithSources,
    KnowledgeSourceRead,
)
from app.services import company as service

router = APIRouter(prefix="/companies", tags=["company"])


@router.post("", response_model=CompanyProfileRead, status_code=status.HTTP_201_CREATED)
async def create_company_profile(
    payload: CompanyProfileCreate, session: SessionDep, settings: SettingsDep
) -> CompanyProfileRead:
    profile = await service.create_profile(
        session, payload, workspace_id=settings.workspace_id
    )
    return CompanyProfileRead.model_validate(profile)


@router.get("/current", response_model=CompanyProfileWithSources)
async def read_current_company_profile(
    session: SessionDep, settings: SettingsDep
) -> CompanyProfileWithSources:
    """The onboarding screen calls this to decide between 'set up' and 'resume'."""
    profile = await service.get_current_profile(session, workspace_id=settings.workspace_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no company profile yet")
    return CompanyProfileWithSources.model_validate(profile)


@router.patch("/{profile_id}", response_model=CompanyProfileRead)
async def update_company_profile(
    profile_id: uuid.UUID,
    payload: CompanyProfileUpdate,
    session: SessionDep,
    settings: SettingsDep,
) -> CompanyProfileRead:
    profile = await service.get_profile(
        session, profile_id, workspace_id=settings.workspace_id
    )
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
) -> KnowledgeSourceRead:
    profile = await service.get_profile(
        session, profile_id, workspace_id=settings.workspace_id
    )
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
    )
    return KnowledgeSourceRead.model_validate(source)


@router.get("/{profile_id}/knowledge-sources", response_model=list[KnowledgeSourceRead])
async def list_knowledge_sources(
    profile_id: uuid.UUID, session: SessionDep, settings: SettingsDep
) -> list[KnowledgeSourceRead]:
    profile = await service.get_profile(
        session, profile_id, workspace_id=settings.workspace_id
    )
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "company profile not found")
    return [KnowledgeSourceRead.model_validate(s) for s in profile.sources]
