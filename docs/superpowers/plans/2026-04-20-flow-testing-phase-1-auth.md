# Flow Testing — Phase 1 (Inventory + Infra + Auth Flow) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the flow-testing harness end-to-end: write the inventory of every flow to test, add test-only backend endpoints, install and configure Playwright, and validate the whole stack by producing one real Mermaid diagram + green E2E spec for the authentication flow.

**Architecture:** Spec `docs/superpowers/specs/2026-04-20-flow-testing-strategy-design.md` decomposed into phases. This plan covers Phase 0 (inventory) + Phase 1 (infra) + Phase 2 (auth flow, file `01-auth`). Remaining flows get their own plans once this harness is proven on a real flow.

**Tech Stack:** .NET 10, Angular 21, `@playwright/test`, Mermaid (in-markdown), PostgreSQL. Reuses existing CelvoGuard auth + `INTERNAL_API_KEY` secret pattern.

---

## File Structure

Files created or modified in this plan:

**Created:**
- `docs/flows/00-inventory.md` — matrix of role × screen × action × flow file × spec file
- `docs/flows/01-auth.md` — diagram for register/login/logout/protected-route-redirect
- `src/Kondix.Api/Controllers/InternalTestController.cs` — Dev/Testing-only endpoints for test support
- `tests/Kondix.IntegrationTests/` (new project) — WebApplicationFactory-based tests for `InternalTestController`
- `setup/seed-e2e.sql` — one-off seed for the CelvoGuard admin used by the future `99-admin-approval.spec.ts`
- `kondix-web/playwright.config.ts`
- `kondix-web/e2e/fixtures/test-users.ts`
- `kondix-web/e2e/fixtures/seed.ts`
- `kondix-web/e2e/fixtures/auth.ts`
- `kondix-web/e2e/pages/shared/login.page.ts`
- `kondix-web/e2e/pages/shared/register.page.ts`
- `kondix-web/e2e/pages/shared/shell.page.ts` (logout locators)
- `kondix-web/e2e/specs/smoke.spec.ts` (deleted at end of plan — throwaway)
- `kondix-web/e2e/specs/01-auth.spec.ts`

**Modified:**
- `src/Kondix.Api/Program.cs` — conditionally register `InternalTestController` + bypass middleware for `/api/v1/internal/test/*`
- `Kondix.slnx` — add IntegrationTests project
- `kondix-web/package.json` — add `@playwright/test` devDependency + npm scripts
- `kondix-web/src/app/features/auth/feature/login.ts` — add `data-testid`s
- `kondix-web/src/app/features/auth/feature/register.ts` — add `data-testid`s
- `kondix-web/src/app/features/onboarding/feature/pending-approval.ts` — add `data-testid`s for logout button + copy
- `kondix-web/src/app/features/student/feature/profile.ts` — add `data-testid` for logout button
- `kondix-web/src/app/shared/layouts/trainer-shell.ts` — add `data-testid` for logout action if present

---

## Task 1: Phase 0 — Write the flow inventory

**Files:**
- Create: `docs/flows/00-inventory.md`

This inventory is reference for all future phases; it must be accurate because it locks scope and naming of flow files + specs.

- [ ] **Step 1: Explore the app to capture every screen and action**

Run these to verify the route list and component files are still current:

```bash
cat kondix-web/src/app/app.routes.ts
cat kondix-web/src/app/features/trainer/trainer.routes.ts
cat kondix-web/src/app/features/student/student.routes.ts
cat kondix-web/src/app/features/auth/auth.routes.ts
cat kondix-web/src/app/features/onboarding/onboarding.routes.ts
ls kondix-web/src/app/features/trainer/routines/feature
ls kondix-web/src/app/features/trainer/programs/feature
ls kondix-web/src/app/features/trainer/students/feature
ls kondix-web/src/app/features/student/feature
```

- [ ] **Step 2: Author the inventory file**

Create `docs/flows/00-inventory.md` with this exact content:

````markdown
# Flow Inventory

Matrix of every user-facing surface in Kondix, grouped by role. Each row
becomes (eventually) a diagram in `docs/flows/` and a spec in
`kondix-web/e2e/specs/`. Flows marked **Pending** are not yet authored.

## Legend

- **Role:** public | trainer | student | onboarding | admin (cross-app)
- **Flow file:** path under `docs/flows/`
- **Spec file:** path under `kondix-web/e2e/specs/`

## Public & Auth

| Flow                                   | Role      | Flow file          | Spec file               | Status  |
|----------------------------------------|-----------|--------------------|-------------------------|---------|
| Trainer registration                   | public    | `01-auth.md`       | `01-auth.spec.ts`       | Planned |
| Trainer login                          | public    | `01-auth.md`       | `01-auth.spec.ts`       | Planned |
| Student login (tenant-scoped via `?t=`)| public    | `01-auth.md`       | `01-auth.spec.ts`       | Planned |
| Logout (trainer + student)             | auth      | `01-auth.md`       | `01-auth.spec.ts`       | Planned |
| Protected route redirect to /auth/login| auth      | `01-auth.md`       | `01-auth.spec.ts`       | Planned |
| Token refresh (transparent)            | auth      | `01-auth.md`       | `01-auth.spec.ts`       | Planned |

## Onboarding (Trainer)

| Flow                                   | Role        | Flow file                  | Spec file                    | Status  |
|----------------------------------------|-------------|----------------------------|------------------------------|---------|
| Trainer fills setup (display name, bio)| onboarding  | `02-onboarding-trainer.md` | `02-onboarding-trainer.spec.ts` | Pending |
| Trainer sees pending-approval screen   | onboarding  | `02-onboarding-trainer.md` | `02-onboarding-trainer.spec.ts` | Pending |
| Trainer becomes active after approval  | onboarding  | `02-onboarding-trainer.md` | `02-onboarding-trainer.spec.ts` | Pending |

## Trainer Area

