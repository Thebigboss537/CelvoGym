-- Local E2E init: creates CelvoGuard user + database alongside the primary
-- Kondix `celvo` database, so both apps can share a single Postgres instance.
-- Runs automatically on FIRST Postgres container startup via the
-- /docker-entrypoint-initdb.d/ mount declared in docker-compose.yml.
--
-- If you need to re-run it, you must drop the pgdata volume:
--   docker compose down -v && docker compose up -d

CREATE USER celvoguard WITH PASSWORD 'dev_password';
CREATE DATABASE celvoguard WITH OWNER celvoguard;
GRANT ALL PRIVILEGES ON DATABASE celvoguard TO celvoguard;
