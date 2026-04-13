# KONDIX Rebranding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename CelvoGym to KONDIX across the entire codebase (Phase 1 — code & config only, no production data changes).

**Architecture:** Bulk rename of .NET namespaces/projects (`CelvoGym.*` → `Kondix.*`), Angular component prefix (`cg-` → `kx-`), and all brand strings/URLs. Two verification gates: backend build + frontend build.

**Tech Stack:** .NET 10, Angular 21, PostgreSQL (EF Core), Docker, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-04-13-kondix-rebranding-design.md`

---

## Task 1: Rename .NET solution file and project directories

Rename the solution file and all 6 project directories using `git mv`. This must happen before any content changes.

**Files:**
- Rename: `CelvoGym.slnx` → `Kondix.slnx`
- Rename: `src/CelvoGym.Domain/` → `src/Kondix.Domain/`
- Rename: `src/CelvoGym.Application/` → `src/Kondix.Application/`
- Rename: `src/CelvoGym.Infrastructure/` → `src/Kondix.Infrastructure/`
- Rename: `src/CelvoGym.Api/` → `src/Kondix.Api/`
- Rename: `tests/CelvoGym.ArchTests/` → `tests/Kondix.ArchTests/`
- Rename: `tests/CelvoGym.UnitTests/` → `tests/Kondix.UnitTests/`

- [ ] **Step 1: Rename solution file**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git mv CelvoGym.slnx Kondix.slnx
```

- [ ] **Step 2: Rename src project directories**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git mv src/CelvoGym.Domain src/Kondix.Domain
git mv src/CelvoGym.Application src/Kondix.Application
git mv src/CelvoGym.Infrastructure src/Kondix.Infrastructure
git mv src/CelvoGym.Api src/Kondix.Api
```

- [ ] **Step 3: Rename test project directories**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git mv tests/CelvoGym.ArchTests tests/Kondix.ArchTests
git mv tests/CelvoGym.UnitTests tests/Kondix.UnitTests
```

- [ ] **Step 4: Rename .csproj files inside the renamed directories**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git mv src/Kondix.Domain/CelvoGym.Domain.csproj src/Kondix.Domain/Kondix.Domain.csproj
git mv src/Kondix.Application/CelvoGym.Application.csproj src/Kondix.Application/Kondix.Application.csproj
git mv src/Kondix.Infrastructure/CelvoGym.Infrastructure.csproj src/Kondix.Infrastructure/Kondix.Infrastructure.csproj
git mv src/Kondix.Api/CelvoGym.Api.csproj src/Kondix.Api/Kondix.Api.csproj
git mv tests/Kondix.ArchTests/CelvoGym.ArchTests.csproj tests/Kondix.ArchTests/Kondix.ArchTests.csproj
git mv tests/Kondix.UnitTests/CelvoGym.UnitTests.csproj tests/Kondix.UnitTests/Kondix.UnitTests.csproj
```

- [ ] **Step 5: Rename migration snapshot file**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git mv src/Kondix.Infrastructure/Migrations/CelvoGymDbContextModelSnapshot.cs src/Kondix.Infrastructure/Migrations/KondixDbContextModelSnapshot.cs
```

- [ ] **Step 6: Commit directory and file renames**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "refactor: rename CelvoGym directories and files to Kondix"
```

---

## Task 2: Bulk replace namespaces and references in all .cs files

Replace `CelvoGym` with `Kondix` in every `.cs` file — this covers namespaces, using statements, class references, and string literals in one sweep.

**Files:**
- Modify: All `.cs` files in `src/` and `tests/` (178+ files)

- [ ] **Step 1: Bulk replace `CelvoGym` → `Kondix` in all .cs files**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
find src tests -name '*.cs' -exec sed -i 's/CelvoGym/Kondix/g' {} +
```

This single command handles:
- `namespace CelvoGym.X` → `namespace Kondix.X`
- `using CelvoGym.X` → `using Kondix.X`
- `CelvoGymDbContext` → `KondixDbContext`
- `ICelvoGymDbContext` → `IKondixDbContext`

