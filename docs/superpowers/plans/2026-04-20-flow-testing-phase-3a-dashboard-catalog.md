# Flow Testing — Phase 3a (Dashboard + Catalog) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cover the two simplest trainer-area surfaces — the Dashboard (`/trainer`) and the Exercise Catalog (`/trainer/catalog`) — with Mermaid flow diagrams + Playwright specs, using the existing Phase 1/2 harness.

**Architecture:** Builds on `feat/flow-testing-phase-2`. Zero `data-testid`s currently exist across the trainer area, so each tested element gets one added. A new `setupActiveTrainer(page)` fixture helper composes the register + setup + approve steps into one call, since every Phase 3+ spec starts from that state. The existing `cleanup` internal endpoint is extended to also delete CatalogExercise rows for the tenant's trainers.

**Tech Stack:** Same as Phase 1/2 — Angular 21, `@playwright/test` 1.59, Mermaid, .NET 10 Kondix API.

**Scope decision:** Phase 3 (trainer flows 03–07) is split into three sub-plans to keep each session reviewable:
- **Phase 3a (this plan):** 03 Dashboard + 07 Catalog
- **Phase 3b (follow-up):** 04 Routines (wizard — the biggest spec)
- **Phase 3c (follow-up):** 05 Programs + 06 Students (assignment lifecycle ties them)

---

## File Structure

**Created:**
- `docs/flows/03-trainer-dashboard.md`
- `docs/flows/07-trainer-catalog.md`
- `kondix-web/e2e/pages/trainer/dashboard.page.ts`
- `kondix-web/e2e/pages/trainer/catalog-list.page.ts`
- `kondix-web/e2e/specs/03-trainer-dashboard.spec.ts`
- `kondix-web/e2e/specs/07-trainer-catalog.spec.ts`

**Modified:**
- `kondix-web/src/app/features/trainer/feature/dashboard.ts` — add `data-testid`s
- `kondix-web/src/app/features/trainer/catalog/feature/catalog-list.ts` — add `data-testid`s
- `kondix-web/e2e/fixtures/auth.ts` — add `setupActiveTrainer(page, opts?)`
- `src/Kondix.Api/Controllers/InternalTestController.cs` — extend `Cleanup` to also remove CatalogExercises for the tenant's trainers
- `docs/flows/00-inventory.md` — flip dashboard + catalog rows from Pending → Done

---

## Task 1: Add `data-testid`s to the Dashboard

**Goal:** Dashboard has no testids today. Add stable selectors for header, stat cards, activity feed empty state, alerts empty state, and the three quick-action buttons.

**Files:**
- Modify: `kondix-web/src/app/features/trainer/feature/dashboard.ts`

- [ ] **Step 1: Add testids to header + stats**

Open `kondix-web/src/app/features/trainer/feature/dashboard.ts` and locate these elements. Add `data-testid` only — leave existing classes/bindings untouched:

- `<h1 class="font-display text-2xl font-bold text-text">` (around line 64) → `data-testid="dashboard-greeting"`
- The `<kx-spinner />` case (line 80) → wrap with `<div data-testid="dashboard-loading"><kx-spinner /></div>`
- Each of the four `<kx-stat-card>` instances (lines 85–105) → add the matching testid:
  - ALUMNOS ACTIVOS → `data-testid="stat-active-students"`
  - ACTIVOS ESTA SEMANA → `data-testid="stat-active-week"`
  - PROGRAMAS ACTIVOS → `data-testid="stat-active-programs"`
  - ADHERENCIA → `data-testid="stat-adherence"`

`kx-stat-card` is a component — add the testid on the element itself (`<kx-stat-card data-testid="...">`), Angular forwards unknown attributes to the host element.

- [ ] **Step 2: Add testids to activity feed + alerts empty states**

- The activity `@else` empty-state block (around line 134) `<div class="bg-card ...">` → `data-testid="activity-empty"`
- The alerts `@else` empty-state block (around line 159) `<div class="bg-card ...">` → `data-testid="alerts-empty"`
- The section header `<a routerLink="/trainer/students" class="text-xs text-primary ...">Ver todos →</a>` (around line 114) → `data-testid="activity-see-all"`

- [ ] **Step 3: Add testids to the three quick-action buttons**

In the Quick Actions section (around lines 169–193), add to each button element:

- "Crear rutina" button → `data-testid="quick-create-routine"`
- "Crear programa" button → `data-testid="quick-create-program"`
- "Invitar alumno" button → `data-testid="quick-invite-student"`

- [ ] **Step 4: Verify the app still builds**

```bash
cd kondix-web && npm run build 2>&1 | tail -10 && cd ..
```

Expected: `Application bundle generation complete.`

- [ ] **Step 5: Commit**

```bash
git add kondix-web/src/app/features/trainer/feature/dashboard.ts
git commit -m "chore(ui): add data-testids to trainer dashboard"
```

