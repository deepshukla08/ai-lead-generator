"""File storage behind a narrow interface.

Local disk today, S3 tomorrow. The interface is deliberately three methods: the
moment it grows a `list_directory` or a `get_local_path`, S3 stops being a drop-in
replacement. Callers only ever hold an opaque key.
"""

import uuid
from pathlib import Path, PurePosixPath
from typing import Protocol

from anyio import Path as AsyncPath

from app.core.config import ApiSettings, get_settings


class Storage(Protocol):
    async def save(self, key: str, data: bytes) -> None: ...

    async def read(self, key: str) -> bytes: ...

    async def delete(self, key: str) -> None: ...


def build_key(*, workspace_id: uuid.UUID, company_id: uuid.UUID, filename: str) -> str:
    """Namespaced key with a generated basename.

    The user's filename is never part of the path — that is how "../../etc/passwd"
    and duplicate names both stop being a problem. The original name is kept in
    the database column, where it is data rather than a path.
    """
    suffix = PurePosixPath(filename).suffix.lower()[:16]
    return f"{workspace_id}/{company_id}/{uuid.uuid4().hex}{suffix}"


class LocalStorage:
    """Writes under a root directory, refusing anything that escapes it."""

    def __init__(self, root: str | Path) -> None:
        self._root = Path(root).resolve()

    def _resolve(self, key: str) -> Path:
        path = (self._root / key).resolve()
        if not path.is_relative_to(self._root):
            raise ValueError(f"storage key escapes the root directory: {key!r}")
        return path

    async def save(self, key: str, data: bytes) -> None:
        path = AsyncPath(self._resolve(key))
        await path.parent.mkdir(parents=True, exist_ok=True)
        await path.write_bytes(data)

    async def read(self, key: str) -> bytes:
        return await AsyncPath(self._resolve(key)).read_bytes()

    async def delete(self, key: str) -> None:
        path = AsyncPath(self._resolve(key))
        if await path.exists():
            await path.unlink()


def build_storage(settings: ApiSettings) -> Storage:
    """Injection point. When S3 lands it is another branch here, nothing else."""
    if settings.storage_backend == "local":
        return LocalStorage(settings.storage_local_path)
    raise ValueError(f"unsupported STORAGE_BACKEND: {settings.storage_backend!r}")


def get_storage() -> Storage:
    """FastAPI dependency — deliberately zero-argument.

    A parameter annotated with a Pydantic model (ApiSettings) is read by FastAPI
    as a request *body field*, not as configuration. That silently turns any
    route depending on this into a two-body-parameter route, and FastAPI then
    embeds both, so `{"content": ...}` starts failing with "field required:
    payload". Keep the signature empty.
    """
    return build_storage(get_settings())