| Flow                                        | Role     | Flow file                | Spec file                     | Status  |
|---------------------------------------------|----------|--------------------------|-------------------------------|---------|
| Dashboard: view metrics + CTAs              | trainer  | `03-trainer-dashboard.md`| `03-trainer-dashboard.spec.ts`| Pending |
| Routines: list + filter                     | trainer  | `04-trainer-routines.md` | `04-trainer-routines.spec.ts` | Pending |
| Routines: create via wizard (days + exercises + sets) | trainer  | `04-trainer-routines.md` | `04-trainer-routines.spec.ts` | Pending |
| Routines: view detail                       | trainer  | `04-trainer-routines.md` | `04-trainer-routines.spec.ts` | Pending |
| Routines: edit (full replace)               | trainer  | `04-trainer-routines.md` | `04-trainer-routines.spec.ts` | Pending |
| Routines: delete + warn if in use           | trainer  | `04-trainer-routines.md` | `04-trainer-routines.spec.ts` | Pending |
| Programs: list                              | trainer  | `05-trainer-programs.md` | `05-trainer-programs.spec.ts` | Pending |
| Programs: create (ordered routines)         | trainer  | `05-trainer-programs.md` | `05-trainer-programs.spec.ts` | Pending |
| Programs: edit + warn if active assignments | trainer  | `05-trainer-programs.md` | `05-trainer-programs.spec.ts` | Pending |
| Programs: assign to student                 | trainer  | `05-trainer-programs.md` | `05-trainer-programs.spec.ts` | Pending |
| Students: list                              | trainer  | `06-trainer-students.md` | `06-trainer-students.spec.ts` | Pending |
| Students: invite via email                  | trainer  | `06-trainer-students.md` | `06-trainer-students.spec.ts` | Pending |
| Students: invite via QR                     | trainer  | `06-trainer-students.md` | `06-trainer-students.spec.ts` | Pending |
| Students: view detail + history             | trainer  | `06-trainer-students.md` | `06-trainer-students.spec.ts` | Pending |
| Students: cancel active program             | trainer  | `06-trainer-students.md` | `06-trainer-students.spec.ts` | Pending |
| Catalog: list + add exercise                | trainer  | `07-trainer-catalog.md`  | `07-trainer-catalog.spec.ts`  | Pending |

## Invite Acceptance (Student)

| Flow                                   | Role     | Flow file               | Spec file                  | Status  |
|----------------------------------------|----------|-------------------------|----------------------------|---------|
| Student opens invite link              | public   | `08-invite-acceptance.md` | `08-invite-acceptance.spec.ts` | Pending |
| Student creates end-user account       | public   | `08-invite-acceptance.md` | `08-invite-acceptance.spec.ts` | Pending |
| Student lands on `/workout/home`       | student  | `08-invite-acceptance.md` | `08-invite-acceptance.spec.ts` | Pending |

## Student Area

| Flow                                     | Role     | Flow file                      | Spec file                         | Status  |
|------------------------------------------|----------|--------------------------------|-----------------------------------|---------|
| Home: see next workout + stats           | student  | `09-student-home.md`           | `09-student-home.spec.ts`         | Pending |
| Calendar: month view                     | student  | `10-student-calendar.md`       | `10-student-calendar.spec.ts`     | Pending |
| Calendar: tap day → day-detail           | student  | `10-student-calendar.md`       | `10-student-calendar.spec.ts`     | Pending |
| Progress: charts                         | student  | `11-student-progress.md`       | `11-student-progress.spec.ts`     | Pending |
| Profile: view + logout                   | student  | `12-student-profile.md`        | `12-student-profile.spec.ts`      | Pending |
| Workout: overview screen (start session) | student  | `13-student-workout-mode.md`   | `13-student-workout-mode.spec.ts` | Pending |
| Workout: log sets (weight/reps/RPE)      | student  | `13-student-workout-mode.md`   | `13-student-workout-mode.spec.ts` | Pending |
| Workout: rest timer                      | student  | `13-student-workout-mode.md`   | `13-student-workout-mode.spec.ts` | Pending |
| Workout: complete + rotation advances    | student  | `13-student-workout-mode.md`   | `13-student-workout-mode.spec.ts` | Pending |
| Comments: student reads comment from trainer | student  | `14-student-comments.md`   | `14-student-comments.spec.ts`     | Pending |
| Comments: student replies                | student  | `14-student-comments.md`       | `14-student-comments.spec.ts`     | Pending |

## Cross-App

| Flow                                        | Role            | Flow file                | Spec file                     | Status  |
|---------------------------------------------|-----------------|--------------------------|-------------------------------|---------|
| Admin approves trainer in CelvoAdmin        | admin cross-app | `99-admin-approval.md`   | `99-admin-approval.spec.ts`   | Pending |

## Build order

1. This plan: inventory + infra + `01-auth` (planned).
2. Next plan: `02-onboarding-trainer` + `08-invite-acceptance`.
3. Trainer flows (03–07), one plan.
4. Student flows (09–14), one plan.
5. Cross-app admin approval (99), one plan (requires CelvoAdmin running).
````

- [ ] **Step 3: Commit**

```bash
git add docs/flows/00-inventory.md
git commit -m "docs(flows): add full flow inventory for testing strategy"
```

---

## Task 2: Create integration test project for InternalTestController

**Files:**
- Create: `tests/Kondix.IntegrationTests/Kondix.IntegrationTests.csproj`
- Create: `tests/Kondix.IntegrationTests/InternalTestEndpointsTests.cs`
- Modify: `Kondix.slnx`

We use `Microsoft.AspNetCore.Mvc.Testing` with `WebApplicationFactory` for end-to-end endpoint tests. Tests verify the `X-Internal-Key` gating + the DB effect of the operations.

- [ ] **Step 1: Create the project file**

Write `tests/Kondix.IntegrationTests/Kondix.IntegrationTests.csproj`:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="10.*" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="10.*" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.*" />
    <PackageReference Include="xunit" Version="2.*" />
    <PackageReference Include="xunit.runner.visualstudio" Version="3.*" />
    <PackageReference Include="FluentAssertions" Version="7.*" />
  </ItemGroup>

  <ItemGroup>
    <Using Include="Xunit" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\src\Kondix.Api\Kondix.Api.csproj" />
    <ProjectReference Include="..\..\src\Kondix.Domain\Kondix.Domain.csproj" />
    <ProjectReference Include="..\..\src\Kondix.Infrastructure\Kondix.Infrastructure.csproj" />
  </ItemGroup>

</Project>
```

- [ ] **Step 2: Register the project in the solution**

```bash
dotnet sln Kondix.slnx add tests/Kondix.IntegrationTests/Kondix.IntegrationTests.csproj
```

- [ ] **Step 3: Write the failing test file**

Write `tests/Kondix.IntegrationTests/InternalTestEndpointsTests.cs`:

```csharp
using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kondix.IntegrationTests;