- [ ] **Step 2: Verify no CelvoGym references remain in .cs files**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
grep -r "CelvoGym" src/ tests/ --include="*.cs" -l
```

Expected: No output (no files found).

- [ ] **Step 3: Update .slnx project paths**

The solution file `Kondix.slnx` still references old directory/project names. Replace all occurrences:

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/CelvoGym/Kondix/g' Kondix.slnx
```

- [ ] **Step 4: Update .csproj ProjectReference paths**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
find src tests -name '*.csproj' -exec sed -i 's/CelvoGym/Kondix/g' {} +
```

- [ ] **Step 5: Commit namespace changes**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "refactor: rename CelvoGym namespaces to Kondix across all .cs files"
```

---

## Task 3: Update backend hardcoded strings (non-namespace)

These are brand strings, URLs, bucket names, and cookie names that the bulk namespace replace didn't catch or that need different values than a simple `CelvoGym` → `Kondix` swap.

**Files:**
- Modify: `src/Kondix.Api/Program.cs`
- Modify: `src/Kondix.Api/Middleware/CsrfValidationMiddleware.cs`
- Modify: `src/Kondix.Api/Controllers/VideosController.cs`
- Modify: `src/Kondix.Api/Controllers/PhotosController.cs`
- Modify: `src/Kondix.Application/Commands/Students/InviteStudentCommand.cs`
- Modify: `src/Kondix.Api/Properties/launchSettings.json`

- [ ] **Step 1: Update Program.cs — app slug**

In `src/Kondix.Api/Program.cs`, the bulk replace already changed `"CelvoGym API"` to `"Kondix API"`. But the app slug `"celvogym"` (lowercase) was NOT caught. Fix it:

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/options.AppSlug = "celvogym"/options.AppSlug = "kondix"/' src/Kondix.Api/Program.cs
```

- [ ] **Step 2: Update CsrfValidationMiddleware.cs — cookie name**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/cg-csrf-celvogym/cg-csrf-kondix/' src/Kondix.Api/Middleware/CsrfValidationMiddleware.cs
```

- [ ] **Step 3: Update VideosController.cs — bucket name**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/celvogym-videos/kondix-videos/' src/Kondix.Api/Controllers/VideosController.cs
```

- [ ] **Step 4: Update PhotosController.cs — bucket name**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/celvogym-photos/kondix-photos/' src/Kondix.Api/Controllers/PhotosController.cs
```

- [ ] **Step 5: Update InviteStudentCommand.cs — invite URL and email text**

Note: Task 2's bulk replace already changed `CelvoGym` → `Kondix` in this file. So the text now says "en Kondix" and the subject says "en Kondix". We need to fix the brand-visible text to all-caps `KONDIX`:

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's|https://gym.celvo.dev/invite|https://kondix.celvo.dev/invite|' src/Kondix.Application/Commands/Students/InviteStudentCommand.cs
sed -i 's/en Kondix/en KONDIX/g' src/Kondix.Application/Commands/Students/InviteStudentCommand.cs
```

- [ ] **Step 6: Update launchSettings.json**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/CelvoGym.Api/Kondix.Api/g' src/Kondix.Api/Properties/launchSettings.json
```

- [ ] **Step 7: Verify no remaining `celvogym` (lowercase) in backend**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
grep -ri "celvogym" src/ tests/ --include="*.cs" --include="*.json" -l
```

Expected: No output.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "refactor: update backend brand strings, URLs, and bucket names to Kondix"
```

---

## Task 4: Update Dockerfile, docker-compose, and launchSettings

