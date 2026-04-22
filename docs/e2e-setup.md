# Kondix E2E Local Environment Setup

End-to-end Playwright tests (`kondix-web/e2e/specs/`) exercise the full stack:
Kondix UI → Kondix API → Kondix database, plus cross-app calls to CelvoGuard
for register/login. This document describes the one-time setup and daily
startup workflow to run those tests locally.

## Prerequisites

- Docker Desktop running
- .NET 10 SDK
- Node 20+ / npm
- Local checkouts of both repos at:
  - `C:\Users\eudes\Proyectos\Celvo\Kondix`
  - `C:\Users\eudes\Proyectos\Celvo\CelvoGuard`

## Topology

One shared Postgres instance hosts both databases:

| Database     | Owner         | Password        | Used by      |
|--------------|---------------|-----------------|--------------|
| `celvo`      | `celvo_user`  | `dev`           | Kondix API   |
| `celvoguard` | `celvoguard`  | `dev_password`  | CelvoGuard   |

One shared Redis (`localhost:6379`, password `dev`) is used by both apps.

## First-time setup

From `C:\Users\eudes\Proyectos\Celvo\Kondix`:

```bash
# Bring up shared infra (creates both databases via init script)
docker compose up -d postgres redis minio

# Verify both DBs exist
docker exec kondix-postgres-1 psql -U celvo_user -d celvo -c "\l"
```

If you ever need to re-run the init script (e.g., forgot to add something), drop the volume:

```bash
docker compose down
docker volume rm kondix_pgdata
docker compose up -d postgres redis minio
```

CelvoGuard auto-migrates on startup, so its `celvoguard` schema is created on first run of the API.

## Daily workflow

Three processes need to be running simultaneously for E2E tests:

### 1. Shared infra (Docker)

```bash
cd C:/Users/eudes/Proyectos/Celvo/Kondix
docker compose up -d postgres redis minio
```

### 2. CelvoGuard API (port 5050)

```bash
cd C:/Users/eudes/Proyectos/Celvo/CelvoGuard
dotnet run --project src/CelvoGuard.Presentation --urls http://localhost:5050
```

Leave this running in its own terminal. First start applies EF migrations against the `celvoguard` database.

### 3. Kondix API + frontend (auto-started by Playwright)

You do NOT need to start these manually. The Playwright config
(`kondix-web/playwright.config.ts`) declares a `webServer` block that boots
both the Kondix API (`http://localhost:5070`) and the Angular frontend
(`http://localhost:4200`) on first `playwright test` invocation and keeps
them running between runs (via `reuseExistingServer: true`).

## Running tests

```bash
cd kondix-web
npm run e2e                # headless, full suite, HTML report
npm run e2e:ui             # interactive Playwright UI
npm run e2e:debug          # stepping with DevTools
```

HTML report opens automatically if a test fails: `kondix-web/playwright-report/index.html`.

## Environment variables

| Var                  | Default                         | Purpose                               |
|----------------------|---------------------------------|---------------------------------------|
| `E2E_WEB_URL`        | `http://localhost:4200`         | Angular frontend base URL             |
| `E2E_API_URL`        | `http://localhost:5070`         | Kondix API base URL                   |
| `E2E_INTERNAL_KEY`   | `dev-internal-key-change-me`    | Key sent as `X-Internal-Key` to Kondix API's test endpoints |

Override via shell env vars when needed.

## Troubleshooting

**CelvoGuard 500 on register/login:** the `celvoguard` database may not have been migrated yet. Kill `dotnet run`, wait for it to fully exit, then restart; the EF `MigrateAsync` call in `Program.cs` will create the schema.

**Kondix API won't start under Playwright:** the `celvo` database must exist. Check `docker compose ps` shows the postgres container healthy, and `docker exec kondix-postgres-1 psql -U celvo_user -d celvo -c "\l"` succeeds.

**Playwright tests fail with "cg-access-kondix cookie not set":** the CelvoGuard instance is not reachable. Verify `curl http://localhost:5050/api/v1/health` returns a 200.

**"celvoguard" database does not exist:** the init script did not run. The `/docker-entrypoint-initdb.d/` mount only triggers on an empty volume. Drop `kondix_pgdata` and re-compose.

**Port 5432 already in use:** another Postgres is already running (likely the CelvoGuard repo's own `docker-compose.yml`). Stop it: `docker compose -f C:/Users/eudes/Proyectos/Celvo/CelvoGuard/docker-compose.yml down`.

## Why not use CelvoGuard's docker-compose?

CelvoGuard's own `docker-compose.yml` also binds port 5432 with a different user/password. For local E2E testing we instead use Kondix's `docker-compose.yml` with the added init script to create the `celvoguard` database alongside `celvo`, giving one unified Postgres for both apps. This avoids port conflicts and mirrors the production topology (one Postgres, multiple databases per project).
