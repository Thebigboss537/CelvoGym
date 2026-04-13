# KONDIX Rebranding Design Spec

**Date:** 2026-04-13
**Status:** Approved
**Scope:** Full rebrand from CelvoGym to KONDIX across the Celvo ecosystem

## Summary

Rename the gym management app from "CelvoGym" to "KONDIX". The color palette stays. The app remains in the Celvo ecosystem at `kondix.celvo.dev`. Execution follows a two-phase approach: Phase 1 (code & config), Phase 2 (infra & data).

## Decisions

| Decision | Value |
|----------|-------|
| Domain | `kondix.celvo.dev` |
| Component prefix | `kx-` (from `cg-`) |
| CelvoGuard app slug | `kondix` (from `celvogym`/`gym`) |
| .NET namespaces | `Kondix.*` (from `CelvoGym.*`) |
| DB schema | `kondix` (from `gym`) |
| MinIO buckets | `kondix-videos`, `kondix-photos` |
| Cookie names | `cg-access-kondix`, `cg-refresh-kondix`, `cg-csrf-kondix` |
| Docker images | `ghcr.io/thebigboss537/kondix-api`, `kondix-web` |
| Color palette | Unchanged (Crimson `#E62639`) |
| Logo mark | Unchanged (chevron + bar SVG) |

## Constraints

- Production data exists in the `gym` PostgreSQL schema — requires careful migration
- MinIO buckets may contain uploaded files — requires copy before delete
- CelvoGuard cross-project references must be updated in sync
- The repo directory stays `/gym/` for now — renaming the repo root is a separate concern

---

## Phase 1: Code & Configuration (no production impact)

### 1.1 Backend .NET — Project & Solution Files

| Current | New |
|---------|-----|
| `CelvoGym.slnx` | `Kondix.slnx` |
| `src/CelvoGym.Domain/CelvoGym.Domain.csproj` | `src/Kondix.Domain/Kondix.Domain.csproj` |
| `src/CelvoGym.Application/CelvoGym.Application.csproj` | `src/Kondix.Application/Kondix.Application.csproj` |
| `src/CelvoGym.Infrastructure/CelvoGym.Infrastructure.csproj` | `src/Kondix.Infrastructure/Kondix.Infrastructure.csproj` |
| `src/CelvoGym.Api/CelvoGym.Api.csproj` | `src/Kondix.Api/Kondix.Api.csproj` |
| `tests/CelvoGym.ArchTests/CelvoGym.ArchTests.csproj` | `tests/Kondix.ArchTests/Kondix.ArchTests.csproj` |
| `tests/CelvoGym.UnitTests/CelvoGym.UnitTests.csproj` | `tests/Kondix.UnitTests/Kondix.UnitTests.csproj` |

### 1.2 Backend .NET — Namespaces (178+ files)

Bulk rename across all `.cs` files:
- `CelvoGym.Domain.*` → `Kondix.Domain.*`
- `CelvoGym.Application.*` → `Kondix.Application.*`
- `CelvoGym.Infrastructure.*` → `Kondix.Infrastructure.*`
- `CelvoGym.Api.*` → `Kondix.Api.*`
- `CelvoGym.ArchTests.*` → `Kondix.ArchTests.*`
- `CelvoGym.UnitTests.*` → `Kondix.UnitTests.*`

### 1.3 Backend .NET — Key Class Renames

| Current | New |
|---------|-----|
| `CelvoGymDbContext` | `KondixDbContext` |
| `ICelvoGymDbContext` | `IKondixDbContext` |

### 1.4 Backend .NET — Hardcoded Strings

| File | Current | New |
|------|---------|-----|
| `Program.cs` | `options.AppSlug = "celvogym"` | `options.AppSlug = "kondix"` |
| `Program.cs` | `options.WithTitle("CelvoGym API")` | `options.WithTitle("Kondix API")` |
| `CsrfValidationMiddleware.cs` | `"cg-csrf-celvogym"` | `"cg-csrf-kondix"` |
| `VideosController.cs` | `"celvogym-videos"` | `"kondix-videos"` |
| `PhotosController.cs` | `"celvogym-photos"` | `"kondix-photos"` |
| `InviteStudentCommand.cs` | `"https://gym.celvo.dev/invite"` | `"https://kondix.celvo.dev/invite"` |

### 1.5 Backend .NET — Dockerfile

- Rename file: `src/CelvoGym.Api/Dockerfile` → `src/Kondix.Api/Dockerfile`
- Update all `CelvoGym.*.csproj` references → `Kondix.*.csproj`
- `ENTRYPOINT ["dotnet", "CelvoGym.Api.dll"]` → `ENTRYPOINT ["dotnet", "Kondix.Api.dll"]`