**Files:**
- Modify: `src/Kondix.Api/Dockerfile`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Update Dockerfile references**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/CelvoGym/Kondix/g' src/Kondix.Api/Dockerfile
```

This updates:
- `COPY CelvoGym.slnx` → `COPY Kondix.slnx`
- All `CelvoGym.*.csproj` COPY commands
- `dotnet publish src/CelvoGym.Api/CelvoGym.Api.csproj` → Kondix
- `ENTRYPOINT ["dotnet", "CelvoGym.Api.dll"]` → `"Kondix.Api.dll"`

- [ ] **Step 2: Update docker-compose.yml**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/celvogym-api/kondix-api/g' docker-compose.yml
sed -i 's/celvogym-web/kondix-web/g' docker-compose.yml
sed -i 's/CelvoGym/Kondix/g' docker-compose.yml
```

- [ ] **Step 3: Verify Dockerfile and docker-compose**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
grep -i "celvogym\|CelvoGym" src/Kondix.Api/Dockerfile docker-compose.yml
```

Expected: No output.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "refactor: update Dockerfile and docker-compose for Kondix"
```

---

## Task 5: Update GitHub Actions workflows

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Update ci.yml**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/CelvoGym/Kondix/g' .github/workflows/ci.yml
sed -i 's/celvogym-web/kondix-web/g' .github/workflows/ci.yml
```

- [ ] **Step 2: Update deploy.yml**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/CelvoGym/Kondix/g' .github/workflows/deploy.yml
sed -i 's/celvogym-api/kondix-api/g' .github/workflows/deploy.yml
sed -i 's/celvogym-web/kondix-web/g' .github/workflows/deploy.yml
sed -i 's|gym\.celvo\.dev|kondix.celvo.dev|g' .github/workflows/deploy.yml
```

- [ ] **Step 3: Verify no old references**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
grep -i "celvogym\|CelvoGym\|gym\.celvo\.dev" .github/workflows/ci.yml .github/workflows/deploy.yml
```

Expected: No output.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "ci: update GitHub Actions workflows for Kondix"
```

---

## Task 6: Verify backend builds

Run the .NET build to catch any remaining broken references before moving to frontend.

- [ ] **Step 1: Restore and build**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
dotnet build Kondix.slnx
```

Expected: Build succeeded with 0 errors.

- [ ] **Step 2: Run tests**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
dotnet test Kondix.slnx
```

Expected: All tests pass.

- [ ] **Step 3: Fix any build errors**

If the build fails, check error messages. Common issues:
- Migration Designer files may have `[DbContext(typeof(CelvoGymDbContext))]` that the sed missed if the attribute was not on the same line as "CelvoGym" — re-check migration `.Designer.cs` files
- The snapshot class name inside `KondixDbContextModelSnapshot.cs` may still reference old name

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
grep -r "CelvoGym" src/Kondix.Infrastructure/Migrations/ --include="*.cs"
```

If any remain, fix them:

```bash
find src/Kondix.Infrastructure/Migrations -name '*.cs' -exec sed -i 's/CelvoGym/Kondix/g' {} +
```

- [ ] **Step 4: Rebuild and confirm**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
dotnet build Kondix.slnx
```

Expected: Build succeeded.

- [ ] **Step 5: Commit any fixes**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "fix: resolve remaining CelvoGym references in migrations"
```

(Skip this commit if Step 3 found nothing.)

---

## Task 7: Rename frontend directory and update config

**Files:**
- Rename: `celvogym-web/` → `kondix-web/`
- Modify: `kondix-web/package.json`
- Modify: `kondix-web/angular.json`
- Modify: `kondix-web/Dockerfile.nginx`

- [ ] **Step 1: Rename frontend directory**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git mv celvogym-web kondix-web
```

- [ ] **Step 2: Update package.json name**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/"celvogym-web"/"kondix-web"/' kondix-web/package.json
```

- [ ] **Step 3: Update angular.json project name**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/celvogym-web/kondix-web/g' kondix-web/angular.json
```

- [ ] **Step 4: Update Dockerfile.nginx**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/celvogym-web/kondix-web/g' kondix-web/Dockerfile.nginx
```

- [ ] **Step 5: Commit**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "refactor: rename celvogym-web directory to kondix-web"
```

---

## Task 8: Update frontend HTML, manifest, and meta tags