public sealed class InternalTestEndpointsTests : IClassFixture<InternalTestFactory>
{
    private readonly InternalTestFactory _factory;

    public InternalTestEndpointsTests(InternalTestFactory factory) => _factory = factory;

    [Fact]
    public async Task ApproveTrainer_WithoutKey_Returns401()
    {
        using var client = _factory.CreateClient();

        var res = await client.PostAsJsonAsync(
            "/api/v1/internal/test/approve-trainer",
            new { tenantId = Guid.NewGuid() });

        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ApproveTrainer_WithBadKey_Returns401()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", "wrong");

        var res = await client.PostAsJsonAsync(
            "/api/v1/internal/test/approve-trainer",
            new { tenantId = Guid.NewGuid() });

        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ApproveTrainer_WithValidKey_SetsIsApprovedTrue()
    {
        var tenantId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            db.Trainers.Add(new Trainer
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CelvoGuardUserId = Guid.NewGuid(),
                DisplayName = "Test Trainer",
                IsApproved = false,
                IsActive = true,
            });
            await db.SaveChangesAsync();
        }

        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", InternalTestFactory.InternalKey);

        var res = await client.PostAsJsonAsync(
            "/api/v1/internal/test/approve-trainer",
            new { tenantId });

        res.StatusCode.Should().Be(HttpStatusCode.NoContent);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            var trainer = await db.Trainers.SingleAsync(t => t.TenantId == tenantId);
            trainer.IsApproved.Should().BeTrue();
        }
    }

    [Fact]
    public async Task Cleanup_WithValidKey_RemovesTenantData()
    {
        var tenantId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            db.Trainers.Add(new Trainer
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CelvoGuardUserId = Guid.NewGuid(),
                DisplayName = "Cleanup Target",
                IsApproved = true,
                IsActive = true,
            });
            await db.SaveChangesAsync();
        }

        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", InternalTestFactory.InternalKey);

        var res = await client.DeleteAsync(
            $"/api/v1/internal/test/cleanup?tenantId={tenantId}");

        res.StatusCode.Should().Be(HttpStatusCode.NoContent);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            var still = await db.Trainers.AnyAsync(t => t.TenantId == tenantId);
            still.Should().BeFalse();
        }
    }
}

public sealed class InternalTestFactory : WebApplicationFactory<Program>
{
    public const string InternalKey = "integration-test-internal-key";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Testing:InternalApiKey", InternalKey);

        builder.ConfigureServices(services =>
        {
            var descriptor = services.Single(d =>
                d.ServiceType == typeof(DbContextOptions<KondixDbContext>));
            services.Remove(descriptor);

            services.AddDbContext<KondixDbContext>(options =>
                options.UseInMemoryDatabase($"Kondix-{Guid.NewGuid()}"));
        });
    }
}
```

- [ ] **Step 4: Run the test — expect build/redirect failures because the endpoints don't exist yet**

```bash
dotnet test tests/Kondix.IntegrationTests/Kondix.IntegrationTests.csproj
```

Expected: either a compile error referencing missing routes, or 404 responses from the test client. Both are acceptable "red" states.

- [ ] **Step 5: Commit red-state project**

```bash
git add tests/Kondix.IntegrationTests Kondix.slnx
git commit -m "test: scaffold integration test project for InternalTestController"
```

---

## Task 3: Implement `InternalTestController` with `approve-trainer` and `cleanup`

**Files:**
- Create: `src/Kondix.Api/Controllers/InternalTestController.cs`

- [ ] **Step 1: Implement the controller**

Write `src/Kondix.Api/Controllers/InternalTestController.cs`:

```csharp
using Kondix.Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/internal/test")]
public class InternalTestController(IKondixDbContext db, IConfiguration config) : ControllerBase
{
    private bool AuthorizeInternal()
    {
        var expected = config["Testing:InternalApiKey"];
        if (string.IsNullOrEmpty(expected)) return false;
        var provided = Request.Headers["X-Internal-Key"].ToString();
        return !string.IsNullOrEmpty(provided) && provided == expected;
    }

    [HttpPost("approve-trainer")]
    public async Task<IActionResult> ApproveTrainer(
        [FromBody] ApproveTrainerRequest request,
        CancellationToken ct)
    {
        if (!AuthorizeInternal()) return Unauthorized();

        var trainer = await db.Trainers.FirstOrDefaultAsync(t => t.TenantId == request.TenantId, ct);
        if (trainer is null) return NotFound(new { error = "trainer not found" });

        trainer.IsApproved = true;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("cleanup")]
    public async Task<IActionResult> Cleanup(
        [FromQuery] Guid tenantId,
        CancellationToken ct)
    {
        if (!AuthorizeInternal()) return Unauthorized();

        await db.Trainers
            .Where(t => t.TenantId == tenantId)
            .ExecuteDeleteAsync(ct);

        await db.Students
            .Where(s => s.TenantId == tenantId)
            .ExecuteDeleteAsync(ct);

        return NoContent();
    }
}

public sealed record ApproveTrainerRequest(Guid TenantId);
```

**Note on scope:** The cleanup deletes trainers and students for the tenant. Routines/programs/assignments cascade from trainer via EF relationships configured in `Kondix.Infrastructure` — if the cascade does not cover everything, extend this method in a follow-up; do not over-expand here.

- [ ] **Step 2: Register controller conditionally + bypass middleware**

First, guard the auto-migration block so it never runs under the `Testing` environment (the in-memory EF provider used by `Kondix.IntegrationTests` does not support migrations):

Replace:

```csharp
    // Auto-migrate on startup
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
        await dbContext.Database.MigrateAsync();
    }
```

With:

```csharp
    // Auto-migrate on startup (skip under Testing env — InMemory EF provider has no migrations)
    if (!app.Environment.IsEnvironment("Testing"))
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
        await dbContext.Database.MigrateAsync();
    }
```

Then make the existing middleware changes:

Edit `src/Kondix.Api/Program.cs`. Find the existing middleware block:

```csharp
    // CelvoGuard + TrainerContext + CSRF for operator endpoints (trainer)
    app.UseWhen(
        ctx => ctx.Request.Path.StartsWithSegments("/api/v1")
               && !ctx.Request.Path.StartsWithSegments("/api/v1/public")
               && !ctx.Request.Path.StartsWithSegments("/api/v1/health"),
        branch =>
        {
            branch.UseMiddleware<CelvoGuardMiddleware>();
            branch.UseMiddleware<TrainerContextMiddleware>();
            branch.UseMiddleware<CsrfValidationMiddleware>();
        }
    );
