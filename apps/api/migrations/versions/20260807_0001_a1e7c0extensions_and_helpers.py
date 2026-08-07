"""extensions and shared helpers

Runs before any table exists. Keeps the schema self-contained: a fresh Postgres
with no init script still ends up correct after `alembic upgrade head`.

Revision ID: a1e7c0
Revises:
Create Date: 2026-08-07
"""

from collections.abc import Sequence

from alembic import op

revision: str = "a1e7c0"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# ORM-level `onupdate` only fires when the ORM performs the update. A bulk
# `UPDATE leads SET status = ...`, a repair script, or psql all bypass it and
# leave updated_at lying. Enforcing it in the database is the only version that
# is actually true.
SET_UPDATED_AT = """
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute(SET_UPDATED_AT)


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS set_updated_at()")
    # The extensions are left in place: other schemas in this database may be
    # using them, and dropping a shared extension is not ours to decide.