**Files:**
- Modify: `kondix-web/src/index.html`
- Modify: `kondix-web/public/manifest.webmanifest`

- [ ] **Step 1: Update index.html — title and meta**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/<title>CelvoGym<\/title>/<title>KONDIX<\/title>/' kondix-web/src/index.html
sed -i 's/content="CelvoGym"/content="KONDIX"/' kondix-web/src/index.html
```

- [ ] **Step 2: Update index.html — localStorage key and manifest id**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i "s/celvogym_tenant_id/kondix_tenant_id/g" kondix-web/src/index.html
sed -i 's/id="cg-manifest"/id="kx-manifest"/' kondix-web/src/index.html
sed -i "s/getElementById('cg-manifest')/getElementById('kx-manifest')/" kondix-web/src/index.html
```

- [ ] **Step 3: Update index.html — noscript text**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/Para usar CelvoGym/Para usar KONDIX/' kondix-web/src/index.html
```

- [ ] **Step 4: Update manifest.webmanifest**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/"CelvoGym"/"KONDIX"/g' kondix-web/public/manifest.webmanifest
```

- [ ] **Step 5: Commit**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "refactor: update HTML meta tags and manifest for KONDIX"
```

---

## Task 9: Rename component selectors `cg-` → `kx-`

Bulk replace across all `.ts` files in the frontend. This covers both the `selector:` declarations and template usages (`<cg-*>` tags).

**Files:**
- Modify: All `.ts` files in `kondix-web/src/app/`

- [ ] **Step 1: Replace selector declarations and template tags**

The `cg-` prefix appears in two contexts:
1. `selector: 'cg-xxx'` in component decorators
2. `<cg-xxx` and `</cg-xxx>` in inline templates

Replace all at once:

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
find kondix-web/src -name '*.ts' -exec sed -i "s/'cg-/'kx-/g" {} +
find kondix-web/src -name '*.ts' -exec sed -i 's/<cg-/<kx-/g' {} +
find kondix-web/src -name '*.ts' -exec sed -i 's/<\/cg-/<\/kx-/g' {} +
```

- [ ] **Step 2: Replace class name prefix in imports (CgXxx → KxXxx)**

Component classes like `CgLogo`, `CgSpinner`, `CgToast` etc. need renaming in import statements and class declarations:

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
find kondix-web/src -name '*.ts' -exec sed -i 's/\bCg\([A-Z]\)/Kx\1/g' {} +
```

This replaces word-boundary `Cg` followed by uppercase (class names) → `Kx`.

- [ ] **Step 3: Update index.html — cg-manifest id already done in Task 8**

Already handled. Verify no remaining `cg-` in index.html:

```bash
grep "cg-" kondix-web/src/index.html
```

Expected: No output.

- [ ] **Step 4: Verify no remaining cg- prefixes in .ts files**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
grep -rn "'cg-\|<cg-\|</cg-" kondix-web/src/ --include="*.ts"
```

Expected: No output.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "refactor: rename component prefix from cg- to kx-"
```

---

## Task 10: Update frontend hardcoded strings

**Files:**
- Modify: `kondix-web/src/app/core/auth/auth.store.ts`
- Modify: `kondix-web/src/app/core/interceptors/auth.interceptor.ts`
- Modify: `kondix-web/src/app/shared/utils/cookie.ts`
- Modify: `kondix-web/src/app/features/auth/feature/login.ts`
- Modify: `kondix-web/src/app/features/auth/feature/register.ts`
- Modify: `kondix-web/src/app/features/invite/feature/accept-invite.ts`
- Modify: `kondix-web/src/app/features/onboarding/feature/trainer-setup.ts`
- Modify: `kondix-web/src/app/features/trainer/students/feature/student-list.ts`
- Modify: `kondix-web/src/environments/environment.prod.ts`

- [ ] **Step 1: Replace app slug in all frontend files**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
find kondix-web/src -name '*.ts' -exec sed -i "s/'X-App-Slug': 'celvogym'/'X-App-Slug': 'kondix'/g" {} +
```

