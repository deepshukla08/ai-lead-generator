"""Shared FastAPI dependencies.

Annotated aliases rather than `= Depends(...)` defaults: they compose, they are
reusable, and they keep signatures readable as the dependency list grows.
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import ApiSettings, get_settings
from app.db.session import get_session
from app.services.storage import Storage, get_storage

SessionDep = Annotated[AsyncSession, Depends(get_session)]
SettingsDep = Annotated[ApiSettings, Depends(get_settings)]
StorageDep = Annotated[Storage, Depends(get_storage)]
