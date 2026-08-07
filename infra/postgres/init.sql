-- Runs once, on first boot of an empty postgres volume.
-- Executed against $POSTGRES_DB by the official entrypoint.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Langfuse gets its own database on the same server.
-- One postgres instance is plenty for local dev; split it in production.
CREATE DATABASE langfuse;