- [ ] **Step 2: Update CSRF cookie name**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i "s/cg-csrf-celvogym/cg-csrf-kondix/" kondix-web/src/app/shared/utils/cookie.ts
```

- [ ] **Step 3: Update tenant ID localStorage key**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i "s/celvogym_tenant_id/kondix_tenant_id/g" kondix-web/src/app/features/auth/feature/login.ts
```

- [ ] **Step 4: Update production domain URLs**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i "s|gym\.celvo\.dev|kondix.celvo.dev|g" kondix-web/src/environments/environment.prod.ts
sed -i "s|gym\.celvo\.dev|kondix.celvo.dev|g" kondix-web/src/app/features/trainer/students/feature/student-list.ts
```

- [ ] **Step 5: Update UI-visible brand text**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/en CelvoGym/en KONDIX/g' kondix-web/src/app/features/onboarding/feature/trainer-setup.ts
sed -i 's/CelvoGym API/KONDIX/g' kondix-web/src/app/features/invite/feature/accept-invite.ts
```

- [ ] **Step 6: Verify no remaining celvogym references**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
grep -ri "celvogym\|CelvoGym\|gym\.celvo\.dev" kondix-web/src/ --include="*.ts" --include="*.html"
```

Expected: No output.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "refactor: update frontend brand strings, URLs, and cookie names for KONDIX"
```

---

## Task 11: Update frontend branding in logo and sidebar components

**Files:**
- Modify: `kondix-web/src/app/shared/ui/logo.ts`
- Modify: `kondix-web/src/app/shared/ui/sidebar.ts`
- Modify: `kondix-web/src/styles.css`

- [ ] **Step 1: Read logo.ts to find exact wordmark template**

Read `kondix-web/src/app/shared/ui/logo.ts` and find the line with `<span class="text-text">Celvo</span><span class="text-primary">Gym</span>`.

- [ ] **Step 2: Update logo.ts wordmark**

Replace the two-span `Celvo`+`Gym` pattern with the KONDIX wordmark. The color palette stays — use `text-primary` for the full name since it's a single word now:

In `logo.ts`, replace:
```html
<span class="text-text">Celvo</span><span class="text-primary">Gym</span>
```
with:
```html
<span class="text-primary font-bold tracking-wider">KONDIX</span>
```

- [ ] **Step 3: Update sidebar.ts wordmark**

In `sidebar.ts`, same replacement — find the `Celvo`+`Gym` spans and replace with:
```html
<span class="text-primary font-bold tracking-wider">KONDIX</span>
```

- [ ] **Step 4: Update styles.css comment**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/CelvoGym Crimson/Kondix Crimson/g' kondix-web/src/styles.css
```

- [ ] **Step 5: Commit**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "refactor: update logo and sidebar wordmark to KONDIX"
```

---

## Task 12: Verify frontend builds

- [ ] **Step 1: Install dependencies**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym/kondix-web
npm install
```

- [ ] **Step 2: Build the Angular app**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym/kondix-web
npx ng build
```

Expected: Build succeeds with 0 errors.

- [ ] **Step 3: Fix any build errors**

If the build fails, common issues:
- Import paths still referencing old class names (`CgXxx` instead of `KxXxx`)
- Template references to old selectors missed by sed

Check for remaining old references:

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
grep -rn "\bCg[A-Z]" kondix-web/src/ --include="*.ts" | head -20
```

Fix any remaining references found.

- [ ] **Step 4: Commit any fixes**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "fix: resolve remaining frontend CelvoGym references"
```

(Skip if Step 3 found nothing.)

---

## Task 13: Update setup scripts

**Files:**
- Modify: `setup/01-register-app.sql`
- Modify: `setup/03-minio-bucket.sh`
- Modify: `setup/04-deploy-checklist.md`

- [ ] **Step 1: Update SQL registration script**

In `setup/01-register-app.sql`, replace:

| Line | Old | New |
|------|-----|-----|
| 2 | `Register CelvoGym app` | `Register KONDIX app` |
| 9 | `'CelvoGym'` | `'KONDIX'` |
| 10 | `'celvogym'` | `'kondix'` |
| 11 | `'gym.celvo.dev'` | `'kondix.celvo.dev'` |
| 12 | `'https://gym.celvo.dev'` | `'https://kondix.celvo.dev'` |
| 13 | `'gym:manage'` | `'kondix:manage'` |
| 15 | `'gym:workout'` | `'kondix:workout'` |
| 24 | `WHERE slug = 'celvogym'` | `WHERE slug = 'kondix'` |
| 28 | `'gym:manage'` | `'kondix:manage'` |
| 32 | `'gym:workout'` | `'kondix:workout'` |

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i "s/CelvoGym/KONDIX/g" setup/01-register-app.sql
sed -i "s/'celvogym'/'kondix'/g" setup/01-register-app.sql
sed -i "s/gym\.celvo\.dev/kondix.celvo.dev/g" setup/01-register-app.sql
sed -i "s/gym:manage/kondix:manage/g" setup/01-register-app.sql
sed -i "s/gym:workout/kondix:workout/g" setup/01-register-app.sql
```

- [ ] **Step 2: Update MinIO bucket script**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/celvogym-videos/kondix-videos/' setup/03-minio-bucket.sh
```

- [ ] **Step 3: Update deploy checklist**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/CelvoGym/KONDIX/g' setup/04-deploy-checklist.md
sed -i 's/celvogym/kondix/g' setup/04-deploy-checklist.md
sed -i 's/gym\.celvo\.dev/kondix.celvo.dev/g' setup/04-deploy-checklist.md
```

- [ ] **Step 4: Check if setup/02-create-gym-schema.sql needs update**

Read the file. If it creates the `gym` schema, note it but do NOT change it yet — the schema rename is Phase 2 (production deploy).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "refactor: update setup scripts for KONDIX"
```

---

## Task 14: Update project CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Bulk replace brand references**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/CelvoGym/KONDIX/g' CLAUDE.md
sed -i 's/celvogym/kondix/g' CLAUDE.md
sed -i 's/gym\.celvo\.dev/kondix.celvo.dev/g' CLAUDE.md
sed -i 's/<cg-/<kx-/g' CLAUDE.md
sed -i 's/`cg-/`kx-/g' CLAUDE.md
```

- [ ] **Step 2: Manual review and fix CLAUDE.md**

Read `CLAUDE.md` and fix:
- Title: should be `# KONDIX`
- Build commands: should reference `Kondix.slnx` and `src/Kondix.Api`
- Frontend dir: `kondix-web`
- Brand identity: "Kondix Crimson" (not "KONDIX Crimson")
- Component table: all `<kx-*>` entries
- Gotchas section: updated slug, cookie names, etc.

Some replacements need manual attention because `CelvoGym` → `KONDIX` (all caps) isn't always right. For example:
- `CelvoGym.slnx` should become `Kondix.slnx` (not `KONDIX.slnx`)
- Class names should be `KondixDbContext` (not `KONDIXDbContext`)

Fix these manually after the bulk replace.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "docs: update CLAUDE.md for KONDIX rebrand"
```

---

## Task 15: Update ecosystem CLAUDE.md

**Files:**
- Modify: `../CLAUDE.md` (at `C:\Users\eudes\Proyectos\Celvo\CLAUDE.md`)

- [ ] **Step 1: Update gym references in ecosystem CLAUDE.md**

These are targeted replacements — do NOT do a blanket replace as this file covers all Celvo projects:

```bash
cd /c/Users/eudes/Proyectos/Celvo
sed -i 's/\*\*Gym\*\* (`\/gym\/`) — Gym management app. Prod: `gym.celvo.dev`/\*\*KONDIX\*\* (`\/gym\/`) — Gym management app. Prod: `kondix.celvo.dev`/' CLAUDE.md
sed -i 's/celvogym-api/kondix-api/g' CLAUDE.md
sed -i 's/celvogym-web/kondix-web/g' CLAUDE.md
sed -i 's/gym\.celvo\.dev/kondix.celvo.dev/g' CLAUDE.md
```

- [ ] **Step 2: Update PostgreSQL schema reference**

In the line listing schemas: `schemas: \`fidly\`, \`celvoview\`, \`gym\`` — keep as `gym` for now. The schema rename happens in Phase 2. Add a note comment if needed.