### 1.6 Backend .NET — EF Core Migrations

- Existing migrations keep `HasDefaultSchema("gym")` — they reflect historical state
- Schema change to `kondix` happens via a new migration in Phase 2
- Rename `CelvoGymDbContextModelSnapshot.cs` → `KondixDbContextModelSnapshot.cs`
- Update class references inside migration Designer files

### 1.7 Backend .NET — launchSettings.json

- Profile `"CelvoGym.Api"` → `"Kondix.Api"`

---

### 2.1 Frontend Angular — Directory & Config

| Current | New |
|---------|-----|
| `celvogym-web/` | `kondix-web/` |
| `package.json` name `"celvogym-web"` | `"kondix-web"` |
| `angular.json` project `"celvogym-web"` | `"kondix-web"` |

### 2.2 Frontend Angular — HTML, Manifest & Meta

| File | Current | New |
|------|---------|-----|
| `index.html` title | `CelvoGym` | `KONDIX` |
| `index.html` apple-mobile | `CelvoGym` | `KONDIX` |
| `index.html` localStorage key | `celvogym_tenant_id` | `kondix_tenant_id` |
| `index.html` manifest id | `cg-manifest` | `kx-manifest` |
| `index.html` noscript text | "CelvoGym" | "KONDIX" |
| `manifest.webmanifest` name | `CelvoGym` | `KONDIX` |
| `manifest.webmanifest` short_name | `CelvoGym` | `KONDIX` |

### 2.3 Frontend Angular — Component Prefix `cg-` → `kx-`

24 shared UI components + 2 layout components. Change selector declarations AND all template references:

`avatar`, `badge`, `bottom-nav`, `confirm-dialog`, `day-cell`, `empty-state`, `hero-card`, `line-chart`, `logo`, `page-header`, `progress-bar`, `rest-timer`, `segmented-control`, `set-row`, `sidebar`, `spinner`, `stat-card`, `student-card`, `timeline`, `toast`, `wizard-stepper`, `student-shell`, `trainer-shell`

Plus root `app.ts` template: `<cg-toast />` → `<kx-toast />`

### 2.4 Frontend Angular — Hardcoded Strings

| File | Current | New |
|------|---------|-----|
| `auth.store.ts` (x3) | `'X-App-Slug': 'celvogym'` | `'X-App-Slug': 'kondix'` |
| `auth.interceptor.ts` | `'X-App-Slug': 'celvogym'` | `'X-App-Slug': 'kondix'` |
| `cookie.ts` | `'cg-csrf-celvogym'` | `'cg-csrf-kondix'` |
| `login.ts` | `'celvogym_tenant_id'` | `'kondix_tenant_id'` |
| `register.ts` (x2) | `'X-App-Slug': 'celvogym'` | `'X-App-Slug': 'kondix'` |
| `accept-invite.ts` (x2) | `'X-App-Slug': 'celvogym'` | `'X-App-Slug': 'kondix'` |
| `student-list.ts` | `'https://gym.celvo.dev'` | `'https://kondix.celvo.dev'` |
| `environment.prod.ts` | `'https://gym.celvo.dev/api/v1'` | `'https://kondix.celvo.dev/api/v1'` |
| `trainer-setup.ts` | UI text "CelvoGym" | "KONDIX" |

### 2.5 Frontend Angular — Branding in Components

| File | Current | New |
|------|---------|-----|
| `logo.ts` | `<span>Celvo</span><span>Gym</span>` | KONDIX wordmark (same crimson palette) |
| `sidebar.ts` | `<span>Celvo</span><span>Gym</span>` | KONDIX wordmark |
| `styles.css` | comment "CelvoGym Crimson" | "Kondix Crimson" |

### 2.6 Frontend Angular — Documentation

- `brand-guidelines.md` — update all CelvoGym references
- `.impeccable.md` — update design context
- `README.md` — update title

### 2.7 Frontend Angular — Assets

Logo mark SVGs (chevron + bar) have no text — keep as-is. Verify `favicon.svg` for text content.

---

### 3.1 CI/CD — GitHub Actions

**ci.yml:**
- `name: CelvoGym CI` → `name: Kondix CI`
- All `CelvoGym.slnx` refs → `Kondix.slnx`
- `working-directory: celvogym-web` → `kondix-web`
- `cache-dependency-path: celvogym-web/...` → `kondix-web/...`