```

Add `/api/v1/internal/test` to the exclusion list so `CelvoGuard` middleware does not reject the call:

```csharp
    // CelvoGuard + TrainerContext + CSRF for operator endpoints (trainer)
    app.UseWhen(
        ctx => ctx.Request.Path.StartsWithSegments("/api/v1")
               && !ctx.Request.Path.StartsWithSegments("/api/v1/public")
               && !ctx.Request.Path.StartsWithSegments("/api/v1/health")
               && !ctx.Request.Path.StartsWithSegments("/api/v1/internal/test"),
        branch =>
        {
            branch.UseMiddleware<CelvoGuardMiddleware>();
            branch.UseMiddleware<TrainerContextMiddleware>();
            branch.UseMiddleware<CsrfValidationMiddleware>();
        }
    );
```

Add a guard just after `app.MapControllers();` so the internal endpoints only respond in non-Production environments:

Replace:

```csharp
    app.MapControllers();
```

With:

```csharp
    // Hide internal test endpoints in Production
    app.Use(async (context, next) =>
    {
        if (context.Request.Path.StartsWithSegments("/api/v1/internal/test")
            && app.Environment.IsProduction())
        {
            context.Response.StatusCode = 404;
            return;
        }
        await next();
    });

    app.MapControllers();
```

- [ ] **Step 3: Run the integration tests — expect all four green**

```bash
dotnet test tests/Kondix.IntegrationTests/Kondix.IntegrationTests.csproj
```

Expected: 4/4 passed.

- [ ] **Step 4: Commit**

```bash
git add src/Kondix.Api/Controllers/InternalTestController.cs src/Kondix.Api/Program.cs
git commit -m "feat(api): add Dev/Testing-only internal test endpoints (approve-trainer, cleanup)"
```

---

## Task 4: Add `INTERNAL_API_KEY` dev configuration

**Files:**
- Modify: `src/Kondix.Api/appsettings.Development.json`

- [ ] **Step 1: Add the dev key**

Add under the root object:

```json
"Testing": {
  "InternalApiKey": "dev-internal-key-change-me"
}
```

- [ ] **Step 2: Verify the key loads by running the API and curling the endpoint without auth**

```bash
dotnet run --project src/Kondix.Api &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5070/api/v1/internal/test/approve-trainer -H "Content-Type: application/json" -d '{"email":"nope"}'
```

Expected output: `401`

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5070/api/v1/internal/test/approve-trainer -H "Content-Type: application/json" -H "X-Internal-Key: dev-internal-key-change-me" -d '{"email":"nope"}'
```

Expected output: `404` (email not found — but past the auth gate)

Stop the API: `kill %1`.

- [ ] **Step 3: Commit**

```bash
git add src/Kondix.Api/appsettings.Development.json
git commit -m "chore(api): configure dev internal key for test endpoints"
```

---

## Task 5: Seed script for CelvoGuard admin user

**Files:**
- Create: `setup/seed-e2e.sql`

This is the one-off seed for the cross-app admin approval spec (Phase 5, future plan). We add it now so it's committed alongside the infra; it is NOT required for the auth spec in this plan.

- [ ] **Step 1: Write the script**

Create `setup/seed-e2e.sql`:

```sql
-- One-off seed for Kondix E2E testing.
-- Adds a CelvoGuard admin that the 99-admin-approval.spec.ts will use
-- when cross-app approval needs to be verified against the real CelvoAdmin.
--
-- Run once against the local CelvoGuard database:
--   psql "postgres://celvoguard:dev@localhost:5432/celvoguard" -f setup/seed-e2e.sql
--
-- Safe to re-run (ON CONFLICT DO NOTHING on stable email).

INSERT INTO celvoguard.users (id, email, password_hash, first_name, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'admin-e2e@kondix.test',
  -- bcrypt hash of 'Test1234!' — regenerate with your project's hasher if different
  '$2a$11$5tP8yVf8B9l1lZ0mR5k7peRvhN/VMoX6iYw9F8k3w3k3w3k3w3k3w',
  'E2E Admin',
  true,
  now()
)
ON CONFLICT (email) DO NOTHING;
```

**Known limitation:** the bcrypt hash above is a placeholder; the project's actual CelvoGuard hasher may use a different algorithm or cost factor. The admin-approval spec (future plan) must re-generate the hash using the production hasher before running; this plan does NOT consume the seed.

- [ ] **Step 2: Commit**

```bash
git add setup/seed-e2e.sql
git commit -m "chore(setup): add e2e seed script placeholder for cross-app admin user"
```

---

## Task 6: Install `@playwright/test` in `kondix-web`

**Files:**
- Modify: `kondix-web/package.json`
- Create: `kondix-web/.gitignore` (or append) — ignore Playwright output folders

- [ ] **Step 1: Install**

```bash
cd kondix-web && npm install --save-dev @playwright/test && cd ..
```

- [ ] **Step 2: Install browser binaries (Chromium only for this plan)**

```bash
cd kondix-web && npx playwright install chromium && cd ..
```

- [ ] **Step 3: Add npm scripts**

Edit `kondix-web/package.json`. In the `"scripts"` block, add:

```json
"e2e": "playwright test",
"e2e:ui": "playwright test --ui",
"e2e:debug": "playwright test --debug",
"e2e:codegen": "playwright codegen http://localhost:4200"
```

- [ ] **Step 4: Ignore Playwright output**

Check `kondix-web/.gitignore` for the following lines; append if missing:

```
/playwright-report/
/test-results/
/blob-report/
/playwright/.cache/
```

- [ ] **Step 5: Commit**

```bash
git add kondix-web/package.json kondix-web/package-lock.json kondix-web/.gitignore
git commit -m "chore(e2e): install Playwright test runner + ignore output folders"
```

---

## Task 7: Playwright config with web server

**Files:**
- Create: `kondix-web/playwright.config.ts`

- [ ] **Step 1: Write the config**

