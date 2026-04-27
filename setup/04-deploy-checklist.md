# KONDIX — Deploy Checklist

Run these steps **once** before the first production deploy. Order matters.

## 1. CelvoGuard: Register the app

```bash
psql -h localhost -U celvoguard -d celvoguard -f setup/01-register-app.sql
```

## 2. Database: Create gym schema

```bash
psql -h localhost -U celvo_user -d celvo -f setup/02-create-gym-schema.sql
```

EF Core migrations run automatically on app startup.

## 3. MinIO: Create video bucket

```bash
bash setup/03-minio-bucket.sh
```

## 4. CelvoGuard CORS

Add to celvoguard-api environment in `docker-compose.prod.yml`:

```yaml
Cors__AllowedOrigins__3: https://kondix.celvo.dev
```

Then restart: `docker compose -f docker-compose.prod.yml restart celvoguard-api`

## 5. docker-compose.prod.yml

Add these services:

```yaml
  kondix-api:
    image: ghcr.io/thebigboss537/kondix-api:${KONDIX_API_TAG:-latest}
    restart: unless-stopped
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ASPNETCORE_URLS: http://+:8080
      ASPNETCORE_FORWARDEDHEADERS_ENABLED: "true"
      ConnectionStrings__DefaultConnection: "Host=postgres;Database=celvo;Username=celvo_user;Password=${DB_PASSWORD}"
      ConnectionStrings__Redis: "redis:6379,password=${REDIS_PASSWORD}"
      CelvoGuard__SigningKey: ${JWT_SIGNING_KEY}
      CelvoGuard__Issuer: guard.celvo.dev
    expose:
      - "8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:8080/api/v1/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 256M
    networks:
      - celvo-net

  kondix-web:
    image: ghcr.io/thebigboss537/kondix-web:${KONDIX_WEB_TAG:-latest}
    restart: unless-stopped
    expose:
      - "80"
    deploy:
      resources:
        limits:
          memory: 64M
    networks:
      - celvo-net
```

## 6. Caddyfile

Add this block:

```caddyfile
kondix.celvo.dev {
    handle /api/* {
        reverse_proxy kondix-api:8080
    }

    handle {
        reverse_proxy kondix-web:80
    }

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }
}
```

## 7. .env

Add to `/opt/celvo/.env`:

```
KONDIX_API_TAG=latest
KONDIX_WEB_TAG=latest
```

## 8. Caddy depends_on

Add `kondix-api` to the caddy service `depends_on` list.

## 9. Deploy

```bash
cd /opt/celvo
docker compose -f docker-compose.prod.yml pull kondix-api kondix-web
docker compose -f docker-compose.prod.yml up -d kondix-api kondix-web
```

## 10. Verify

```bash
curl -sf https://kondix.celvo.dev/api/v1/health
# Expected: {"status":"healthy","timestamp":"..."}
```

## Phase 1.5 — Trainer approval

Add to `deploy/docker-compose.prod.yml` under `kondix-api.environment`:
- `Internal__ApiKey=${KONDIX_INTERNAL_API_KEY}`

Add to `deploy/.env`:
- `KONDIX_INTERNAL_API_KEY=<32+ random hex chars>`

Confirm CelvoAdmin's deploy gets the same secret as `Kondix__InternalApiKey`
when the CelvoAdmin-side work ships (separate plan).

## v2 deploy (2026-04-27 — feedback loop, recovery, programs editor refresh)

EF migrations applied automatically on app startup, in order:

1. `20260426234130_AddSessionAndSetFeedbackFields` (Phase 3) — adds `set_logs.notes`, `workout_sessions.{mood, feedback_reviewed_at}` + partial index, new `exercise_feedback` table.
2. `20260427011850_AddSessionRecoveryFields` (Phase 4) — adds `workout_sessions.{is_recovery, recovers_session_id}` + self-FK + index.
3. `20260427024952_AddProgramWeekOverrides` (Phase 5) — creates `program_week_overrides` table with `UNIQUE(program_id, week_index)` + cascade FK to `programs`.

All three are **additive only — no backfill, no app downtime**.

Frontend dependency added: `@angular/cdk@^21.2.8` — used only in the lazy `program-form` chunk for the trainer's weekly D&D planning grid. Bundle impact: +~16.7 kB transfer on that chunk only (well within the spec's ~30 kB budget).

No new env vars introduced in v2. No new MinIO buckets (`kondix-videos` is still planned but not provisioned — YouTube embeds remain the only video source). No new CelvoGuard registrations.

After deploy, sanity-check the new endpoints:

```bash
# Feedback (trainer-only, requires trainer cookie)
curl -sf -b "cg-access-kondix=<jwt>; cg-csrf-kondix=<csrf>" \
  -H "X-CSRF-Token: <csrf>" \
  https://kondix.celvo.dev/api/v1/students/<id>/feedback/recent

# Per-week notes (trainer-only)
curl -sf -b "cg-access-kondix=<jwt>; cg-csrf-kondix=<csrf>" \
  -H "X-CSRF-Token: <csrf>" \
  https://kondix.celvo.dev/api/v1/programs/<id>/week-overrides

# Recovery (student-only, requires student cookie)
curl -sf -b "cg-access-kondix=<jwt>; cg-csrf-kondix=<csrf>" \
  https://kondix.celvo.dev/api/v1/public/my/missed-sessions
# Expected: 204 No Content if nothing recoverable, 200 + RecoverableSessionDto otherwise.
```