---

## Task 2: Add `data-testid`s to Catalog list + form

**Goal:** Stable selectors for every element the Catalog spec touches: header, search, chip filters, form inputs, form submit, exercise cards, delete hover button, delete dialog buttons.

**Files:**
- Modify: `kondix-web/src/app/features/trainer/catalog/feature/catalog-list.ts`

- [ ] **Step 1: Header + search + chips**

- "+ Nuevo ejercicio" `<button (click)="openCreate()">` → `data-testid="catalog-new"`
- Search `<input ... name="search">` → `data-testid="catalog-search"`
- Each chip `<button (click)="selectGroup(chip)">` inside `@for` → `[attr.data-testid]="'catalog-chip-' + chip.toLowerCase()"` (so e.g. `catalog-chip-todos`, `catalog-chip-pecho`). Note: Spanish chip names contain accents; the attribute value will contain accents too — that's fine for Playwright's `getByTestId` string match.
- "Más ▾/Menos ▴" button (`(click)="toggleMoreChips()"`) → `data-testid="catalog-more-chips"`

- [ ] **Step 2: Form fields**

Inside `@if (editingExercise() !== undefined)` block:

- The wrapper `<div class="bg-card border border-border rounded-2xl p-5 mb-5 animate-fade-up">` → `data-testid="catalog-form"`
- `<input [(ngModel)]="formName" ...>` → `data-testid="catalog-form-name"`
- `<input [(ngModel)]="formMuscleGroup" ...>` → `data-testid="catalog-form-muscle"`
- `<input [(ngModel)]="formVideoUrl" ...>` → `data-testid="catalog-form-video"`
- `<textarea [(ngModel)]="formNotes" ...>` → `data-testid="catalog-form-notes"`
- Submit `<button type="submit" [disabled]="saving()">` → `data-testid="catalog-form-submit"`
- Cancel `<button type="button" (click)="cancelForm()">` → `data-testid="catalog-form-cancel"`

- [ ] **Step 3: Grid + empty state + delete**

- `<kx-empty-state>` in the empty branch → `data-testid="catalog-empty"`
- The exercise card `<div class="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer ...">` → `[attr.data-testid]="'catalog-card-' + ex.id"`
- The per-card Eliminar `<button (click)="requestDelete(ex, $event)">` → `[attr.data-testid]="'catalog-delete-' + ex.id"`

- [ ] **Step 4: Delete dialog — data-testid forwarding**

The `<kx-confirm-dialog>` component renders its own buttons. Its confirm/cancel already receive clicks via outputs. To select them from a spec, either:

- Option A (preferred): add `data-testid="catalog-delete-dialog"` on the `<kx-confirm-dialog>` host so the dialog's visibility is assertable; the spec then uses role + name (`page.getByRole('button', { name: 'Eliminar' })`) to click confirm inside it.
- Option B: modify `kx-confirm-dialog` to forward testids to its buttons — out of scope here.

Add only: `<kx-confirm-dialog data-testid="catalog-delete-dialog" ... />` (around line 188).

- [ ] **Step 5: Verify build**

```bash
cd kondix-web && npm run build 2>&1 | tail -10 && cd ..
```

Expected: build succeeds, no errors about `[attr.data-testid]` bindings.

- [ ] **Step 6: Commit**

```bash
git add kondix-web/src/app/features/trainer/catalog/feature/catalog-list.ts
git commit -m "chore(ui): add data-testids to trainer catalog"
```

---

## Task 3: Extend `Cleanup` to remove CatalogExercises for the tenant

**Goal:** The existing `/api/v1/internal/test/cleanup` endpoint deletes Trainers + Students + TrainerStudents for a tenant. After running a catalog spec, orphan CatalogExercise rows for the deleted Trainer would remain (FK would cascade in prod Postgres, but we still want explicit + order-stable deletes so the endpoint keeps working under InMemory in integration tests). Add a `RemoveRange` before trainers are deleted.

**Files:**
- Modify: `src/Kondix.Api/Controllers/InternalTestController.cs`
- Modify: `tests/Kondix.IntegrationTests/InternalTestControllerTests.cs` (if present — add assertion for CatalogExercises cleanup)

- [ ] **Step 1: Extend the Cleanup method**

In `src/Kondix.Api/Controllers/InternalTestController.cs`, find the `Cleanup` method. After step 2 (students removed) and BEFORE step 3 (trainers removed), insert:

```csharp
        // 2b. Remove CatalogExercises created by this tenant's trainers.
        //     FK cascade handles this in Postgres but not in InMemory, and
        //     keeping the delete explicit keeps integration tests deterministic.
        var catalogToRemove = await db.CatalogExercises
            .Where(c => trainerIds.Contains(c.TrainerId))
            .ToListAsync(ct);
        db.CatalogExercises.RemoveRange(catalogToRemove);
```