**deploy.yml:**
- `name: CelvoGym Deploy` → `name: Kondix Deploy`
- Images: `ghcr.io/thebigboss537/celvogym-api` → `kondix-api`, same for web
- Cache scopes: `celvogym-api` → `kondix-api`, same for web
- Dockerfile path: `src/CelvoGym.Api/Dockerfile` → `src/Kondix.Api/Dockerfile`
- Context: `./celvogym-web` → `./kondix-web`
- Health check URL: `gym.celvo.dev` → `kondix.celvo.dev`

### 3.2 CI/CD — Docker Compose Dev

- Service `celvogym-api:` → `kondix-api:`
- Service `celvogym-web:` → `kondix-web:`
- Dockerfile path + context updated

---

### 4.1 Documentation — CLAUDE.md (project)

- Title, commands, brand identity, domain, bucket, slug, cookie, component table, gotchas

### 4.2 Documentation — CLAUDE.md (root ecosystem)

- `**Gym**` entry → `**KONDIX**`
- Service names in docker-compose list
- Caddyfile domain reference
- Directory path stays `/gym/`

### 4.3 Documentation — Other Files

- `CelvoGym-Business-Research.md` → rename to `Kondix-Business-Research.md`
- `PRODUCT-FEATURES.md` — update refs
- `E2E-TEST-REPORT.md` — update URLs

### 4.4 Documentation — Memory Files

- `project_celvogym.md` → `project_kondix.md`
- `MEMORY.md` index updated

### 4.5 Documentation — Setup Scripts

- `01-register-app.sql`: name, slug, audience, origins
- `03-minio-bucket.sh`: bucket name
- `04-deploy-checklist.md`: all references

---

## Phase 2: Infrastructure & Production Data (coordinated deploy with downtime)

### 5.1 PostgreSQL — Schema Rename

```sql
ALTER SCHEMA gym RENAME TO kondix;
```

New EF Core migration:
- `KondixDbContext.cs` → `HasDefaultSchema("kondix")`
- Migration body: `migrationBuilder.Sql("ALTER SCHEMA gym RENAME TO kondix;");`

**Prerequisite:** Stop `kondix-api` before executing to avoid active connections.

### 5.2 MinIO — Bucket Migration

```bash
mc mb celvo/kondix-videos
mc mb celvo/kondix-photos
mc mirror celvo/celvogym-videos celvo/kondix-videos
mc mirror celvo/celvogym-photos celvo/kondix-photos
# Verify
mc ls celvo/kondix-videos --summarize
mc ls celvo/kondix-photos --summarize
# After verification, remove old
mc rb celvo/celvogym-videos --force
mc rb celvo/celvogym-photos --force
```

### 5.3 CelvoGuard — App Registration Update

```sql
UPDATE apps
SET name = 'KONDIX',
    slug = 'kondix',
    audience = 'kondix.celvo.dev',
    allowed_origins = ARRAY['https://kondix.celvo.dev', 'http://localhost:4200']
WHERE slug = 'gym';
```

Update `Cors__AllowedOrigins__3` in docker-compose.prod.yml for CelvoGuard.

### 5.4 CelvoGuard Seeder (cross-project)

Update `CelvoGuardDbSeeder.cs` in CelvoGuard repo:
- Name: `"Celvo Gym"` → `"KONDIX"`
- Slug: `"gym"` → `"kondix"`
- Audience: `"gym.celvo.dev"` → `"kondix.celvo.dev"`
- Origins updated
- Permissions: `gym:*` → `kondix:*`

### 5.5 Caddyfile

Replace `gym.celvo.dev` block with `kondix.celvo.dev` block. Add permanent redirect from old domain:

```
gym.celvo.dev {
    redir https://kondix.celvo.dev{uri} permanent
}
```

### 5.6 docker-compose.prod.yml

- Service `celvogym-api:` → `kondix-api:`
- Image refs updated
- Service `celvogym-web:` → `kondix-web:`
- CelvoAdmin env: `Services__CelvoGymUrl` → `Services__KondixUrl: http://kondix-api:8080`

### 5.7 deploy.sh

- Health check URL and label updated

### 5.8 CelvoAdmin (cross-project)

Update any internal references to `CelvoGymUrl` or `celvogym-api`.

### 5.9 Deploy Execution Order

1. `docker compose stop celvogym-api celvogym-web`
2. Execute schema rename SQL
3. Migrate MinIO buckets
4. Update CelvoGuard DB + restart CelvoGuard
5. Update Caddyfile + docker-compose.prod.yml
6. Pull new images `kondix-api` / `kondix-web`
7. `docker compose up -d`
8. Health check `https://kondix.celvo.dev/api/v1/health`
9. Verify redirect from `gym.celvo.dev`