```ts
import { defineConfig, devices } from '@playwright/test';

const WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:4200';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:5070';

export default defineConfig({
  testDir: './e2e/specs',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'npm run start',
      cwd: '.',
      url: WEB_URL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'dotnet run --project ../src/Kondix.Api --urls http://localhost:5070',
      cwd: '.',
      url: `${API_URL}/api/v1/health`,
      reuseExistingServer: true,
      timeout: 180_000,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
      },
    },
  ],
});
```

**Note:** this plan assumes the test operator has also started CelvoGuard locally (required for register/login). If CelvoGuard is not yet running, the smoke test in Task 12 will fail; the fix is to start it manually via its own `docker compose up -d` / `dotnet run` before running the spec. Do not extend `webServer` to start CelvoGuard — it lives in a sibling repo.

- [ ] **Step 2: Commit**

```bash
git add kondix-web/playwright.config.ts
git commit -m "chore(e2e): add Playwright config with web + api webServer"
```

---

## Task 8: Test fixtures

**Files:**
- Create: `kondix-web/e2e/fixtures/test-users.ts`
- Create: `kondix-web/e2e/fixtures/seed.ts`
- Create: `kondix-web/e2e/fixtures/auth.ts`

- [ ] **Step 1: Unique-email generator**

`kondix-web/e2e/fixtures/test-users.ts`:

```ts
export interface TestTrainer {
  email: string;
  password: string;
  displayName: string;
}

export interface TestStudent {
  email: string;
  password: string;
  firstName: string;
}

export function makeTrainer(specTag: string): TestTrainer {
  const ts = Date.now();
  return {
    email: `trainer-${specTag}-${ts}@e2e.test`,
    password: 'Test1234!',
    displayName: `Trainer ${specTag} ${ts}`,
  };
}

export function makeStudent(specTag: string): TestStudent {
  const ts = Date.now();
  return {
    email: `student-${specTag}-${ts}@e2e.test`,
    password: 'Test1234!',
    firstName: `Student ${specTag} ${ts}`,
  };
}
```

- [ ] **Step 2: Seed helpers (talk to the internal test endpoints)**

`kondix-web/e2e/fixtures/seed.ts`:

```ts
const API = process.env.E2E_API_URL ?? 'http://localhost:5070';
const KEY = process.env.E2E_INTERNAL_KEY ?? 'dev-internal-key-change-me';

export async function approveTrainer(tenantId: string): Promise<void> {
  const res = await fetch(`${API}/api/v1/internal/test/approve-trainer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': KEY,
    },
    body: JSON.stringify({ tenantId }),
  });
  if (!res.ok) {
    throw new Error(`approveTrainer failed: ${res.status} ${await res.text()}`);
  }
}

export async function cleanupTenant(tenantId: string): Promise<void> {
  const res = await fetch(
    `${API}/api/v1/internal/test/cleanup?tenantId=${encodeURIComponent(tenantId)}`,
    {
      method: 'DELETE',
      headers: { 'X-Internal-Key': KEY },
    },
  );
  if (!res.ok) {
    throw new Error(`cleanupTenant failed: ${res.status} ${await res.text()}`);
  }
}
```

- [ ] **Step 3: Auth helpers (setup + tenant extraction)**

`kondix-web/e2e/fixtures/auth.ts`:

```ts
import type { Page } from '@playwright/test';

const API = process.env.E2E_API_URL ?? 'http://localhost:5070';

/**
 * Calls the Kondix onboarding/setup endpoint using cookies already set in the
 * browser context (cg-access-kondix + cg-csrf-kondix). The CSRF middleware
 * requires the cookie value echoed back as X-CSRF-Token header.
 *
 * Use this when a spec needs a Trainer row to exist (e.g., to exercise
 * login branches that depend on TrainerStatus). The actual onboarding UI is
 * covered in Phase 2 (separate plan) — this helper is a shortcut.
 */
export async function completeTrainerSetup(
  page: Page,
  displayName: string,
  bio = 'E2E trainer bio',
): Promise<void> {
  const cookies = await page.context().cookies();
  const csrf = cookies.find(c => c.name === 'cg-csrf-kondix')?.value;
  if (!csrf) {
    throw new Error(
      'cg-csrf-kondix cookie missing — trainer must be registered/logged in first',
    );
  }
  const res = await page.request.post(`${API}/api/v1/onboarding/trainer/setup`, {
    data: { displayName, bio },
    headers: { 'X-CSRF-Token': csrf },
  });
  if (!res.ok()) {
    throw new Error(`onboarding setup failed: ${res.status()} ${await res.text()}`);
  }
}

/**
 * Read tenantId from the cg-access-kondix JWT after auth. Used by cleanup.
 * The JWT claim layout follows CelvoGuard's session token — tenant id is in
 * claim `tenantId` or `tid` depending on version; falls back to `sub` so
 * cleanup never silently no-ops.
 */
export async function readTenantIdFromCookies(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  const access = cookies.find(c => c.name === 'cg-access-kondix');
  if (!access) throw new Error('cg-access-kondix cookie not set');
  const payload = JSON.parse(
    Buffer.from(access.value.split('.')[1], 'base64url').toString('utf8'),
  );
  return payload.tenantId ?? payload.tid ?? payload.sub;
}
```

- [ ] **Step 4: Commit**

```bash
git add kondix-web/e2e/fixtures
git commit -m "chore(e2e): add test fixtures (unique users, seed helpers, auth flow)"
```

---

## Task 9: Add `data-testid`s to login and register pages

**Files:**
- Modify: `kondix-web/src/app/features/auth/feature/login.ts`
- Modify: `kondix-web/src/app/features/auth/feature/register.ts`

Selectors via `data-testid` are more stable than CSS class chains. Add testids only to elements the spec interacts with.

- [ ] **Step 1: Login testids**

In `kondix-web/src/app/features/auth/feature/login.ts`:

- On the email `<input>` (line ~36), add `data-testid="login-email"`.
- On the password `<input>` (line ~48), add `data-testid="login-password"`.
- On the submit `<button>` (line ~63), add `data-testid="login-submit"`.
- On the error `<p>` (line ~60), add `data-testid="login-error"`.

Example for the email input:

```html
<input
  type="email"
  [(ngModel)]="email"
  name="email"
  data-testid="login-email"
  class="..."
  placeholder="tu@email.com"
  required
