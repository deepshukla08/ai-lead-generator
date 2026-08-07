import asyncio
from logging.config import fileConfig

import pgvector.sqlalchemy  # noqa: F401 - registers Vector so autogenerate can render it
from alembic import context
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import get_settings
from app.models import Base  # imports every model, which is what populates metadata

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Never hard-code the URL in alembic.ini: the container, your shell and CI all
# have different ones, and only .env knows which.
config.set_main_option("sqlalchemy.url", get_settings().database_url)

target_metadata = Base.metadata


def include_object(obj, name: str | None, type_: str, reflected: bool, compare_to) -> bool:
    """Keep autogenerate away from enum CHECK constraints.

    Our enums are VARCHAR + CHECK (see app/db/types.py). Postgres rewrites the
    constraint expression when it stores it — `status IN ('draft', ...)` comes
    back as `status::text = ANY (ARRAY[...])` — so it never text-matches what
    SQLAlchemy renders, and every autogenerate proposes dropping all of them.
    Running such a migration would quietly delete the schema's validation.

    Enum changes are therefore explicit: edit app/models/enums.py, then write
    the drop/create by hand in the migration.
    """
    return not (type_ == "check_constraint" and reflected)


def _configure(connection: Connection | None = None, **kwargs) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        # Without this, altering a column type produces an empty migration.
        compare_type=True,
        compare_server_default=True,
        include_object=include_object,
        # Renders constraint names using the metadata naming convention so
        # downgrades have something concrete to drop.
        render_as_batch=False,
        **kwargs,
    )


def run_migrations_offline() -> None:
    _configure(
        url=config.get_main_option("sqlalchemy.url"),
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def _run(connection: Connection) -> None:
    _configure(connection)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}), prefix="sqlalchemy."
    )
    async with connectable.connect() as connection:
        await connection.run_sync(_run)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
