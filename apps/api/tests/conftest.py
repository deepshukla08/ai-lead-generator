"""Test fixtures.

Tests run against a real Postgres, created by the real migrations. An in-memory
SQLite stand-in would not have pgvector, JSONB, triggers, partial indexes or
CHECK constraints — which is most of what this schema *is*.
"""

import asyncio
import os
from pathlib import Path

# Must happen before anything imports app.core.config, whose settings are cached.
_DEFAULT = "postgresql+asyncpg://agentsdr:agentsdr@postgres:5432/agentsdr"
_BASE_URL = os.environ.get("DATABASE_URL", _DEFAULT)
_SERVER, _MAIN_DB = _BASE_URL.rsplit("/", 1)
TEST_DB_NAME = f"{_MAIN_DB}_test"
TEST_DATABASE_URL = f"{_SERVER}/{TEST_DB_NAME}"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402

API_ROOT = Path(__file__).resolve().parent.parent


async def _recreate_database() -> None:
    """A migration bug must fail the suite, not survive in a stale database."""
    engine = create_async_engine(f"{_SERVER}/postgres", isolation_level="AUTOCOMMIT")
    async with engine.connect() as conn:
        await conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}" WITH (FORCE)'))
        await conn.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}"'))
    await engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def database() -> None:
    asyncio.run(_recreate_database())
    config = Config(str(API_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(API_ROOT / "migrations"))
    command.upgrade(config, "head")


@pytest.fixture
async def session():
    """A session for asserting on the database directly."""
    engine = create_async_engine(TEST_DATABASE_URL)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        yield db
    await engine.dispose()


@pytest.fixture
def client(tmp_path):
    from fastapi.testclient import TestClient

    from app.main import app
    from app.services.storage import LocalStorage, get_storage

    # Uploads land in a temp directory, never the real storage volume.
    app.dependency_overrides[get_storage] = lambda: LocalStorage(tmp_path)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