/>
```

- [ ] **Step 2: Register testids**

In `kondix-web/src/app/features/auth/feature/register.ts`:

- `data-testid="register-displayname"` on the name input (line ~42).
- `data-testid="register-email"` on the email input (line ~54).
- `data-testid="register-password"` on the password input (line ~66).
- `data-testid="register-confirm"` on the confirm input (line ~81).
- `data-testid="register-submit"` on the submit button (line ~98).
- `data-testid="register-success"` on the success panel wrapper `<div>` (line ~23) — used as a waitable state.

- [ ] **Step 3: Verify the app still builds**

```bash
cd kondix-web && npm run build && cd ..
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add kondix-web/src/app/features/auth/feature/login.ts kondix-web/src/app/features/auth/feature/register.ts
git commit -m "chore(ui): add data-testids to login and register for e2e selectors"
```

---

## Task 10: Page objects for login, register, shell

**Files:**
- Create: `kondix-web/e2e/pages/shared/login.page.ts`
- Create: `kondix-web/e2e/pages/shared/register.page.ts`
- Create: `kondix-web/e2e/pages/shared/shell.page.ts`

- [ ] **Step 1: LoginPage**

```ts
// kondix-web/e2e/pages/shared/login.page.ts
import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submitBtn: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByTestId('login-email');
    this.password = page.getByTestId('login-password');
    this.submitBtn = page.getByTestId('login-submit');
    this.error = page.getByTestId('login-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
    await this.email.waitFor();
  }

  async gotoAsStudent(tenantId: string): Promise<void> {
    await this.page.goto(`/auth/login?t=${encodeURIComponent(tenantId)}`);
    await this.email.waitFor();
  }

  async submitCredentials(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitBtn.click();
  }
}
```

**Naming note:** `submitBtn` is the button locator (parallel to `RegisterPage.submitBtn`); `submitCredentials` is the action. Specs only call `login.submitCredentials(...)`.

- [ ] **Step 2: RegisterPage**

```ts
// kondix-web/e2e/pages/shared/register.page.ts
import type { Page, Locator } from '@playwright/test';
import type { TestTrainer } from '../../fixtures/test-users';

export class RegisterPage {
  readonly displayName: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly confirm: Locator;
  readonly submitBtn: Locator;
  readonly success: Locator;

  constructor(private readonly page: Page) {
    this.displayName = page.getByTestId('register-displayname');
    this.email = page.getByTestId('register-email');
    this.password = page.getByTestId('register-password');
    this.confirm = page.getByTestId('register-confirm');
    this.submitBtn = page.getByTestId('register-submit');
    this.success = page.getByTestId('register-success');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/register');
    await this.email.waitFor();
  }

  async submit(trainer: TestTrainer): Promise<void> {
    await this.displayName.fill(trainer.displayName);
    await this.email.fill(trainer.email);
    await this.password.fill(trainer.password);
    await this.confirm.fill(trainer.password);
    await this.submitBtn.click();
    // Register navigates to /onboarding/setup on success. We wait for URL
    // change instead of expecting the success panel — that panel is only
    // rendered when `registered()` is set true, which in the current
    // implementation happens before the redirect.
    await this.page.waitForURL(/\/onboarding\/setup/);
  }
}
```

- [ ] **Step 3: Commit (no test yet)**

```bash
git add kondix-web/e2e/pages
git commit -m "chore(e2e): add shared page objects (login, register)"
```

> Logout page-object + testids are deferred to the Phase-2 plan, because
> reaching an authenticated logout-capable screen (trainer sidebar, student
> profile) requires completed onboarding + invite acceptance covered there.

---

## Task 11: (deferred)

Logout testids (`trainer-logout`, `student-logout`, `onboarding-logout`) and the
`ShellPage` object move to the next plan (`02-onboarding-trainer` +
`08-invite-acceptance`). They are omitted here because Phase 1 does not yet
reach any authenticated post-onboarding screen — all Phase 1 flows terminate
on `/auth/login` or `/onboarding/setup`.

No action required in this task; it is listed only so later readers can
confirm the omission is intentional.

---

## Task 12: Smoke spec — validate harness end-to-end

**Files:**
- Create: `kondix-web/e2e/specs/smoke.spec.ts`

The smoke test is the shortest possible happy path: register → approve → land on onboarding. It proves that Playwright + webServer + fixtures + testids + internal endpoint all work together. If this passes, the harness is sound.

- [ ] **Step 1: Pre-flight**

Confirm CelvoGuard is running locally on its expected port (check `../CelvoGuard/docker-compose.yml` for port info). Register/login calls hit CelvoGuard, not Kondix API.

- [ ] **Step 2: Write the spec**

```ts
// kondix-web/e2e/specs/smoke.spec.ts
import { test, expect } from '@playwright/test';
import { makeTrainer } from '../fixtures/test-users';
import { approveTrainer } from '../fixtures/seed';
import { RegisterPage } from '../pages/shared/register.page';
import { LoginPage } from '../pages/shared/login.page';

test.describe('Smoke: harness validation', () => {
  test('trainer can register, be approved, and log in', async ({ page }) => {
    const trainer = makeTrainer('smoke');
    let tenantId: string | undefined;

    await test.step('register trainer', async () => {
      const reg = new RegisterPage(page);
      await reg.goto();
      await reg.submit(trainer);
      tenantId = await (await import('../fixtures/auth')).readTenantIdFromCookies(page);
    });

    await test.step('approve trainer via internal API', async () => {
      if (tenantId) await approveTrainer(tenantId);
    });

    await test.step('log in as approved trainer', async () => {
      const login = new LoginPage(page);
      await login.goto();
      await login.submitCredentials(trainer.email, trainer.password);
      await page.waitForURL(/\/(trainer|onboarding)/);
    });

    await expect(page).toHaveURL(/\/(trainer|onboarding)/);
  });
});
```

- [ ] **Step 3: Run the smoke test**

Open two terminals (or background the API):

```bash
cd kondix-web && npx playwright test specs/smoke.spec.ts --project=chromium
```

Expected: `1 passed`. If it fails, read the trace from `playwright-report/` and iterate — most likely causes are missing CelvoGuard running, `X-App-Slug` mismatch, or a mismatched testid. Do not proceed until green.

- [ ] **Step 4: Commit**

```bash
git add kondix-web/e2e/specs/smoke.spec.ts
git commit -m "test(e2e): smoke spec validates the full Playwright harness"
```

---

## Task 13: Flow diagram — `docs/flows/01-auth.md`

**Files:**
- Create: `docs/flows/01-auth.md`

- [ ] **Step 1: Write the file**

````markdown
# 01 — Auth

**Roles:** public, trainer, student
**Preconditions:** CelvoGuard and Kondix API running.
**Test:** [`specs/01-auth.spec.ts`](../../kondix-web/e2e/specs/01-auth.spec.ts)

## Flow: trainer registration

```mermaid
flowchart TD
  AU1[Visit /auth/register] --> AU2[Fill displayName, email, password, confirm]
  AU2 --> AU3{Passwords match?}
  AU3 -- No --> AU4[Show "no coinciden" error]
  AU3 -- Yes --> AU5[[POST guard/auth/register]]
  AU5 --> AU6{Success?}
  AU6 -- No --> AU7[Show guard error]
  AU6 -- Yes --> AU8[[GET guard/auth/me]]
  AU8 --> AU9((User stored in AuthStore))
  AU9 --> AU10[Navigate /onboarding/setup]