Verify the `using` block already has `Microsoft.EntityFrameworkCore` (it does — confirm before saving).

- [ ] **Step 2: Extend the integration test (if one exists)**

```bash
ls tests/Kondix.IntegrationTests 2>&1
```

If an `InternalTestControllerTests.cs` file exists and already asserts which rows are removed, add an arrange step that seeds a CatalogExercise for the tenant's trainer and an assertion that it is gone after cleanup. Keep the change minimal — one arrange, one assert. If the file doesn't exist or doesn't have an assertion pattern to match, skip this step.

- [ ] **Step 3: Run the backend tests**

```bash
dotnet test Kondix.slnx 2>&1 | tail -15
```

Expected: UnitTests 13/13, ArchTests 8/8, IntegrationTests still green (4/4 or 5/5 if you added an assertion). No regressions.

- [ ] **Step 4: Commit**

```bash
git add src/Kondix.Api/Controllers/InternalTestController.cs tests/Kondix.IntegrationTests
git commit -m "fix(api): extend internal cleanup to remove tenant catalog exercises"
```

---

## Task 4: Add `setupActiveTrainer` fixture helper

**Goal:** Every Phase 3 spec begins from "a logged-in, approved trainer viewing the trainer area". Today that's 4 calls (`RegisterPage.submit`, `readTenantIdFromCookies`, `completeTrainerSetup`, `approveTrainer`). Wrap them in one helper so specs stay focused on the flow under test.

**Files:**
- Modify: `kondix-web/e2e/fixtures/auth.ts`

- [ ] **Step 1: Append the helper**

Add to the bottom of `kondix-web/e2e/fixtures/auth.ts`:

```ts
import type { TestTrainer } from './test-users';
import { makeTrainer } from './test-users';
import { approveTrainer } from './seed';
import { RegisterPage } from '../pages/shared/register.page';

/**
 * Composes register + onboarding setup + admin approval for a fresh trainer.
 * Leaves `page` logged in as an active trainer on whatever URL the register
 * flow redirects to (usually /onboarding/setup after the redirect, or /trainer
 * after subsequent navigation — callers should navigate explicitly after).
 *
 * Returns the generated trainer credentials and the resolved tenantId so the
 * spec can call `cleanupTenant(tenantId)` in afterAll. Callers must still
 * `clearRateLimits()` in beforeEach.
 */
export async function setupActiveTrainer(
  page: Page,
  tag = 'spec',
): Promise<{ trainer: TestTrainer; tenantId: string }> {
  const trainer = makeTrainer(tag);
  const register = new RegisterPage(page);
  await register.goto();
  await register.submit(trainer);
  const tenantId = await readTenantIdFromCookies(page);
  await completeTrainerSetup(page, trainer.displayName);
  await approveTrainer(tenantId);
  return { trainer, tenantId };
}
```

Note: `TestTrainer` is the return type of `makeTrainer`. If `test-users.ts` does not export that type, export it there first (one-line change: `export interface TestTrainer { ... }` or `export type TestTrainer = ReturnType<typeof makeTrainer>;`).

- [ ] **Step 2: Verify `test-users.ts` exports `TestTrainer`**

```bash
grep -n "TestTrainer\|export.*makeTrainer" kondix-web/e2e/fixtures/test-users.ts
```

If `TestTrainer` is not exported, add at the top of `test-users.ts` (just above `makeTrainer`):

```ts
export type TestTrainer = ReturnType<typeof makeTrainer>;
```

That line references `makeTrainer` below it — fine in TS because the inferred return type is resolved lazily. If you prefer, move it below the `makeTrainer` definition.

- [ ] **Step 3: Verify existing specs still compile by running 01-auth**

```bash
cd kondix-web && npx playwright test specs/01-auth.spec.ts --project=chromium 2>&1 | tail -10
```

Expected: 8 passed (unchanged).

- [ ] **Step 4: Commit**

```bash
git add kondix-web/e2e/fixtures/auth.ts kondix-web/e2e/fixtures/test-users.ts
git commit -m "chore(e2e): add setupActiveTrainer fixture for Phase 3 specs"
```

---

## Task 5: Page objects for Dashboard + Catalog

**Files:**
- Create: `kondix-web/e2e/pages/trainer/dashboard.page.ts`
- Create: `kondix-web/e2e/pages/trainer/catalog-list.page.ts`

- [ ] **Step 1: DashboardPage**

```bash
mkdir -p kondix-web/e2e/pages/trainer
```

Create `kondix-web/e2e/pages/trainer/dashboard.page.ts`:

```ts
import type { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly greeting: Locator;
  readonly statActiveStudents: Locator;
  readonly statActiveWeek: Locator;
  readonly statActivePrograms: Locator;
  readonly statAdherence: Locator;
  readonly activityEmpty: Locator;
  readonly alertsEmpty: Locator;
  readonly quickCreateRoutine: Locator;
  readonly quickCreateProgram: Locator;
  readonly quickInviteStudent: Locator;
  readonly activitySeeAll: Locator;

  constructor(private readonly page: Page) {
    this.greeting = page.getByTestId('dashboard-greeting');
    this.statActiveStudents = page.getByTestId('stat-active-students');
    this.statActiveWeek = page.getByTestId('stat-active-week');
    this.statActivePrograms = page.getByTestId('stat-active-programs');
    this.statAdherence = page.getByTestId('stat-adherence');
    this.activityEmpty = page.getByTestId('activity-empty');
    this.alertsEmpty = page.getByTestId('alerts-empty');
    this.quickCreateRoutine = page.getByTestId('quick-create-routine');
    this.quickCreateProgram = page.getByTestId('quick-create-program');
    this.quickInviteStudent = page.getByTestId('quick-invite-student');
    this.activitySeeAll = page.getByTestId('activity-see-all');
  }

  async goto(): Promise<void> {
    await this.page.goto('/trainer');
    await this.greeting.waitFor();
  }

  async clickCreateRoutine(): Promise<void> {
    await this.quickCreateRoutine.click();
    await this.page.waitForURL(/\/trainer\/routines\/new/);
  }

  async clickCreateProgram(): Promise<void> {
    await this.quickCreateProgram.click();
    await this.page.waitForURL(/\/trainer\/programs\/new/);
  }

  async clickInviteStudent(): Promise<void> {
    await this.quickInviteStudent.click();
    await this.page.waitForURL(/\/trainer\/students/);
  }
}
```

- [ ] **Step 2: CatalogListPage**

Create `kondix-web/e2e/pages/trainer/catalog-list.page.ts`:

```ts
import type { Page, Locator } from '@playwright/test';

export class CatalogListPage {
  readonly newBtn: Locator;
  readonly search: Locator;
  readonly form: Locator;
  readonly formName: Locator;
  readonly formMuscle: Locator;
  readonly formVideo: Locator;
  readonly formNotes: Locator;
  readonly formSubmit: Locator;
  readonly formCancel: Locator;
  readonly empty: Locator;
  readonly deleteDialog: Locator;

  constructor(private readonly page: Page) {
    this.newBtn = page.getByTestId('catalog-new');
    this.search = page.getByTestId('catalog-search');
    this.form = page.getByTestId('catalog-form');
    this.formName = page.getByTestId('catalog-form-name');
    this.formMuscle = page.getByTestId('catalog-form-muscle');
    this.formVideo = page.getByTestId('catalog-form-video');
    this.formNotes = page.getByTestId('catalog-form-notes');
    this.formSubmit = page.getByTestId('catalog-form-submit');
    this.formCancel = page.getByTestId('catalog-form-cancel');
    this.empty = page.getByTestId('catalog-empty');
    this.deleteDialog = page.getByTestId('catalog-delete-dialog');
  }

  async goto(): Promise<void> {
    await this.page.goto('/trainer/catalog');
    await this.newBtn.waitFor();
  }

  async openCreateForm(): Promise<void> {
    await this.newBtn.click();
    await this.form.waitFor();
  }

  async fillAndSubmit(name: string, muscleGroup?: string, videoUrl?: string, notes?: string): Promise<void> {
    await this.formName.fill(name);
    if (muscleGroup) await this.formMuscle.fill(muscleGroup);
    if (videoUrl) await this.formVideo.fill(videoUrl);
    if (notes) await this.formNotes.fill(notes);
    await this.formSubmit.click();
    // Form collapses on success (editingExercise → undefined)
    await this.form.waitFor({ state: 'detached' });
  }

  card(exerciseId: string): Locator {
    return this.page.getByTestId(`catalog-card-${exerciseId}`);
  }

  deleteButton(exerciseId: string): Locator {
    return this.page.getByTestId(`catalog-delete-${exerciseId}`);
  }

  async cardByName(name: string): Promise<Locator> {
    // Testids include the exercise UUID which is unknown beforehand. Match by
    // the visible name inside any catalog-card-* element.
    return this.page.locator('[data-testid^="catalog-card-"]', { hasText: name });
  }

  selectChip(label: string): Promise<void> {
    return this.page.getByTestId(`catalog-chip-${label.toLowerCase()}`).click();
  }

  async openEdit(exerciseName: string): Promise<void> {
    const card = await this.cardByName(exerciseName);
    await card.click();
    await this.form.waitFor();
  }

  async confirmDeleteDialog(): Promise<void> {
    await this.deleteDialog.waitFor();
    // kx-confirm-dialog renders a visible button with text "Eliminar"
    await this.page.getByRole('button', { name: 'Eliminar' }).click();
    await this.deleteDialog.waitFor({ state: 'hidden' });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add kondix-web/e2e/pages/trainer
git commit -m "chore(e2e): add page objects for trainer dashboard and catalog"
```

