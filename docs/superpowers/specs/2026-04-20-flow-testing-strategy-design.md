# Flow Testing Strategy — Design

**Date:** 2026-04-20
**Status:** Draft pending user review
**Author:** Claude + eudesdavid29@gmail.com

## Purpose

Establish a durable strategy to (a) **document** every user-facing flow of the Kondix web app as Mermaid diagrams, and (b) **verify** each flow with an automated Playwright E2E test. Diagrams and tests live together, share node IDs for traceability, and are built together as one artifact per flow.

Scope: all roles (trainer, student, onboarding trainer, public auth, invite acceptance) and the cross-app admin approval flow that touches CelvoAdmin.

## Non-Goals

- CI/GitHub Actions integration — structure must allow it but it is not in scope for this initial effort.
- Angular component unit tests.
- API-only integration tests (already covered by `dotnet test`).
- Performance/load testing.
- Mobile responsive testing (desktop only for now).

## Approach

Hybrid: Mermaid flow diagrams as living documentation + Playwright E2E specs as executable verification. Each diagram node has a stable ID that appears as a `test.step()` prefix in the matching spec, so a failing test points to the exact node.

Flow authoring uses MCP Playwright as a codegen helper: navigate the real UI to extract selectors, then materialize a clean spec using `@playwright/test`.

## Architecture

### Folder layout

```
docs/flows/
  00-inventory.md              # Matrix: role × screen × action × flow × test
  01-auth.md                   # Login, register, logout, token refresh
  02-onboarding-trainer.md     # Setup → pending → approved
  03-trainer-dashboard.md
  04-trainer-routines.md       # List, wizard new, detail, edit, delete
  05-trainer-programs.md       # List, form new, detail, edit, assign
  06-trainer-students.md       # List, invite, detail, history, cancel program
  07-trainer-catalog.md
  08-invite-acceptance.md      # Student accepts invite, creates account
  09-student-home.md           # Next workout, stats
  10-student-calendar.md
  11-student-progress.md
  12-student-profile.md
  13-student-workout-mode.md   # Overview → exercise logging → complete
  14-student-comments.md
  99-admin-approval.md         # Cross-app: CelvoAdmin approves trainer

kondix-web/e2e/
  playwright.config.ts
  fixtures/
    seed.ts                    # registerTrainer, approveTrainer (internal API), cleanup
    auth.ts                    # loginAs, registerTrainer, registerStudent
    test-users.ts              # Unique-email generators per run
  pages/
    trainer/
      routine-list.page.ts
      routine-wizard.page.ts
      program-list.page.ts
      program-form.page.ts
      student-list.page.ts
      student-detail.page.ts
      catalog-list.page.ts
      dashboard.page.ts
    student/
      home.page.ts
      calendar.page.ts
      workout-overview.page.ts
      exercise-logging.page.ts
      workout-complete.page.ts
      progress.page.ts
      profile.page.ts
    shared/
      login.page.ts
      register.page.ts
      invite-accept.page.ts
  specs/                       # 1:1 with docs/flows/
    01-auth.spec.ts
    02-onboarding-trainer.spec.ts
    03-trainer-dashboard.spec.ts
    04-trainer-routines.spec.ts
    05-trainer-programs.spec.ts
    06-trainer-students.spec.ts
    07-trainer-catalog.spec.ts
    08-invite-acceptance.spec.ts
    09-student-home.spec.ts
    10-student-calendar.spec.ts
    11-student-progress.spec.ts
    12-student-profile.spec.ts
    13-student-workout-mode.spec.ts
    14-student-comments.spec.ts
    99-admin-approval.spec.ts

src/Kondix.Api/Controllers/
  InternalTestController.cs    # Dev/Testing only, gated by X-Internal-Key

setup/
  seed-e2e.sql                 # One-off seed: admin user + catalog exercises
```

### Test infrastructure

**Test-only internal endpoints** — `InternalTestController`, registered only when `ASPNETCORE_ENVIRONMENT in (Development, Testing)`. All endpoints require header `X-Internal-Key: $INTERNAL_API_KEY` (reuses existing ecosystem secret pattern).

- `POST /api/v1/internal/test/approve-trainer` — body: `{ email }`. Sets `IsApproved=true`. Used by most specs to skip cross-app dependency on CelvoAdmin.
- `DELETE /api/v1/internal/test/cleanup` — body: `{ tenantId }`. Cascade-deletes all data for one tenant. Called from `afterAll`.

**Seed script** (`setup/seed-e2e.sql`) — run once against the dev database before the first test run:

- 1 CelvoGuard admin user for the `99-admin-approval.spec.ts` only.
- Base catalog exercises shared across tests (squat, bench, deadlift, etc.). Reused read-only.

**Test isolation** — every spec generates unique emails using `Date.now()` + spec name (e.g., `trainer-04routines-1713628800000@e2e.test`). No cross-spec contamination. `afterAll` in each spec calls cleanup for its tenantId.

**Execution** (scripts in `kondix-web/package.json`):

- `npm run e2e` — starts backend + frontend via Playwright `webServer` config, runs headless, outputs HTML report.
- `npm run e2e:ui` — interactive Playwright UI mode.
- `npm run e2e:debug` — headed + debugger attached.

Playwright config `webServer` starts `dotnet run --project src/Kondix.Api` on port 5070 and `ng serve` on port 4200, waits for both to be ready.

### Diagram conventions (Mermaid)

Each `docs/flows/<n>-<name>.md` file follows this template:

```markdown
# <Flow name>

**Role:** trainer | student | public | onboarding
**Preconditions:** (e.g., approved trainer logged in, no program assigned)
**Test:** [`specs/<n>-<name>.spec.ts`](../../kondix-web/e2e/specs/<n>-<name>.spec.ts)

## Flow: <sub-flow name>

```mermaid
flowchart TD
  R1[Click "Nueva rutina"] --> R2{Wizard step 1: nombre}
  R2 --> R3[Fill name + save as draft]
  R3 --> R4[[POST /api/v1/routines]]
  R4 --> R5((Routine created))
  R5 --> R6[Redirect to /trainer/routines/:id]
```

## Nodes

| ID  | Type     | Description                |
|-----|----------|----------------------------|
| R1  | Action   | Click "Nueva rutina" button on routine-list |
| R2  | Decision | Wizard step 1 — enter name |
| ...
```

**Node shape conventions:**
- `[Rectangle]` — UI action (button click, form input, navigation).
- `{Diamond}` — decision/branch point.
- `((Circle))` — resulting state (entity created, status changed).
- `[[Double rect]]` — backend API call.

**Node ID scheme:** `<AreaPrefix><N>` where prefix is fixed per file:
`AU` auth, `ON` onboarding, `DA` dashboard, `R` routines, `PR` programs, `ST` students, `CA` catalog, `IN` invite, `SH` student home, `SC` calendar, `SP` progress, `SPR` profile, `WO` workout, `CO` comments, `AD` admin approval.

### Test conventions (Playwright)

Each spec maps 1:1 to a diagram file and uses `test.step()` whose label **starts with the node ID** so failures localize immediately:

```ts
test.describe('Flow: trainer creates routine', () => {
  test('happy path', async ({ page }) => {
    await test.step('R1: click "Nueva rutina"', async () => {
      await routineList.clickNewRoutine();
    });
    await test.step('R3: fill name and save draft', async () => {
      await routineWizard.fillName('Push day A');
      await routineWizard.saveDraft();
    });
    await test.step('R5: routine created', async () => {
      await expect(page).toHaveURL(/\/trainer\/routines\/[\w-]+/);
    });
  });
});
```

**Page objects** — one per screen, encapsulate selectors. Specs only call semantic methods (`clickNewRoutine`, `fillName`), never raw selectors. Keeps specs readable and selector churn localized.

**User lifecycle** — every spec is self-contained:
1. `beforeAll`: `registerTrainer()` → `approveTrainer(email)` → `loginAs(email)`. For student specs: `registerTrainer` → `approveTrainer` → create routine/program via API helper → `inviteStudent` → `acceptInvite` → `loginAsStudent`.
2. Test runs against real UI.
3. `afterAll`: `cleanup(tenantId)`.

The exception is `99-admin-approval.spec.ts` which requires CelvoAdmin running and uses a pre-seeded admin account — this spec is opt-in (`test.describe.configure({ mode: 'serial' })` + tagged `@cross-app`, only runs when `E2E_INCLUDE_CROSS_APP=1`).

### Traceability

- Node IDs in diagrams ↔ `test.step()` prefixes in specs ↔ appear in Playwright HTML report on failure.
- Each diagram file links forward to its spec; each spec header has a comment linking back to the diagram.
- Optional phase-2 tooling (`scripts/check-flow-coverage.ts`) parses Mermaid node IDs and spec steps, reports coverage gaps.

## Build sequence

One PR per phase so progress is visible and the strategy can be adjusted early:

1. **Phase 0 — Inventory.** Author `docs/flows/00-inventory.md` with the full matrix of role × screen × action. No code yet. Locks scope and ordering.
2. **Phase 1 — Test infrastructure.**
   - Add `InternalTestController` + `approve-trainer` + `cleanup` endpoints (Dev/Testing only).
   - Write `setup/seed-e2e.sql`.
   - Install `@playwright/test` in `kondix-web/`, add `playwright.config.ts`, `webServer` config, npm scripts.
   - Build `fixtures/` (seed, auth, test-users) and `pages/shared/login.page.ts`.
   - One throwaway smoke spec (`smoke.spec.ts`) that logs in as a freshly-registered approved trainer, to validate the harness end-to-end. Deleted once phase 2 lands.
3. **Phase 2 — Auth + onboarding.** Files 01, 02, 08. Full auth/register/logout + trainer onboarding + invite acceptance. Unblocks user creation for every other spec.
4. **Phase 3 — Trainer flows.** Files 03–07. Creates the data students need.
5. **Phase 4 — Student flows.** Files 09–14.
6. **Phase 5 — Cross-app admin approval.** File 99. Requires CelvoAdmin local setup documented in this spec as part of this phase.

Each phase ends with all new diagrams + specs green locally and committed.

## Open questions / deferred decisions

None blocking. Deferred to later:

- Video recording retention policy (default Playwright: keep on failure).
- Parallelism level (`workers` in config) — start with `workers: 1` to avoid DB contention, tune later if seed/cleanup can handle it.
- CI pipeline — structured to be addable later, not built now.

## Risks

- **Selector churn from UX rebranding.** Recent commits (`c7013269`, `8a728c8e`, etc.) show active UI iteration. Mitigation: page objects isolate selectors; prefer `data-testid` attributes added during spec authoring to stabilize.
- **Seeded data drift.** Catalog seed diverging from real prod catalog. Mitigation: seed is minimal (just enough for flows), re-derived from current catalog each time the seed script is edited.
- **Cross-app spec flakiness.** `99-admin-approval` depends on CelvoAdmin. Mitigation: opt-in via env flag, excluded from default run.
- **Trainer-student 1:1 business rule.** CLAUDE.md notes M:N junction with 1:1 enforced in business logic for MVP. Each spec creates its own trainer AND its own student, so no cross-spec link conflicts arise.