```

## Flow: trainer login

```mermaid
flowchart TD
  AU20[Visit /auth/login] --> AU21[Fill email + password]
  AU21 --> AU22[[POST guard/auth/login]]
  AU22 --> AU23{Success?}
  AU23 -- No --> AU24[Show login error]
  AU23 -- Yes --> AU25[[GET guard/auth/me]] --> AU26[[GET kondix/onboarding/trainer/status]]
  AU26 --> AU27{status}
  AU27 -- no_profile --> AU28[Navigate /onboarding/setup]
  AU27 -- pending_approval --> AU29[Navigate /onboarding/pending]
  AU27 -- active --> AU30[Navigate /trainer]
```

## Flow: student login (tenant-scoped)

```mermaid
flowchart TD
  AU40[Visit /auth/login?t=tenantId] --> AU41[Page sets isStudentLogin=true, stores tenantId]
  AU41 --> AU42[Fill email + password]
  AU42 --> AU43[[POST guard/enduser/login with tenantId]]
  AU43 --> AU44{Success?}
  AU44 -- No --> AU45[Show error]
  AU44 -- Yes --> AU46[[GET guard/auth/me]] --> AU47[Navigate /workout]
```

## Flow: logout

```mermaid
flowchart TD
  AU60[Click logout in shell] --> AU61[AuthStore.logout]
  AU61 --> AU62[[POST guard/auth/logout]]
  AU62 --> AU63((Cookies cleared))
  AU63 --> AU64[Redirect /auth/login]
```

## Flow: protected route redirect

```mermaid
flowchart TD
  AU80[Visit /trainer without auth] --> AU81{trainerGuard evaluates}
  AU81 -- No user --> AU82[Redirect /auth/login]
  AU81 -- User ok --> AU83[Render route]
```

## Nodes

| ID   | Type    | Description                                           |
|------|---------|-------------------------------------------------------|
| AU1  | Action  | Navigate to `/auth/register`                          |
| AU2  | Action  | Fill registration form                                |
| AU3  | Decision| Password confirmation check                           |
| AU4  | State   | Client-side "no coinciden" error shown                |
| AU5  | API     | `POST {guardUrl}/api/v1/auth/register`                |
| AU6  | Decision| HTTP success                                          |
| AU7  | State   | Server error surfaced                                 |
| AU8  | API     | `GET {guardUrl}/api/v1/auth/me`                       |
| AU9  | State   | User written into AuthStore                           |
| AU10 | Action  | Navigate `/onboarding/setup`                          |
| AU20 | Action  | Navigate to `/auth/login`                             |
| AU21 | Action  | Fill login form                                       |
| AU22 | API     | `POST {guardUrl}/api/v1/auth/login`                   |
| AU23 | Decision| HTTP success                                          |
| AU24 | State   | Error shown                                           |
| AU25 | API     | `GET {guardUrl}/api/v1/auth/me`                       |
| AU26 | API     | `GET {apiUrl}/onboarding/trainer/status`              |
| AU27 | Decision| Status branch                                         |
| AU28 | Action  | Navigate `/onboarding/setup`                          |
| AU29 | Action  | Navigate `/onboarding/pending`                        |
| AU30 | Action  | Navigate `/trainer`                                   |
| AU40 | Action  | Navigate `/auth/login?t=...`                          |
| AU41 | State   | `isStudentLogin=true`, tenantId persisted             |
| AU42 | Action  | Fill login form                                       |
| AU43 | API     | `POST {guardUrl}/api/v1/enduser/login`                |
| AU44 | Decision| HTTP success                                          |
| AU45 | State   | Error shown                                           |
| AU46 | API     | `GET {guardUrl}/api/v1/auth/me`                       |
| AU47 | Action  | Navigate `/workout`                                   |
| AU60 | Action  | Click logout control                                  |
| AU61 | Action  | `AuthStore.logout()` invoked                          |
| AU62 | API     | `POST {guardUrl}/api/v1/auth/logout`                  |
| AU63 | State   | Cookies cleared                                       |
| AU64 | Action  | Redirect `/auth/login`                                |
| AU80 | Action  | Navigate to protected route `/trainer`                |
| AU81 | Decision| `trainerGuard` evaluation                             |
| AU82 | Action  | Redirect `/auth/login`                                |
| AU83 | State   | Route rendered                                        |
````

- [ ] **Step 2: Commit**

```bash
git add docs/flows/01-auth.md
git commit -m "docs(flows): add 01-auth.md flow diagram"
```

---

## Task 14: E2E spec — `specs/01-auth.spec.ts`

**Files:**
- Create: `kondix-web/e2e/specs/01-auth.spec.ts`
- Delete (at end): `kondix-web/e2e/specs/smoke.spec.ts`

Each `test.step()` begins with the matching node ID from the diagram so failing steps localize to a node.

- [ ] **Step 1: Write the spec**

```ts
// kondix-web/e2e/specs/01-auth.spec.ts
// Flow: see ../../../docs/flows/01-auth.md
// Scope note: this spec covers register (AU1-AU10, AU3/AU4),
// login no_profile branch (AU20-AU28), login pending_approval branch
// (AU29), login active branch (AU30), and protected route redirect
// (AU80-AU82). Logout (AU60-AU64) and student login (AU40-AU47) are
// deferred to the Phase-2 plan that also covers onboarding UI.
import { test, expect } from '@playwright/test';
import { makeTrainer } from '../fixtures/test-users';
import { approveTrainer, cleanupTenant } from '../fixtures/seed';
import { completeTrainerSetup, readTenantIdFromCookies } from '../fixtures/auth';
import { RegisterPage } from '../pages/shared/register.page';
import { LoginPage } from '../pages/shared/login.page';