- [ ] **Step 3: Verify changes are scoped**

```bash
cd /c/Users/eudes/Proyectos/Celvo
grep -n "gym\|celvogym\|CelvoGym" CLAUDE.md | head -20
```

Check that only gym-specific lines were changed. Lines about CelvoGuard, Fidly, CelvoView, etc. should be untouched.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git -C /c/Users/eudes/Proyectos/Celvo add CLAUDE.md
git -C /c/Users/eudes/Proyectos/Celvo commit -m "docs: update ecosystem CLAUDE.md for KONDIX rebrand"
```

Note: This commit is in the PARENT directory's git repo if it has one, or may need to be committed separately. If the parent directory has no `.git`, skip this step and note it for manual update.

---

## Task 16: Update other documentation files

**Files:**
- Rename: `CelvoGym-Business-Research.md` → `Kondix-Business-Research.md`
- Modify: `PRODUCT-FEATURES.md`
- Modify: `E2E-TEST-REPORT.md`
- Modify: `kondix-web/README.md`
- Modify: `kondix-web/brand-guidelines.md`
- Modify: `kondix-web/.impeccable.md`

- [ ] **Step 1: Rename business research doc**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git mv CelvoGym-Business-Research.md Kondix-Business-Research.md
sed -i 's/CelvoGym/KONDIX/g' Kondix-Business-Research.md
sed -i 's/gym\.celvo\.dev/kondix.celvo.dev/g' Kondix-Business-Research.md
```

- [ ] **Step 2: Update PRODUCT-FEATURES.md**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/CelvoGym/KONDIX/g' PRODUCT-FEATURES.md
sed -i 's/celvogym/kondix/g' PRODUCT-FEATURES.md
sed -i 's/gym\.celvo\.dev/kondix.celvo.dev/g' PRODUCT-FEATURES.md
```

- [ ] **Step 3: Update E2E-TEST-REPORT.md**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/gym\.celvo\.dev/kondix.celvo.dev/g' E2E-TEST-REPORT.md
sed -i 's/CelvoGym/KONDIX/g' E2E-TEST-REPORT.md
```

- [ ] **Step 4: Update frontend docs**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
sed -i 's/CelvoGym/KONDIX/g' kondix-web/README.md
sed -i 's/CelvoGym/KONDIX/g' kondix-web/brand-guidelines.md
sed -i 's/celvogym/kondix/g' kondix-web/brand-guidelines.md
sed -i 's/cg-/kx-/g' kondix-web/brand-guidelines.md
sed -i 's/CelvoGym/KONDIX/g' kondix-web/.impeccable.md
sed -i 's/celvogym/kondix/g' kondix-web/.impeccable.md
sed -i 's/cg-/kx-/g' kondix-web/.impeccable.md
sed -i 's/gym\.celvo\.dev/kondix.celvo.dev/g' kondix-web/.impeccable.md
```

- [ ] **Step 5: Commit**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "docs: update all documentation files for KONDIX rebrand"
```

---

## Task 17: Update memory files

**Files:**
- Rename: `~/.claude/projects/C--Users-eudes-Proyectos-Celvo-gym/memory/project_celvogym.md` → `project_kondix.md`
- Modify: `~/.claude/projects/C--Users-eudes-Proyectos-Celvo-gym/memory/MEMORY.md`

- [ ] **Step 1: Create updated memory file**

Write a new `project_kondix.md` replacing all CelvoGym references with KONDIX/Kondix:

```markdown
---
name: KONDIX product context
description: Gym app for remote personal trainers — key product decisions, feature roadmap phases, architecture changes planned
type: project
---

KONDIX (kondix.celvo.dev) is for **remote/online personal trainers** (not in-gym). Trainers manage students at distance, need visibility into progress without being present.

**Stack:** .NET 10 Clean Architecture, Angular 21 SPA, PostgreSQL schema `kondix`, CelvoGuard auth, dark theme.
**Repo:** Thebigboss537/CelvoGym (directory: /gym/). Tenancy: each trainer = 1 tenant.
**Rebranded:** from CelvoGym to KONDIX on 2026-04-13.

## Feature Roadmap (3 Phases)

**Phase 1**: WorkoutSessions, Calendar (student main screen), Suggested training days, Auto-fill sets, Trainer notes, Duplicate routine
**Phase 2**: Programs (multi-routine alternation), Trainer dashboard, Exercise library, Bulk assignment, Assignment templates
**Phase 3**: PRs, Body metrics + progress photos, Analytics, Tags/categories

## Key Product Decisions
- Programs: **multi-routine alternation** (Upper/Lower, PPL via ProgramRoutine slots)
- Transitions: **manual** by trainer
- Weeks: **calendar-fixed** (incomplete days don't carry over)
- Student history: **full access** to past programs/sessions/weights
- Calendar: **student's main screen**
- Training days: **suggested per assignment** (independent of routine)
- Auto-fill actual with target on completion

**Why:** Remote trainers need data to replace in-person observation.
**How to apply:** Prioritize logging UX speed (fewer taps), data preservation (snapshots), trainer visibility (dashboard, alerts).
```

- [ ] **Step 2: Delete old memory file**

```bash
rm ~/.claude/projects/C--Users-eudes-Proyectos-Celvo-gym/memory/project_celvogym.md
```

- [ ] **Step 3: Update MEMORY.md index**

Replace the CelvoGym line in MEMORY.md:

Old: `- [CelvoGym product context](project_celvogym.md) — Remote trainer app, feature roadmap...`
New: `- [KONDIX product context](project_kondix.md) — Remote trainer app (rebranded from CelvoGym), feature roadmap, architecture decisions`

- [ ] **Step 4: Verify memory files**

```bash
cat ~/.claude/projects/C--Users-eudes-Proyectos-Celvo-gym/memory/MEMORY.md
```

Expected: Updated index with `project_kondix.md` reference.

---

## Task 18: Final sweep and verification

- [ ] **Step 1: Search for any remaining CelvoGym/celvogym references in the repo**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
grep -ri "celvogym\|CelvoGym" --include="*.cs" --include="*.ts" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.md" --include="*.sql" --include="*.sh" --include="*.html" -l .
```

Expected: No files (or only the spec/plan docs which reference the old name for documentation purposes).

- [ ] **Step 2: Search for remaining gym.celvo.dev**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
grep -ri "gym\.celvo\.dev" --include="*.cs" --include="*.ts" --include="*.json" --include="*.yml" --include="*.md" --include="*.sql" --include="*.html" -l .
```

Expected: No files (or only spec/plan docs).

- [ ] **Step 3: Search for remaining cg- prefix in frontend**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
grep -rn "'cg-\|<cg-\|cg-manifest" kondix-web/src/ --include="*.ts" --include="*.html"
```

Expected: No output.

- [ ] **Step 4: Full backend build**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
dotnet build Kondix.slnx
```

Expected: Build succeeded.

- [ ] **Step 5: Full frontend build**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym/kondix-web
npx ng build
```

Expected: Build succeeded.

- [ ] **Step 6: Run backend tests**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
dotnet test Kondix.slnx
```

Expected: All tests pass.

- [ ] **Step 7: Fix any remaining issues and commit**

If any step above found issues, fix them and commit:

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "fix: resolve remaining rebrand references"
```

- [ ] **Step 8: Final commit — update spec status**

```bash
cd /c/Users/eudes/Proyectos/Celvo/gym
git add -A
git commit -m "chore: KONDIX rebrand Phase 1 complete"
```
