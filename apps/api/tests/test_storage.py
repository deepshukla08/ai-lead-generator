import uuid

import pytest

from app.services.storage import LocalStorage, build_key


async def test_save_read_delete_roundtrip(tmp_path) -> None:
    storage = LocalStorage(tmp_path)
    key = "workspace/company/file.pdf"

    await storage.save(key, b"hello")
    assert await storage.read(key) == b"hello"

    await storage.delete(key)
    with pytest.raises(FileNotFoundError):
        await storage.read(key)


async def test_delete_is_idempotent(tmp_path) -> None:
    await LocalStorage(tmp_path).delete("never/existed.pdf")


@pytest.mark.parametrize(
    "key",
    ["../escape.pdf", "a/../../escape.pdf", "/etc/passwd"],
)
async def test_keys_cannot_escape_the_root(tmp_path, key: str) -> None:
    storage = LocalStorage(tmp_path)
    with pytest.raises(ValueError, match="escapes the root"):
        await storage.save(key, b"x")


def test_build_key_discards_the_user_filename() -> None:
    key = build_key(
        workspace_id=uuid.UUID(int=1),
        company_id=uuid.UUID(int=2),
        filename="../../../etc/passwd.pdf",
    )
    assert "etc" not in key
    assert ".." not in key
    assert key.endswith(".pdf")