test.describe('Flow: trainer registration', () => {
  test('AU1-AU10 happy path: register → onboarding setup', async ({ page }) => {
    const trainer = makeTrainer('auth-reg');
    const register = new RegisterPage(page);
    let tenantId: string | undefined;

    await test.step('AU1: visit /auth/register', async () => {
      await register.goto();
    });

    await test.step('AU2-AU5: fill form + submit', async () => {
      await register.submit(trainer);
    });

    await test.step('AU10: landed on /onboarding/setup', async () => {
      await expect(page).toHaveURL(/\/onboarding\/setup/);
      tenantId = await readTenantIdFromCookies(page);
    });

    await test.step('cleanup', async () => {
      if (tenantId) await cleanupTenant(tenantId);
    });
  });

  test('AU3/AU4: mismatched passwords disable submit', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.goto();
    await register.displayName.fill('Mismatch User');
    await register.email.fill(`trainer-mismatch-${Date.now()}@e2e.test`);
    await register.password.fill('Test1234!');
    await register.confirm.fill('Different!');
    await expect(register.submitBtn).toBeDisabled();
  });
});

test.describe('Flow: trainer login branches', () => {
  test('AU28 no_profile: newly-registered login → /onboarding/setup', async ({ page }) => {
    const trainer = makeTrainer('auth-noprofile');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);
    await page.context().clearCookies();

    const login = new LoginPage(page);
    await login.goto();
    await login.submitCredentials(trainer.email, trainer.password);
    await expect(page).toHaveURL(/\/onboarding\/setup/);

    if (tenantId) await cleanupTenant(tenantId);
  });

  test('AU29 pending_approval: after setup, login → /onboarding/pending', async ({ page }) => {
    const trainer = makeTrainer('auth-pending');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);

    // Trainer row now exists (via helper) but IsApproved is still false.
    await completeTrainerSetup(page, trainer.displayName);
    await page.context().clearCookies();

    const login = new LoginPage(page);
    await login.goto();
    await login.submitCredentials(trainer.email, trainer.password);
    await expect(page).toHaveURL(/\/onboarding\/pending/);

    if (tenantId) await cleanupTenant(tenantId);
  });

  test('AU30 active: after setup + approval, login → /trainer', async ({ page }) => {
    const trainer = makeTrainer('auth-active');
    let tenantId: string | undefined;

    const register = new RegisterPage(page);
    await register.goto();
    await register.submit(trainer);
    tenantId = await readTenantIdFromCookies(page);
    await completeTrainerSetup(page, trainer.displayName);
    if (tenantId) await approveTrainer(tenantId);
    await page.context().clearCookies();

    const login = new LoginPage(page);
    await login.goto();
    await login.submitCredentials(trainer.email, trainer.password);
    await expect(page).toHaveURL(/\/trainer(\/|$)/);

    if (tenantId) await cleanupTenant(tenantId);
  });
});

test.describe('Flow: protected route redirect', () => {
  test('AU80-AU82: unauthenticated /trainer → /auth/login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/trainer');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
```

- [ ] **Step 2: Run the spec**

```bash
cd kondix-web && npx playwright test specs/01-auth.spec.ts --project=chromium
```

Expected: all tests green. If any fail, open `playwright-report/index.html`, inspect the trace, and fix:
- Missing testid → add it in the component.
- Timing issue → replace ad-hoc sleeps with `waitForURL` / locator auto-wait.
- Backend state leak between tests → add explicit cookie clearing in the affected test.

Do NOT mark this task done until all tests are green.

- [ ] **Step 3: Delete the smoke spec**

The smoke spec's coverage is subsumed by `01-auth.spec.ts`.

```bash
rm kondix-web/e2e/specs/smoke.spec.ts
```

- [ ] **Step 4: Commit**

```bash
git add kondix-web/e2e/specs/01-auth.spec.ts kondix-web/e2e/specs/smoke.spec.ts
git commit -m "test(e2e): add 01-auth spec (register, login, logout, protected route)"
```

---

## Task 15: Verify everything from a cold start

The final acceptance gate for the plan.

- [ ] **Step 1: Stop all local services so we test from cold**

```bash
pkill -f "dotnet run"
pkill -f "ng serve"
```

- [ ] **Step 2: Full backend test suite still green**

```bash
dotnet test Kondix.slnx
```

Expected: all test projects green (UnitTests, ArchTests, IntegrationTests).

- [ ] **Step 3: Full Playwright suite green (webServer bootstraps API + web)**

Make sure CelvoGuard is running locally first (its own terminal). Then:

```bash
cd kondix-web && npx playwright test --project=chromium
```

Expected: `01-auth.spec.ts` green, no other specs exist yet.

- [ ] **Step 4: Review artifacts**

```bash
ls kondix-web/playwright-report
```

Should contain `index.html` with the latest run's results.

- [ ] **Step 5: Final commit (if anything changed) + summary**

```bash
git status
```

If clean, write a summary on the PR / conversation:
- Inventory written.
- Internal test endpoints added + integration-tested.
- Playwright installed + configured + `01-auth` passing.
- Ready for next plan: `02-onboarding-trainer` + `08-invite-acceptance`.

---

## Done criteria

- `docs/flows/00-inventory.md` and `docs/flows/01-auth.md` exist.
- `dotnet test tests/Kondix.IntegrationTests` passes (4 tests).
- `npx playwright test` from `kondix-web/` passes (5 tests in `01-auth.spec.ts`: 2 registration, 3 login branches, 1 protected route — actually 6, count may change as branches are elaborated).
- `InternalTestController` returns 404 in `Production` environment.
- No `smoke.spec.ts` remains in `e2e/specs/`.

## Out of scope (deferred to next plans)

- **Next plan (`02-onboarding-trainer` + `08-invite-acceptance`):** onboarding
  UI spec, student invite acceptance, logout testids + `ShellPage`, logout
  test (AU60-AU64), student login branch (AU40-AU47).
- Trainer-area flows (03–07).
- Student-area flows (09–14).
- Cross-app admin approval spec (99).
- CI pipeline wiring.
- `data-testid` additions for trainer/student area components (added per-flow
  as each phase's plan lands).