---

## Task 6: Diagram `docs/flows/03-trainer-dashboard.md`

**Files:**
- Create: `docs/flows/03-trainer-dashboard.md`

- [ ] **Step 1: Write the diagram**

Create `docs/flows/03-trainer-dashboard.md`. Use real triple-backticks around the mermaid blocks (the spec here uses `<mermaid>` as a placeholder only to survive this prompt's rendering):

```markdown
# 03 — Trainer Dashboard

**Role:** trainer (operator)
**Preconditions:** Trainer registered, onboarding complete, approved. Cookies set.
**Test:** [`specs/03-trainer-dashboard.spec.ts`](../../kondix-web/e2e/specs/03-trainer-dashboard.spec.ts)

## Flow: load dashboard

<mermaid>
flowchart TD
  DA1[Visit /trainer] --> DA2[[GET /api/v1/dashboard]]
  DA2 --> DA3[[GET /api/v1/program-assignments]]
  DA3 --> DA4{Data?}
  DA4 -- Empty --> DA5[Show greeting + zero stats + empty activity/alerts]
  DA4 -- With data --> DA6[Show greeting + stat values + activity cards + alerts]
</mermaid>

## Flow: quick-action navigation

<mermaid>
flowchart TD
  DA10[Click Crear rutina] --> DA11[Navigate /trainer/routines/new]
  DA12[Click Crear programa] --> DA13[Navigate /trainer/programs/new]
  DA14[Click Invitar alumno] --> DA15[Navigate /trainer/students]
</mermaid>

## Nodes

| ID   | Type     | Description                                       |
|------|----------|---------------------------------------------------|
| DA1  | Action   | Navigate to `/trainer`                            |
| DA2  | API      | `GET /api/v1/dashboard`                           |
| DA3  | API      | `GET /api/v1/program-assignments`                 |
| DA4  | Decision | Has data to render                                |
| DA5  | State    | Empty dashboard with zero metrics                 |
| DA6  | State    | Populated dashboard (not covered in Phase 3a)     |
| DA10 | Action   | Click "Crear rutina" quick action                 |
| DA11 | Action   | Navigate to `/trainer/routines/new`               |
| DA12 | Action   | Click "Crear programa" quick action               |
| DA13 | Action   | Navigate to `/trainer/programs/new`               |
| DA14 | Action   | Click "Invitar alumno" quick action               |
| DA15 | Action   | Navigate to `/trainer/students`                   |

## Notes

- "Populated" state (DA6) requires seeded students + sessions; deferred to Phase 3c or a later integration spec.
- Notification bell is inert (no route); ignored here.
```

Replace `<mermaid>`/`</mermaid>` with triple-backticks + `mermaid` language tag in the actual file.

- [ ] **Step 2: Commit**

```bash
git add docs/flows/03-trainer-dashboard.md
git commit -m "docs(flows): add 03-trainer-dashboard diagram"
```

---

## Task 7: Diagram `docs/flows/07-trainer-catalog.md`

**Files:**
- Create: `docs/flows/07-trainer-catalog.md`

- [ ] **Step 1: Write the diagram**

Create `docs/flows/07-trainer-catalog.md`:

```markdown
# 07 — Trainer Catalog

**Role:** trainer
**Preconditions:** Trainer active on /trainer/catalog.
**Test:** [`specs/07-trainer-catalog.spec.ts`](../../kondix-web/e2e/specs/07-trainer-catalog.spec.ts)

## Flow: list + filter

<mermaid>
flowchart TD
  CA1[Visit /trainer/catalog] --> CA2[[GET /api/v1/catalog]]
  CA2 --> CA3{Any exercises?}
  CA3 -- No --> CA4[Render empty state "Tu biblioteca está vacía"]
  CA3 -- Yes --> CA5[Render grid of exercise cards]
  CA5 --> CA6[Click muscle-group chip]
  CA6 --> CA7[Client-side filter by muscleGroup substring]
</mermaid>

## Flow: create exercise

<mermaid>
flowchart TD
  CA10[Click + Nuevo ejercicio] --> CA11[Form expands in create mode]
  CA11 --> CA12[Fill name + muscleGroup + videoUrl + notes]
  CA12 --> CA13[Click Crear ejercicio]
  CA13 --> CA14[[POST /api/v1/catalog]]
  CA14 --> CA15{Success?}
  CA15 -- Yes --> CA16[Form collapses; list reloads; toast success]
  CA15 -- No --> CA17[Toast error]
</mermaid>

## Flow: edit exercise

<mermaid>
flowchart TD
  CA20[Click exercise card] --> CA21[Form opens in edit mode with fields populated]
  CA21 --> CA22[Modify fields]
  CA22 --> CA23[Click Guardar cambios]
  CA23 --> CA24[[PUT /api/v1/catalog/:id]]
  CA24 --> CA25[Form collapses; list reloads]
</mermaid>

## Flow: delete exercise

<mermaid>
flowchart TD
  CA30[Hover card] --> CA31[Click Eliminar]
  CA31 --> CA32[Confirm dialog appears]
  CA32 --> CA33[Click Eliminar in dialog]
  CA33 --> CA34[[DELETE /api/v1/catalog/:id]]
  CA34 --> CA35[Card removed; toast success]
</mermaid>

## Nodes

| ID   | Type     | Description                                   |
|------|----------|-----------------------------------------------|
| CA1  | Action   | Navigate to `/trainer/catalog`                |
| CA2  | API      | `GET /api/v1/catalog`                         |
| CA3  | Decision | Trainer has any exercises                     |
| CA4  | State    | Empty state rendered                          |
| CA5  | State    | Exercise grid rendered                        |
| CA6  | Action   | Click a muscle-group chip                     |
| CA7  | State    | Grid filtered client-side                     |
| CA10 | Action   | Click "+ Nuevo ejercicio"                     |
| CA11 | State    | Form expanded (create mode)                   |
| CA12 | Action   | Fill form fields                              |
| CA13 | Action   | Click "Crear ejercicio"                       |
| CA14 | API      | `POST /api/v1/catalog`                        |
| CA15 | Decision | HTTP success                                  |
| CA16 | State    | Form collapses; grid refetched                |
| CA17 | State    | Toast error                                   |
| CA20 | Action   | Click existing exercise card                  |
| CA21 | State    | Form opened in edit mode, fields prefilled    |
| CA22 | Action   | Modify any field                              |
| CA23 | Action   | Click "Guardar cambios"                       |
| CA24 | API      | `PUT /api/v1/catalog/:id`                     |
| CA25 | State    | Form collapses; grid refetched                |
| CA30 | Action   | Hover over a card                             |
| CA31 | Action   | Click the Eliminar hover button               |
| CA32 | State    | Confirm dialog open                           |
| CA33 | Action   | Click "Eliminar" inside dialog                |
| CA34 | API      | `DELETE /api/v1/catalog/:id`                  |
| CA35 | State    | Card removed                                  |
```

- [ ] **Step 2: Commit**

```bash
git add docs/flows/07-trainer-catalog.md
git commit -m "docs(flows): add 07-trainer-catalog diagram"
```

---

## Task 8: Spec `03-trainer-dashboard.spec.ts`

**Files:**
- Create: `kondix-web/e2e/specs/03-trainer-dashboard.spec.ts`

- [ ] **Step 1: Preflight**

```bash
curl -sS -o /dev/null -w "guard: %{http_code}\n" --max-time 5 http://localhost:5050/api/v1/health
```

Expected: 200. If not, follow `docs/e2e-setup.md`.

- [ ] **Step 2: Write the spec**

Create `kondix-web/e2e/specs/03-trainer-dashboard.spec.ts`:

```ts
// Flow: see ../../../docs/flows/03-trainer-dashboard.md
import { test, expect } from '@playwright/test';
import { cleanupTenant, clearRateLimits } from '../fixtures/seed';
import { setupActiveTrainer } from '../fixtures/auth';
import { DashboardPage } from '../pages/trainer/dashboard.page';

test.beforeEach(() => {
  clearRateLimits();
});

test.describe('Flow: trainer dashboard', () => {
  test('DA1-DA5: empty dashboard renders with zero stats for a fresh trainer', async ({ page }) => {
    const { tenantId } = await setupActiveTrainer(page, 'dash-empty');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    await expect(dashboard.greeting).toBeVisible();
    await expect(dashboard.statActiveStudents).toContainText('0');
    await expect(dashboard.statActiveWeek).toContainText('0');
    await expect(dashboard.statActivePrograms).toContainText('0');
    await expect(dashboard.statAdherence).toContainText('—');
    await expect(dashboard.activityEmpty).toBeVisible();
    await expect(dashboard.alertsEmpty).toBeVisible();

    await cleanupTenant(tenantId);
  });

  test('DA10-DA11: quick action "Crear rutina" navigates to wizard', async ({ page }) => {
    const { tenantId } = await setupActiveTrainer(page, 'dash-qa-rt');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.clickCreateRoutine();

    await expect(page).toHaveURL(/\/trainer\/routines\/new/);

    await cleanupTenant(tenantId);
  });

  test('DA12-DA13: quick action "Crear programa" navigates to form', async ({ page }) => {
    const { tenantId } = await setupActiveTrainer(page, 'dash-qa-pg');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.clickCreateProgram();

    await expect(page).toHaveURL(/\/trainer\/programs\/new/);

    await cleanupTenant(tenantId);
  });

  test('DA14-DA15: quick action "Invitar alumno" navigates to students', async ({ page }) => {
    const { tenantId } = await setupActiveTrainer(page, 'dash-qa-st');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.clickInviteStudent();

    await expect(page).toHaveURL(/\/trainer\/students/);

    await cleanupTenant(tenantId);
  });
});
```

- [ ] **Step 3: Run until green**

```bash
cd kondix-web && npx playwright test specs/03-trainer-dashboard.spec.ts --project=chromium 2>&1 | tail -30
```

Expected: **4 passed**.

Likely failure modes to root-cause (never weaken assertions):
- Adherence cell shows `—` in both empty and populated cases — assertion uses `—` (em dash, not hyphen). Confirm by inspecting the rendered HTML if fail.
- `statActiveStudents` shows `0` immediately or only after `/dashboard` responds — the page's `loading()` signal is `true` until the first call resolves. `DashboardPage.goto()` already waits for `greeting` which only renders after `loading` is false (greeting is outside the `@if (loading())` branch — re-check; if wrong, wait for `stat-active-students` instead).
- Iterate max 3 attempts. If stuck → BLOCKED with trace output.

- [ ] **Step 4: Commit**

```bash
git add kondix-web/e2e/specs/03-trainer-dashboard.spec.ts
git commit -m "test(e2e): add 03-trainer-dashboard spec (empty state + quick actions)"
```

---

## Task 9: Spec `07-trainer-catalog.spec.ts`

**Files:**
- Create: `kondix-web/e2e/specs/07-trainer-catalog.spec.ts`

- [ ] **Step 1: Write the spec**

Create `kondix-web/e2e/specs/07-trainer-catalog.spec.ts`:

```ts
// Flow: see ../../../docs/flows/07-trainer-catalog.md
import { test, expect } from '@playwright/test';
import { cleanupTenant, clearRateLimits } from '../fixtures/seed';
import { setupActiveTrainer } from '../fixtures/auth';
import { CatalogListPage } from '../pages/trainer/catalog-list.page';

test.beforeEach(() => {
  clearRateLimits();
});

test.describe('Flow: trainer catalog', () => {
  test('CA1-CA4: empty library shows empty state', async ({ page }) => {
    const { tenantId } = await setupActiveTrainer(page, 'cat-empty');

    const catalog = new CatalogListPage(page);
    await catalog.goto();

    await expect(catalog.empty).toBeVisible();
    await expect(catalog.empty).toContainText('Tu biblioteca está vacía');

    await cleanupTenant(tenantId);
  });

  test('CA10-CA16: create exercise renders new card', async ({ page }) => {
    const { tenantId } = await setupActiveTrainer(page, 'cat-create');

    const catalog = new CatalogListPage(page);
    await catalog.goto();

    await catalog.openCreateForm();
    await catalog.fillAndSubmit('Press banca E2E', 'Pecho');

    // Empty state disappears; a card with the name is visible
    await expect(catalog.empty).toBeHidden();
    const newCard = await catalog.cardByName('Press banca E2E');
    await expect(newCard).toBeVisible();
    await expect(newCard).toContainText('Pecho');

    await cleanupTenant(tenantId);
  });

  test('CA20-CA25: edit exercise updates card', async ({ page }) => {
    const { tenantId } = await setupActiveTrainer(page, 'cat-edit');

    const catalog = new CatalogListPage(page);
    await catalog.goto();

    // Arrange: create one
    await catalog.openCreateForm();
    await catalog.fillAndSubmit('Sentadilla E2E', 'Piernas');
    const card = await catalog.cardByName('Sentadilla E2E');
    await expect(card).toBeVisible();

    // Act: edit
    await catalog.openEdit('Sentadilla E2E');
    await catalog.formName.fill('Sentadilla libre E2E');
    await catalog.formSubmit.click();
    await catalog.form.waitFor({ state: 'detached' });

    // Assert: renamed
    const renamed = await catalog.cardByName('Sentadilla libre E2E');
    await expect(renamed).toBeVisible();
    const oldCard = await catalog.cardByName('Sentadilla E2E');
    await expect(oldCard).toHaveCount(0);

    await cleanupTenant(tenantId);
  });

  test('CA6-CA7: muscle-group chip filters list', async ({ page }) => {
    const { tenantId } = await setupActiveTrainer(page, 'cat-filter');

    const catalog = new CatalogListPage(page);
    await catalog.goto();

    // Arrange: one Pecho, one Piernas
    await catalog.openCreateForm();
    await catalog.fillAndSubmit('Bench E2E', 'Pecho');
    await catalog.openCreateForm();
    await catalog.fillAndSubmit('Squat E2E', 'Piernas');

    // Act: filter Pecho
    await catalog.selectChip('Pecho');

    // Assert: only Pecho card visible
    await expect(await catalog.cardByName('Bench E2E')).toBeVisible();
    await expect(await catalog.cardByName('Squat E2E')).toHaveCount(0);

    // Switch back to Todos
    await catalog.selectChip('Todos');
    await expect(await catalog.cardByName('Squat E2E')).toBeVisible();

    await cleanupTenant(tenantId);
  });

  test('CA30-CA35: delete with confirmation removes card', async ({ page }) => {
    const { tenantId } = await setupActiveTrainer(page, 'cat-delete');

    const catalog = new CatalogListPage(page);
    await catalog.goto();

    // Arrange
    await catalog.openCreateForm();
    await catalog.fillAndSubmit('Remo E2E', 'Espalda');
    const card = await catalog.cardByName('Remo E2E');
    await expect(card).toBeVisible();

    // Act: hover the card so the delete button is visible, then click it
    await card.hover();
    // Delete button testid uses the exercise id — grab it off the card's data-testid
    const cardTestid = await card.getAttribute('data-testid');
    const exerciseId = cardTestid!.replace('catalog-card-', '');
    await catalog.deleteButton(exerciseId).click();

    await catalog.confirmDeleteDialog();

    // Assert: gone
    await expect(await catalog.cardByName('Remo E2E')).toHaveCount(0);

    await cleanupTenant(tenantId);
  });
});
```

- [ ] **Step 2: Run until green**

```bash
cd kondix-web && npx playwright test specs/07-trainer-catalog.spec.ts --project=chromium 2>&1 | tail -40
```

Expected: **5 passed**.

Likely failure modes:
- `openCreateForm` then submit + wait for detached form — if `saving` is slow, increase via `await catalog.form.waitFor({ state: 'detached', timeout: 10000 })`.
- Chip click: confirm `selectGroup('Pecho')` does client-side filtering without a refetch; the grid re-renders synchronously. No `waitForResponse` needed.
- Delete dialog: `kx-confirm-dialog` renders the button text as "Eliminar" (Spanish). `page.getByRole('button', { name: 'Eliminar' })` must match exactly. If the dialog renders two Eliminar buttons (rare), scope to `dialog.getByRole`.
- Iterate max 3 attempts.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/e2e/specs/07-trainer-catalog.spec.ts
git commit -m "test(e2e): add 07-trainer-catalog spec (crud + filter + delete)"
```

---

## Task 10: Update `docs/flows/00-inventory.md`

**Files:**
- Modify: `docs/flows/00-inventory.md`

- [ ] **Step 1: Flip the covered rows**

In the Trainer Area table, change status `Pending` → `Done` on exactly these rows:

- `Dashboard: view metrics + CTAs`
- `Catalog: list + add exercise`

Leave all routine/program/student rows as `Pending` — those are Phase 3b/3c.

- [ ] **Step 2: Commit**

```bash
git add docs/flows/00-inventory.md
git commit -m "docs(flows): mark dashboard and catalog flows Done in inventory"
```

---

## Task 11: Cold-start verification

**Files:** None

- [ ] **Step 1: Stop stale dotnet/ng processes, keep Docker + CelvoGuard running**

```powershell
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Kondix*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*4200*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
```

- [ ] **Step 2: Full backend test suite**

```bash
dotnet test Kondix.slnx 2>&1 | tail -20
```

Expected: UnitTests + ArchTests + IntegrationTests all green. Numbers should match pre-Phase-3a counts plus any assertion you added in Task 3.

- [ ] **Step 3: Full Playwright suite**

```bash
cd kondix-web && npx playwright test --project=chromium 2>&1 | tail -40
```

Expected:
- `01-auth.spec.ts`: 8 passed
- `02-onboarding-trainer.spec.ts`: 4 passed
- `08-invite-acceptance.spec.ts`: 2 passed
- `03-trainer-dashboard.spec.ts`: 4 passed
- `07-trainer-catalog.spec.ts`: 5 passed
- **Total: 23 passed**

- [ ] **Step 4: Working tree sanity**

```bash
git status
git log --oneline feat/flow-testing-phase-2..HEAD
```

Expected: clean tree, ~10–11 new commits on top of Phase 2.

## Done criteria

- 2 new diagram files (`03-trainer-dashboard.md`, `07-trainer-catalog.md`).
- 23 Playwright tests green (all previous + 9 new).
- Backend tests still all green; internal cleanup endpoint now covers CatalogExercises.
- `data-testid`s added to Dashboard + Catalog UI.
- `setupActiveTrainer` helper available for Phase 3b/3c.
- Inventory marks dashboard + catalog flows as Done.

## Out of scope (next plans)

- **Phase 3b:** Trainer routines (list + wizard create/edit + detail + duplicate + delete) — `04-trainer-routines.md` / `04-trainer-routines.spec.ts`.
- **Phase 3c:** Trainer programs + students (create program / assign program / student list-invite-detail-cancel) — `05-trainer-programs.md` + `06-trainer-students.md`.
- **Phase 4:** Student area flows.
- **Phase 5:** Cross-app admin approval.
