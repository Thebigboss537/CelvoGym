# Exercise Catalog & Block Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure exercise media (photo + video at catalog level only), make every routine exercise resolve to a catalog entry (auto-cataloging), rename `ExerciseGroup` → `ExerciseBlock` with implicit "individual" semantics, fix the group-level rest bug in the student workout engine, ship a seeder of common exercises, and polish icon-style buttons in the routine wizard.

**Architecture:** Six independently shippable phases. Phases 1–3 are breaking backend changes (migration + DTO + handler + UI). Phase 4 is a correctness fix in the student workout screen. Phase 5 is additive (SQL seed + endpoint + onboarding CTA). Phase 6 is cosmetic (new shared component + refactor of existing buttons).

**Tech Stack:** .NET 10, EF Core, MediatR, FluentValidation, PostgreSQL, MinIO, Angular 21 (standalone + signals), Tailwind, Lucide.

**Deferred (not in this plan):** Layout gap between sidebar and content on desktop — requires screenshot reproduction before implementing. Tracked as follow-up.

**Shipping order (recommended):**
1. Phase 4 — group-rest bug fix (correctness, smallest surface area)
2. Phase 1 — media model refactor
3. Phase 2 — block rename & implicit individual
4. Phase 3 — auto-cataloging
5. Phase 5 — seeder
6. Phase 6 — UI polish

Each phase ends with a green build + passing tests and is safe to merge on its own.

---

## File Map

| Action | File | Phase | Responsibility |
|---|---|---|---|
| Modify | `src/Kondix.Domain/Entities/CatalogExercise.cs` | 1 | Add `ImageUrl` field |
| Modify | `src/Kondix.Domain/Entities/Exercise.cs` | 1, 2 | Drop `VideoSource`/`VideoUrl`; rename FK `GroupId` → `BlockId` |
| Rename | `src/Kondix.Domain/Entities/ExerciseGroup.cs` → `ExerciseBlock.cs` | 2 | Rename entity and collection |
| Modify | `src/Kondix.Domain/Entities/Day.cs` | 2 | Rename `ExerciseGroups` → `Blocks` |
| Rename | `src/Kondix.Domain/Enums/GroupType.cs` → `BlockType.cs` | 2 | Drop `Single`; keep Superset/Triset/Circuit |
| Modify | `src/Kondix.Infrastructure/Persistence/Configurations/CatalogExerciseConfiguration.cs` | 1 | Map `ImageUrl` |
| Modify | `src/Kondix.Infrastructure/Persistence/Configurations/ExerciseConfiguration.cs` | 1, 2 | Drop video cols; rename FK |
| Rename | `ExerciseGroupConfiguration.cs` → `ExerciseBlockConfiguration.cs` | 2 | Retable `exercise_blocks`, column `block_type` |
| Modify | `src/Kondix.Infrastructure/Persistence/KondixDbContext.cs` | 2 | Rename `DbSet<ExerciseGroup>` → `DbSet<ExerciseBlock>` |
| Create | `src/Kondix.Infrastructure/Migrations/{ts}_AddCatalogExerciseImage.cs` | 1 | Column add + data copy + drop |
| Create | `src/Kondix.Infrastructure/Migrations/{ts}_RenameGroupsToBlocks.cs` | 2 | Rename table/columns/constraints |
| Modify | `src/Kondix.Application/DTOs/CatalogDtos.cs` | 1 | Add `ImageUrl` to `CatalogExerciseDto` |
| Modify | `src/Kondix.Application/DTOs/RoutineDtos.cs` | 1, 2 | Drop video fields on `ExerciseDto`; rename `ExerciseGroupDto` → `ExerciseBlockDto`; add `CatalogExerciseId` + `ImageUrl` |
| Modify | `src/Kondix.Application/Commands/Routines/CreateRoutineCommand.cs` | 1, 2, 3 | Drop video inputs; rename types; auto-catalog |
| Modify | `src/Kondix.Application/Commands/Routines/UpdateRoutineCommand.cs` | 1, 2, 3 | Same as create |
| Modify | `src/Kondix.Application/Commands/Routines/RoutineBuilder.cs` | 1, 2, 3 | Core rebuild logic |
| Modify | `src/Kondix.Application/Commands/Routines/DuplicateRoutineCommand.cs` | 1, 2 | Reuse builder; no video fields |
| Modify | `src/Kondix.Application/Queries/Routines/GetRoutineByIdQuery.cs` | 1, 2 | Project new DTOs; join catalog for `ImageUrl` |
| Modify | `src/Kondix.Application/Queries/StudentPortal/GetMyRoutineDetailQuery.cs` | 1, 2 | Project new DTOs |
| Modify | `src/Kondix.Application/Commands/Catalog/CreateCatalogExerciseCommand.cs` | 1 | Accept `ImageUrl` |
| Modify | `src/Kondix.Application/Commands/Catalog/UpdateCatalogExerciseCommand.cs` | 1 | Accept `ImageUrl` |
| Modify | `src/Kondix.Application/Queries/Catalog/SearchCatalogQuery.cs` | 1 | Return `ImageUrl` |
| Create | `src/Kondix.Application/Commands/Catalog/SeedCatalogCommand.cs` | 5 | Copy canonical exercises into trainer catalog |
| Modify | `src/Kondix.Api/Controllers/CatalogController.cs` | 1, 5 | Accept `ImageUrl`; add `POST /catalog/seed` |
| Modify | `src/Kondix.Api/Controllers/RoutinesController.cs` | 1, 2 | Update inline request DTOs |
| Create | `src/Kondix.Api/Controllers/ImagesController.cs` | 1 | `POST /api/v1/images/upload` for MinIO images |
| Modify | `kondix-web/src/app/features/trainer/catalog/feature/catalog-list.ts` | 1, 5 | Image upload UI; "Cargar ejercicios base" button |
| Modify | `kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts` | 1, 2, 3, 6 | Remove per-exercise video; rename to block; implicit individual; auto-cataloging; icon buttons |
| Modify | `kondix-web/src/app/features/student/feature/workout-overview.ts` | 4 | Consume block-level rest |
| Modify | `kondix-web/src/app/features/student/feature/exercise-logging.ts` | 1, 2, 4 | Read video/image from catalog; respect block rest |
| Create | `kondix-web/src/app/shared/ui/icon-button.ts` + `index.ts` | 6 | `<kx-icon-button>` ghost/primary variants |
| Modify | `kondix-web/src/app/shared/models/index.ts` | 1, 2 | Update DTO interfaces |
| Create | `setup/seed-catalog-exercises.sql` | 5 | Canonical 50-exercise list |
| Create | `setup/05-minio-images-bucket.sh` | 1 | Create `kondix-exercises` bucket |

---

## Cross-cutting conventions (read before starting any phase)

- **Backend tests:** Kondix has no `*.Tests` projects per inspection — this plan's backend tests are **integration-style E2E** via Playwright in `kondix-web/e2e/`. When a phase requires a behavioral backend test, add it under `kondix-web/e2e/` as a `.spec.ts` using the existing helpers in `kondix-web/e2e/fixtures/`.
- **Migrations:** Add with `dotnet ef migrations add <Name> --project src/Kondix.Infrastructure --startup-project src/Kondix.Api --output-dir Migrations`. Review the generated `Up`/`Down` before committing. Run `dotnet ef database update` in dev.
- **Schema:** `kondix` (not `gym`).
- **Frontend model types:** When adding a DTO on the backend, also update `kondix-web/src/app/shared/models/index.ts` so TypeScript usage stays consistent.
- **Commits:** one atomic commit per task step that ends with "Commit". Scope prefixes used in repo: `feat(...)`, `fix(...)`, `refactor(...)`, `chore(...)`, `test(...)`.

---

# PHASE 4 — Fix group-level rest bug in workout engine

The trainer can set `ExerciseBlock.RestSeconds` (formerly `ExerciseGroup.RestSeconds`) but the student workout screen only consumes set-level rest. When a block has 2+ exercises (Superset/Triset/Circuit), the round-level timer never fires.

**Shipping this first** so a fix is in production regardless of whether the larger refactors land.

### Task 4.1: Locate the rest-trigger path in the student workout

**Files:**
- Read: `kondix-web/src/app/features/student/feature/exercise-logging.ts`
- Read: `kondix-web/src/app/features/student/feature/workout-overview.ts`
- Read: `kondix-web/src/app/shared/ui/rest-timer.ts`

- [ ] **Step 1: Trace what `durationSeconds` comes from**

In `exercise-logging.ts`, find the `<kx-rest-timer [durationSeconds]="...">` binding and walk backward to its source signal. Confirm it's sourced from `ExerciseSet.restSeconds` only. Write findings in your scratchpad — do not edit yet.

### Task 4.2: Add block-rest test (E2E)

**Files:**
- Create: `kondix-web/e2e/05-student-block-rest.spec.ts`

- [ ] **Step 1: Write failing E2E test**

Use the existing `createRoutineViaApi` helper (see `kondix-web/e2e/fixtures/seed.ts`) to create a routine with one day containing ONE block of two exercises (Superset), each with 2 sets. Set `block.restSeconds = 90`. Assign that routine/program to a student. Log in as the student, start the workout, complete all exercises in round 1, and assert that the rest-timer component becomes visible with `aria-label` or text matching `1:30` (90 s).

```typescript
import { test, expect } from '@playwright/test';
import { seedTrainerWithRoutine, loginAsStudent, startWorkout, completeSet } from './fixtures/seed';

test('block rest fires after completing a superset round', async ({ page, request }) => {
  const { studentEmail, routineId } = await seedTrainerWithRoutine(request, {
    days: [{
      name: 'Día A',
      blocks: [{
        blockType: 'Superset',
        restSeconds: 90,
        exercises: [
          { name: 'Press banca', sets: [{ targetReps: '10', targetWeight: '60' }, { targetReps: '10', targetWeight: '60' }] },
          { name: 'Remo barra',  sets: [{ targetReps: '10', targetWeight: '50' }, { targetReps: '10', targetWeight: '50' }] },
        ],
      }],
    }],
  });

  await loginAsStudent(page, studentEmail);
  await startWorkout(page, routineId);

  // round 1: complete set 1 of exercise 1, then set 1 of exercise 2
  await completeSet(page, { exerciseIndex: 0, setIndex: 0 });
  await completeSet(page, { exerciseIndex: 1, setIndex: 0 });

  // block rest should now be visible
  await expect(page.locator('kx-rest-timer')).toContainText('1:30');
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd kondix-web
E2E_REDIS_CONTAINER=fidly-redis-1 npx playwright test 05-student-block-rest.spec.ts --project=chromium
```

Expected: FAIL (timer does not appear / shows set rest, not block rest).

- [ ] **Step 3: Commit the failing test**

```bash
git add kondix-web/e2e/05-student-block-rest.spec.ts
git commit -m "test(e2e): add failing test for block-level rest timer"
```

### Task 4.3: Implement block rest in exercise-logging.ts

**Files:**
- Modify: `kondix-web/src/app/features/student/feature/exercise-logging.ts`
- Modify: `kondix-web/src/app/features/student/feature/workout-overview.ts`

- [ ] **Step 1: Add a `nextRestSeconds` computed signal**

Goal: when the user taps "complete" on the LAST set of the LAST exercise within a block (and the block has 2+ exercises = Superset/Triset/Circuit), use `block.restSeconds`. Otherwise use the just-completed set's `restSeconds`.

Define the computed near the top of the component class (use the DTO naming from Phase 2 — if Phase 2 hasn't shipped, use `group` / `groupType` from current code):

```typescript
readonly nextRestSeconds = computed<number | null>(() => {
  const last = this.lastCompletedSet();
  if (!last) return null;
  const { block, exerciseIndex, setIndex } = last;
  if (!block) return null;
  const isLastExerciseInBlock = exerciseIndex === block.exercises.length - 1;
  const isLastSetOfExercise = setIndex === block.exercises[exerciseIndex].sets.length - 1;
  const isMultiExerciseBlock = block.exercises.length > 1;

  if (isMultiExerciseBlock && isLastExerciseInBlock && isLastSetOfExercise) {
    return block.restSeconds ?? null;
  }
  // also trigger block rest when completing the same-index set of the last exercise (round boundary)
  if (isMultiExerciseBlock && isLastExerciseInBlock) {
    return block.restSeconds ?? null;
  }
  return last.set.restSeconds ?? null;
});
```

- [ ] **Step 2: Wire the computed into the existing `<kx-rest-timer>` binding**

Replace the current `[durationSeconds]="..."` binding to use `nextRestSeconds()`:

```html
<kx-rest-timer
  *ngIf="nextRestSeconds() !== null && restActive()"
  [durationSeconds]="nextRestSeconds()!"
  [active]="restActive()"
  (finished)="onRestFinished()"
  (skip)="onRestSkip()" />
```

- [ ] **Step 3: Re-run the E2E test**

```bash
cd kondix-web
E2E_REDIS_CONTAINER=fidly-redis-1 npx playwright test 05-student-block-rest.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 4: Regression — run the full student suite**

```bash
E2E_REDIS_CONTAINER=fidly-redis-1 npx playwright test 04-trainer-routines.spec.ts --project=chromium
```

Expected: still passing (set-rest behavior unchanged for individual blocks).

- [ ] **Step 5: Commit**

```bash
git add kondix-web/src/app/features/student/feature/exercise-logging.ts kondix-web/src/app/features/student/feature/workout-overview.ts
git commit -m "fix(student): fire block-level rest timer on round boundary"
```

---

# PHASE 1 — Exercise media refactor (photo on catalog, drop video from routine)

### Task 1.1: Add `ImageUrl` to `CatalogExercise`

**Files:**
- Modify: `src/Kondix.Domain/Entities/CatalogExercise.cs`
- Modify: `src/Kondix.Infrastructure/Persistence/Configurations/CatalogExerciseConfiguration.cs`

- [ ] **Step 1: Add the domain field**

Edit `CatalogExercise.cs`. Insert `public string? ImageUrl { get; set; }` after the `VideoUrl` property (keep alphabetical / logical grouping).

- [ ] **Step 2: Configure the column**

Edit `CatalogExerciseConfiguration.cs`. After the `VideoUrl` mapping add:

```csharp
builder.Property(c => c.ImageUrl).HasMaxLength(500);
```

- [ ] **Step 3: Create migration**

```bash
dotnet ef migrations add AddCatalogExerciseImageUrl \
  --project src/Kondix.Infrastructure \
  --startup-project src/Kondix.Api \
  --output-dir Migrations
```

Review the generated `Up` — it should be a single `AddColumn` on `kondix.catalog_exercises`.

- [ ] **Step 4: Apply and verify**

```bash
dotnet ef database update --project src/Kondix.Infrastructure --startup-project src/Kondix.Api
```

Verify: `docker exec -e PGPASSWORD=dev fidly-postgres-1 psql -U celvo_user -d celvo -c "\d kondix.catalog_exercises"` shows `image_url`.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Domain/Entities/CatalogExercise.cs \
        src/Kondix.Infrastructure/Persistence/Configurations/CatalogExerciseConfiguration.cs \
        src/Kondix.Infrastructure/Migrations/
git commit -m "feat(catalog): add ImageUrl field to catalog exercises"
```

### Task 1.2: Create MinIO bucket `kondix-exercises` + images upload endpoint

**Files:**
- Create: `setup/05-minio-images-bucket.sh`
- Create: `src/Kondix.Api/Controllers/ImagesController.cs`

- [ ] **Step 1: Write the bucket-creation script**

Copy pattern from `setup/03-minio-bucket.sh`. Target bucket: `kondix-exercises`. Public-read policy.

```bash
#!/usr/bin/env bash
set -euo pipefail
docker exec kondix-minio-1 mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null || true
docker exec kondix-minio-1 mc mb --ignore-existing local/kondix-exercises
docker exec kondix-minio-1 mc anonymous set download local/kondix-exercises
echo "bucket kondix-exercises ready"
```

Run it locally.

- [ ] **Step 2: Add ImagesController**

Base on `src/Kondix.Api/Controllers/VideosController.cs`. Changes:
- Bucket: `kondix-exercises`
- Max size: 5 MB
- Allowed content types: `image/jpeg`, `image/png`, `image/webp`

```csharp
[ApiController]
[Route("api/v1/images")]
public sealed class ImagesController(IStorageService storage) : ControllerBase
{
    private static readonly string[] AllowedTypes = { "image/jpeg", "image/png", "image/webp" };
    private const long MaxSize = 5 * 1024 * 1024;

    [HttpPost("upload")]
    [RequestSizeLimit(MaxSize)]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0) return BadRequest(new { error = "Archivo requerido" });
        if (file.Length > MaxSize) return BadRequest(new { error = "Máximo 5 MB" });
        if (!AllowedTypes.Contains(file.ContentType)) return BadRequest(new { error = "Formato no soportado" });

        var ext = Path.GetExtension(file.FileName);
        var key = $"{Guid.NewGuid()}{ext}";
        await using var stream = file.OpenReadStream();
        var url = await storage.UploadAsync("kondix-exercises", key, stream, file.ContentType, ct);
        return Ok(new { url, key });
    }

    [HttpDelete("{key}")]
    public async Task<IActionResult> Delete(string key, CancellationToken ct)
    {
        await storage.DeleteAsync("kondix-exercises", key, ct);
        return NoContent();
    }
}
```

- [ ] **Step 3: Manual verification**

```bash
dotnet run --project src/Kondix.Api --urls http://localhost:5070
# in another shell:
curl -F "file=@test.jpg" http://localhost:5070/api/v1/images/upload -b cookies.txt
```

Expected: 200 with `{ url, key }`.

- [ ] **Step 4: Commit**

```bash
git add setup/05-minio-images-bucket.sh src/Kondix.Api/Controllers/ImagesController.cs
git commit -m "feat(storage): add kondix-exercises bucket and image upload endpoint"
```

### Task 1.3: Propagate `ImageUrl` through DTOs, handlers, controller

**Files:**
- Modify: `src/Kondix.Application/DTOs/CatalogDtos.cs`
- Modify: `src/Kondix.Application/Commands/Catalog/CreateCatalogExerciseCommand.cs`
- Modify: `src/Kondix.Application/Commands/Catalog/UpdateCatalogExerciseCommand.cs`
- Modify: `src/Kondix.Application/Queries/Catalog/SearchCatalogQuery.cs`
- Modify: `src/Kondix.Api/Controllers/CatalogController.cs`

- [ ] **Step 1: Extend `CatalogExerciseDto`**

```csharp
public sealed record CatalogExerciseDto(
    Guid Id,
    string Name,
    string? MuscleGroup,
    VideoSource VideoSource,
    string? VideoUrl,
    string? ImageUrl,
    string? Notes,
    DateTimeOffset UpdatedAt);
```

- [ ] **Step 2: Extend commands**

In both `CreateCatalogExerciseCommand.cs` and `UpdateCatalogExerciseCommand.cs`, add `string? ImageUrl` to the command record and assign it onto the entity in the handler.

- [ ] **Step 3: Extend query projection**

In `SearchCatalogQuery.cs`, add `c.ImageUrl` to the projection select.

- [ ] **Step 4: Update controller request record**

```csharp
public sealed record CatalogExerciseRequest(
    string Name,
    string? MuscleGroup,
    VideoSource VideoSource,
    string? VideoUrl,
    string? ImageUrl,
    string? Notes);
```

And pass `req.ImageUrl` into both commands.

- [ ] **Step 5: Build**

```bash
dotnet build Kondix.slnx
```

Expected: 0 warnings / 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/Kondix.Application src/Kondix.Api/Controllers/CatalogController.cs
git commit -m "feat(catalog): expose ImageUrl through DTO/command/query/controller"
```

### Task 1.4: Catalog UI — image upload + thumbnail

**Files:**
- Modify: `kondix-web/src/app/shared/models/index.ts`
- Modify: `kondix-web/src/app/features/trainer/catalog/feature/catalog-list.ts`

- [ ] **Step 1: Extend the TS interface**

In `shared/models/index.ts`, find `CatalogExercise` interface and add `imageUrl?: string`.

- [ ] **Step 2: Add form state**

In `catalog-list.ts` component state (near `formVideoUrl`), add:

```typescript
formImageUrl = '';
uploadingImage = false;
```

- [ ] **Step 3: Add upload handler**

Near the existing video-upload method (if absent, base on routine-wizard `onVideoUpload`):

```typescript
onImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  this.uploadingImage = true;
  const fd = new FormData();
  fd.append('file', file);
  this.api.upload<{ url: string; key: string }>('/images/upload', fd)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (res) => { this.formImageUrl = res.url; this.uploadingImage = false; },
      error: (err) => { this.toast.error(err.error?.error ?? 'Error subiendo imagen'); this.uploadingImage = false; },
    });
}
```

- [ ] **Step 4: Add form control**

Insert in the form area (after the video URL input), showing preview when uploaded:

```html
<div class="space-y-2">
  <label class="text-xs text-text-muted">Miniatura</label>
  @if (formImageUrl) {
    <div class="relative inline-block">
      <img [src]="formImageUrl" alt="miniatura" class="w-24 h-24 rounded-lg object-cover" />
      <button type="button" (click)="formImageUrl = ''"
        class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-danger text-white">×</button>
    </div>
  } @else {
    <label class="flex items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer">
      @if (uploadingImage) { <kx-spinner size="sm" /> }
      @else { <lucide-icon name="image-plus" class="w-6 h-6 text-text-muted" /> }
      <input type="file" accept="image/*" (change)="onImageUpload($event)" class="hidden" />
    </label>
  }
</div>
```

- [ ] **Step 5: Send `imageUrl` in save**

In the existing `save()` method body, add `imageUrl: this.formImageUrl || null` to the POST/PUT payload.

- [ ] **Step 6: Show thumbnail in the grid**

Find the card render (around lines 140–190 of current file). Replace the `h-20` placeholder `div` with:

```html
<div class="aspect-square bg-card-muted rounded-lg overflow-hidden">
  @if (ex.imageUrl) {
    <img [src]="ex.imageUrl" [alt]="ex.name" class="w-full h-full object-cover" />
  } @else {
    <div class="w-full h-full flex items-center justify-center text-text-muted">
      <lucide-icon name="dumbbell" class="w-8 h-8" />
    </div>
  }
</div>
```

- [ ] **Step 7: Manual test**

```bash
cd kondix-web && npm run start
```

- Navigate to `/trainer/catalog`
- Create new exercise, upload a JPG
- Confirm thumbnail appears in grid; reopen edit → image persists.

- [ ] **Step 8: Commit**

```bash
git add kondix-web/src/app/shared/models/index.ts \
        kondix-web/src/app/features/trainer/catalog/feature/catalog-list.ts
git commit -m "feat(catalog): upload and display exercise thumbnails"
```

### Task 1.5: Drop `VideoSource` / `VideoUrl` from routine `Exercise` entity

**Files:**
- Modify: `src/Kondix.Domain/Entities/Exercise.cs`
- Modify: `src/Kondix.Infrastructure/Persistence/Configurations/ExerciseConfiguration.cs`
- Modify: `src/Kondix.Application/DTOs/RoutineDtos.cs`
- Modify: `src/Kondix.Application/Commands/Routines/CreateRoutineCommand.cs`
- Modify: `src/Kondix.Application/Commands/Routines/UpdateRoutineCommand.cs`
- Modify: `src/Kondix.Application/Commands/Routines/RoutineBuilder.cs`
- Modify: `src/Kondix.Application/Queries/Routines/GetRoutineByIdQuery.cs`
- Modify: `src/Kondix.Application/Queries/StudentPortal/GetMyRoutineDetailQuery.cs`

> **Context:** After this task, `Exercise` inside a routine carries only `Name`, `Notes`, `Tempo`, `SortOrder`, `CatalogExerciseId`, `Sets`. All media comes from the linked catalog row. Duplication gone.

- [ ] **Step 1: Remove entity properties**

In `Exercise.cs`, delete the `VideoSource` and `VideoUrl` properties.

- [ ] **Step 2: Remove EF mapping**

In `ExerciseConfiguration.cs`, delete the `VideoSource` and `VideoUrl` mapping lines.

- [ ] **Step 3: Update `ExerciseDto`**

Replace with:

```csharp
public sealed record ExerciseDto(
    Guid Id,
    string Name,
    string? Notes,
    string? Tempo,
    Guid? CatalogExerciseId,
    VideoSource VideoSource,
    string? VideoUrl,
    string? ImageUrl,
    List<ExerciseSetDto> Sets);
```

The three media fields (`VideoSource`, `VideoUrl`, `ImageUrl`) are now **read-only projections** sourced from `CatalogExercise`.

- [ ] **Step 4: Update `CreateExerciseInput`**

Drop `VideoSource VideoSource, string? VideoUrl` from the record; ensure `Guid? CatalogExerciseId` is present:

```csharp
public sealed record CreateExerciseInput(
    string Name,
    string? Notes,
    string? Tempo,
    Guid? CatalogExerciseId,
    List<CreateExerciseSetInput> Sets);
```

- [ ] **Step 5: Update `RoutineBuilder`**

In `RoutineBuilder.cs`, remove the assignments of `VideoSource` / `VideoUrl` on the `Exercise` entity. Keep `CatalogExerciseId` assignment.

- [ ] **Step 6: Update query projections**

In `GetRoutineByIdQuery.cs` and `GetMyRoutineDetailQuery.cs`, project exercises by joining against `CatalogExercises` to read media:

```csharp
.Select(e => new ExerciseDto(
    e.Id,
    e.Name,
    e.Notes,
    e.Tempo,
    e.CatalogExerciseId,
    e.CatalogExerciseId.HasValue
        ? db.CatalogExercises.Where(c => c.Id == e.CatalogExerciseId).Select(c => c.VideoSource).FirstOrDefault()
        : VideoSource.None,
    e.CatalogExerciseId.HasValue
        ? db.CatalogExercises.Where(c => c.Id == e.CatalogExerciseId).Select(c => c.VideoUrl).FirstOrDefault()
        : null,
    e.CatalogExerciseId.HasValue
        ? db.CatalogExercises.Where(c => c.Id == e.CatalogExerciseId).Select(c => c.ImageUrl).FirstOrDefault()
        : null,
    e.Sets.OrderBy(s => s.SortOrder).Select(s => new ExerciseSetDto(...)).ToList()
))
```

(If the project already has a join pattern for catalog, reuse it rather than subquery per-column.)

- [ ] **Step 7: Create migration that copies data then drops**

```bash
dotnet ef migrations add RemoveRoutineExerciseVideoFields \
  --project src/Kondix.Infrastructure --startup-project src/Kondix.Api --output-dir Migrations
```

Edit the generated `Up` to copy data before dropping columns:

```csharp
protected override void Up(MigrationBuilder m)
{
    // Best-effort: for each routine exercise that has a video_url and a linked catalog,
    // copy the video into the catalog if the catalog's video is null.
    m.Sql(@"
        UPDATE kondix.catalog_exercises c
        SET video_source = e.video_source,
            video_url = e.video_url
        FROM kondix.exercises e
        WHERE e.catalog_exercise_id = c.id
          AND e.video_url IS NOT NULL
          AND (c.video_url IS NULL OR c.video_url = '');
    ");
    m.DropColumn(name: "video_source", schema: "kondix", table: "exercises");
    m.DropColumn(name: "video_url", schema: "kondix", table: "exercises");
}

protected override void Down(MigrationBuilder m)
{
    m.AddColumn<string>(name: "video_source", schema: "kondix", table: "exercises", nullable: false, defaultValue: "None", maxLength: 50);
    m.AddColumn<string>(name: "video_url", schema: "kondix", table: "exercises", nullable: true, maxLength: 500);
}
```

- [ ] **Step 8: Apply**

```bash
dotnet ef database update --project src/Kondix.Infrastructure --startup-project src/Kondix.Api
```

- [ ] **Step 9: Build**

```bash
dotnet build Kondix.slnx
```

Expected: green.

- [ ] **Step 10: Commit**

```bash
git add src/Kondix.Domain src/Kondix.Infrastructure src/Kondix.Application
git commit -m "refactor(routines): drop per-routine exercise video; media lives only on catalog"
```

### Task 1.6: Routine wizard — remove per-exercise video UI

**Files:**
- Modify: `kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts`
- Modify: `kondix-web/src/app/shared/models/index.ts`

- [ ] **Step 1: Update TS models**

Remove `videoSource` and `videoUrl` from the `Exercise` interface in `shared/models/index.ts`. Keep `catalogExerciseId?: string`, `imageUrl?: string` (read-only projection). Add `videoSource?: VideoSource; videoUrl?: string` as read-only projection fields (present but not edited).

- [ ] **Step 2: Remove the wizard state fields**

In `routine-wizard.ts` `WizardExercise` interface, delete `videoSource`, `videoUrl`, `videoInputMode`, `uploading`, `showVideo`. Delete all methods that mutate these fields: `toggleVideo`, `setVideoMode`, `onVideoUpload`.

- [ ] **Step 3: Remove the template block**

Delete lines for the Video button (~326–329) and the entire Video section (~337–371). Also remove the "Video" text-button control.

- [ ] **Step 4: Show catalog image + video as preview (read-only)**

In place of the removed video UI, show a small preview row when an exercise is linked to a catalog entry with media:

```html
@if (ex.imageUrl || ex.videoUrl) {
  <div class="flex items-center gap-2 mx-3 mb-2 text-xs text-text-muted">
    @if (ex.imageUrl) {
      <img [src]="ex.imageUrl" class="w-10 h-10 rounded object-cover" />
    }
    @if (ex.videoUrl) {
      <span class="flex items-center gap-1"><lucide-icon name="play-circle" class="w-3.5 h-3.5" /> video</span>
    }
    <span class="text-text-subtle">(editable en catálogo)</span>
  </div>
}
```

- [ ] **Step 5: Update the save() payload**

Remove `videoSource` and `videoUrl` from the exercise object sent to the API. Keep `catalogExerciseId`.

- [ ] **Step 6: Manual test**

- Open the wizard, create a routine with exercises, confirm no Video button exists.
- If an exercise is selected from the catalog and the catalog has a thumbnail/video, the preview row shows both.

- [ ] **Step 7: Commit**

```bash
git add kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts \
        kondix-web/src/app/shared/models/index.ts
git commit -m "refactor(wizard): remove per-exercise video editor; preview media from catalog"
```

### Task 1.7: Student workout screen — read media from catalog

**Files:**
- Modify: `kondix-web/src/app/features/student/feature/exercise-logging.ts`

- [ ] **Step 1: Update video/image source**

Find the video card (~lines 84–99 of current file). The template currently reads `exercise.videoUrl`. Since the DTO now projects media from the catalog, this keeps working — but also add the thumbnail above:

```html
@if (exercise.imageUrl) {
  <img [src]="exercise.imageUrl" [alt]="exercise.name" class="w-full h-40 rounded-xl object-cover mb-3" />
}
@if (exercise.videoUrl) {
  <!-- existing video card block unchanged -->
}
```

- [ ] **Step 2: Manual test**

Log in as student, start workout. Exercise screen should show the thumbnail (when catalog has one) and the video card (when catalog has a URL).

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/student/feature/exercise-logging.ts
git commit -m "feat(student): show exercise thumbnail on logging screen"
```

---

# PHASE 2 — Rename `ExerciseGroup` → `ExerciseBlock` + implicit Individual (Option C)

`GroupType.Single` disappears. A block with 1 exercise = implicitly "individual" (no selector shown). Adding a 2nd exercise into the same block prompts for a block type (Superset/Triset/Circuit).

### Task 2.1: Domain + EF rename

**Files:**
- Rename: `src/Kondix.Domain/Entities/ExerciseGroup.cs` → `ExerciseBlock.cs`
- Modify: `src/Kondix.Domain/Entities/Day.cs`
- Modify: `src/Kondix.Domain/Entities/Exercise.cs`
- Rename: `src/Kondix.Domain/Enums/GroupType.cs` → `BlockType.cs`
- Rename: `src/Kondix.Infrastructure/Persistence/Configurations/ExerciseGroupConfiguration.cs` → `ExerciseBlockConfiguration.cs`
- Modify: `src/Kondix.Infrastructure/Persistence/Configurations/ExerciseConfiguration.cs`
- Modify: `src/Kondix.Infrastructure/Persistence/KondixDbContext.cs`

- [ ] **Step 1: Rename the enum and drop `Single`**

```csharp
// BlockType.cs
public enum BlockType { Superset, Triset, Circuit }
```

- [ ] **Step 2: Rename the entity**

`ExerciseGroup` class → `ExerciseBlock`. Rename `GroupType` property → `BlockType` (of type `BlockType`). Rename FK property on `Exercise` from `GroupId` → `BlockId`, and the navigation `Group` → `Block`. Rename `Day.ExerciseGroups` → `Day.Blocks`.

Keep `RestSeconds` and `SortOrder` as-is.

- [ ] **Step 3: Update EF configurations**

In the renamed `ExerciseBlockConfiguration.cs`:
```csharp
builder.ToTable("exercise_blocks");
builder.HasIndex(b => b.DayId);
builder.Property(b => b.BlockType).HasConversion<string>().HasMaxLength(50);
builder.Property(b => b.RestSeconds).HasDefaultValue(90);
```

In `ExerciseConfiguration.cs`, change FK setup from `GroupId` to `BlockId`.

- [ ] **Step 4: Update DbContext**

Rename `DbSet<ExerciseGroup> ExerciseGroups` → `DbSet<ExerciseBlock> Blocks`.

- [ ] **Step 5: Build**

```bash
dotnet build Kondix.slnx
```

This will spew errors across Application layer — expected, fixed in Task 2.2.

- [ ] **Step 6: Commit (may be broken build — OK, next task completes it)**

Do **not** commit yet. Continue to Task 2.2 and commit together.

### Task 2.2: Application layer rename

**Files:**
- Modify: `src/Kondix.Application/DTOs/RoutineDtos.cs`
- Modify: `src/Kondix.Application/Commands/Routines/CreateRoutineCommand.cs`
- Modify: `src/Kondix.Application/Commands/Routines/UpdateRoutineCommand.cs`
- Modify: `src/Kondix.Application/Commands/Routines/RoutineBuilder.cs`
- Modify: `src/Kondix.Application/Commands/Routines/DuplicateRoutineCommand.cs`
- Modify: `src/Kondix.Application/Queries/Routines/GetRoutineByIdQuery.cs`
- Modify: `src/Kondix.Application/Queries/StudentPortal/GetMyRoutineDetailQuery.cs`
- Modify: `src/Kondix.Application/Queries/Programs/*` (any that touch groups)
- Modify: `src/Kondix.Api/Controllers/RoutinesController.cs`

- [ ] **Step 1: Rename DTOs**

```csharp
public sealed record ExerciseBlockDto(
    Guid Id,
    BlockType? BlockType,          // null when block has 1 exercise (implicit individual)
    int RestSeconds,
    List<ExerciseDto> Exercises);

public sealed record DayDto(
    Guid Id,
    string Name,
    List<ExerciseBlockDto> Blocks);
```

- [ ] **Step 2: Rename input records**

```csharp
public sealed record CreateExerciseBlockInput(
    BlockType? BlockType,
    int RestSeconds,
    List<CreateExerciseInput> Exercises);

public sealed record CreateDayInput(
    string Name,
    List<CreateExerciseBlockInput> Blocks);
```

- [ ] **Step 3: Update `RoutineBuilder`**

Replace all `Group`/`group` identifiers with `Block`/`block`. When persisting: if `BlockType is null`, set `BlockType.Superset` as a default placeholder ONLY when block has 2+ exercises; if block has exactly 1 exercise, leave the DB field nullable. Update the entity+config to allow `BlockType` as nullable:

```csharp
// ExerciseBlock.cs
public BlockType? BlockType { get; set; }
```

```csharp
// ExerciseBlockConfiguration.cs
builder.Property(b => b.BlockType).HasConversion<string>().HasMaxLength(50).IsRequired(false);
```

- [ ] **Step 4: Update projections**

In `GetRoutineByIdQuery.cs` and `GetMyRoutineDetailQuery.cs`, replace `Groups` with `Blocks` and `group.GroupType` with `block.BlockType`.

- [ ] **Step 5: Update controller request records**

In `RoutinesController.cs`, the inline `CreateRoutineRequest` nested records use `Groups`. Rename to `Blocks`, and the nested `GroupType` → `BlockType?`.

- [ ] **Step 6: Build green**

```bash
dotnet build Kondix.slnx
```

Expected: 0 errors.

- [ ] **Step 7: Commit Tasks 2.1 + 2.2 together**

```bash
git add src/Kondix.Domain src/Kondix.Infrastructure src/Kondix.Application src/Kondix.Api
git commit -m "refactor(routines): rename ExerciseGroup to ExerciseBlock, make BlockType nullable"
```

### Task 2.3: Migration — rename table and columns

**Files:**
- Create: `src/Kondix.Infrastructure/Migrations/{ts}_RenameGroupsToBlocks.cs`

- [ ] **Step 1: Generate migration**

```bash
dotnet ef migrations add RenameGroupsToBlocks \
  --project src/Kondix.Infrastructure --startup-project src/Kondix.Api --output-dir Migrations
```

- [ ] **Step 2: Review & adjust the generated `Up`**

EF may generate drop+recreate. Replace with explicit renames so existing data survives:

```csharp
protected override void Up(MigrationBuilder m)
{
    m.Sql("ALTER TABLE kondix.exercise_groups RENAME TO exercise_blocks;");
    m.Sql("ALTER TABLE kondix.exercise_blocks RENAME COLUMN group_type TO block_type;");
    m.Sql("ALTER TABLE kondix.exercises RENAME COLUMN group_id TO block_id;");

    // Indexes / constraints
    m.Sql("ALTER INDEX kondix.pk_exercise_groups RENAME TO pk_exercise_blocks;");
    m.Sql("ALTER INDEX kondix.ix_exercise_groups_day_id RENAME TO ix_exercise_blocks_day_id;");
    m.Sql("ALTER INDEX kondix.ix_exercises_group_id RENAME TO ix_exercises_block_id;");
    m.Sql("ALTER TABLE kondix.exercises DROP CONSTRAINT fk_exercises_exercise_groups_group_id;");
    m.Sql(@"ALTER TABLE kondix.exercises
        ADD CONSTRAINT fk_exercises_exercise_blocks_block_id
        FOREIGN KEY (block_id) REFERENCES kondix.exercise_blocks(id) ON DELETE CASCADE;");
    m.Sql("ALTER TABLE kondix.exercise_blocks DROP CONSTRAINT fk_exercise_groups_days_day_id;");
    m.Sql(@"ALTER TABLE kondix.exercise_blocks
        ADD CONSTRAINT fk_exercise_blocks_days_day_id
        FOREIGN KEY (day_id) REFERENCES kondix.days(id) ON DELETE CASCADE;");

    // Drop 'Single' as a valid block_type — collapse to NULL
    m.Sql(@"UPDATE kondix.exercise_blocks
            SET block_type = NULL
            WHERE block_type = 'Single';");
    // Also collapse any block with exactly 1 exercise to NULL regardless
    m.Sql(@"UPDATE kondix.exercise_blocks b
            SET block_type = NULL
            WHERE (SELECT COUNT(*) FROM kondix.exercises e WHERE e.block_id = b.id) = 1;");

    // Now enforce nullability
    m.AlterColumn<string>(
        name: "block_type", schema: "kondix", table: "exercise_blocks",
        type: "character varying(50)", maxLength: 50, nullable: true,
        oldClrType: typeof(string), oldType: "character varying(50)", oldMaxLength: 50, oldNullable: false);
}

protected override void Down(MigrationBuilder m)
{
    // Reverse the renames; NULL block_type → 'Single' for roundtrip
    m.Sql("UPDATE kondix.exercise_blocks SET block_type = 'Single' WHERE block_type IS NULL;");
    m.AlterColumn<string>(
        name: "block_type", schema: "kondix", table: "exercise_blocks",
        type: "character varying(50)", maxLength: 50, nullable: false,
        oldClrType: typeof(string), oldType: "character varying(50)", oldMaxLength: 50, oldNullable: true);
    m.Sql("ALTER TABLE kondix.exercise_blocks RENAME COLUMN block_type TO group_type;");
    m.Sql("ALTER TABLE kondix.exercise_blocks RENAME TO exercise_groups;");
    m.Sql("ALTER TABLE kondix.exercises RENAME COLUMN block_id TO group_id;");
    // (indexes & constraints renamed back analogously)
}
```

- [ ] **Step 3: Apply**

```bash
dotnet ef database update --project src/Kondix.Infrastructure --startup-project src/Kondix.Api
```

Verify:

```bash
docker exec -e PGPASSWORD=dev fidly-postgres-1 psql -U celvo_user -d celvo -c "\d kondix.exercise_blocks"
```

- [ ] **Step 4: Commit**

```bash
git add src/Kondix.Infrastructure/Migrations/
git commit -m "chore(db): rename exercise_groups to exercise_blocks; nullable block_type"
```

### Task 2.4: Frontend — rename + implicit individual UX

**Files:**
- Modify: `kondix-web/src/app/shared/models/index.ts`
- Modify: `kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts`
- Modify: `kondix-web/src/app/features/student/feature/exercise-logging.ts`
- Modify: `kondix-web/src/app/features/student/feature/workout-overview.ts`

- [ ] **Step 1: Update TS models**

```typescript
export type BlockType = 'Superset' | 'Triset' | 'Circuit';

export interface ExerciseBlock {
  id: string;
  blockType: BlockType | null;
  restSeconds: number;
  exercises: Exercise[];
}

export interface Day {
  id: string;
  name: string;
  blocks: ExerciseBlock[];
}
```

Rename all usages of `group` / `groups` / `GroupType` in the web app. Run a global search to catch stragglers.

- [ ] **Step 2: Rename wizard state**

In `routine-wizard.ts`:
- `WizardGroup` → `WizardBlock`
- `groupType` → `blockType` (nullable)
- All methods `updateGroupRest`, `addGroup`, `removeGroup`, etc. → `updateBlockRest`, `addBlock`, `removeBlock`

- [ ] **Step 3: UX — implicit individual**

In the template, the current row renders:
```html
<select ...>Individual/Superset/Triset/Circuit</select>
<input ... placeholder="90" />
```

Change the render logic: the selector and the rest input only appear when the block has **2 or more** exercises.

```html
@if (block.exercises.length > 1) {
  <div class="flex items-center gap-2">
    <select [ngModel]="block.blockType ?? 'Superset'" (ngModelChange)="updateBlockType(bi, $event)"
      class="select-styled">
      <option value="Superset">Superset</option>
      <option value="Triset">Triset</option>
      <option value="Circuit">Circuito</option>
    </select>
    <input type="number" [ngModel]="block.restSeconds" (ngModelChange)="updateBlockRest(bi, $event)"
      class="... w-16 text-center" placeholder="90" />
    <span class="text-text-muted text-xs">seg entre rondas</span>
  </div>
}
```

- [ ] **Step 4: Add "+ Unir a superset" interaction**

When adding an exercise, instead of two buttons ("+ Agregar ejercicio" and "+ Agregar grupo"), show one primary action and an option to attach into an existing block:

```html
<!-- after the last exercise in the block -->
<div class="flex gap-2">
  <button (click)="addExerciseToBlock(bi)" class="...">+ Agregar al bloque</button>
  <button (click)="addStandaloneExercise(di)" class="...">+ Nuevo ejercicio</button>
</div>
```

`addExerciseToBlock(bi)` appends to `day.blocks[bi].exercises`. When the block reaches 2 exercises, the `@if` above automatically reveals the selector with `blockType = null` — the first-time interaction should default to `Superset`:

```typescript
addExerciseToBlock(bi: number) {
  const block = this.currentDay().blocks[bi];
  block.exercises.push(this.emptyExercise());
  if (block.exercises.length === 2 && block.blockType === null) {
    block.blockType = 'Superset';
  }
}

addStandaloneExercise(di: number) {
  this.days.update(days => {
    days[di].blocks.push({ id: newId(), blockType: null, restSeconds: 90, exercises: [this.emptyExercise()] });
    return [...days];
  });
}
```

- [ ] **Step 5: Save() payload**

Update the payload construction to send `blockType: block.exercises.length > 1 ? (block.blockType ?? 'Superset') : null` and `blocks` instead of `groups`.

- [ ] **Step 6: Student screens rename**

In `exercise-logging.ts` and `workout-overview.ts`, replace all references to `group`/`groups`/`groupType` with the new names. The Phase 4 `nextRestSeconds` computed uses `block` now.

- [ ] **Step 7: Run existing E2E suite**

```bash
cd kondix-web
E2E_REDIS_CONTAINER=fidly-redis-1 npx playwright test 04-trainer-routines.spec.ts --project=chromium
E2E_REDIS_CONTAINER=fidly-redis-1 npx playwright test 05-student-block-rest.spec.ts --project=chromium
```

Expected: all passing (helpers in `fixtures/seed.ts` may need a rename — grep for `groups:`, `groupType:` and rename).

- [ ] **Step 8: Commit**

```bash
git add kondix-web/ 
git commit -m "refactor(wizard): rename groups to blocks; hide selector for single-exercise blocks"
```

---

# PHASE 3 — Auto-catalog exercises on routine save

Before: typing a free-text exercise name in the wizard results in an uncatalogued routine-exercise.
After: saving a routine automatically upserts any uncatalogued exercise into the trainer's catalog and sets `CatalogExerciseId` on the routine exercise.

### Task 3.1: Implement auto-upsert in `RoutineBuilder`

**Files:**
- Modify: `src/Kondix.Application/Commands/Routines/RoutineBuilder.cs`
- Modify: `src/Kondix.Application/Commands/Routines/CreateRoutineCommand.cs`
- Modify: `src/Kondix.Application/Commands/Routines/UpdateRoutineCommand.cs`

- [ ] **Step 1: Add upsert helper**

Add a new method in `RoutineBuilder`:

```csharp
public static async Task<Guid> EnsureCatalogEntryAsync(
    IKondixDbContext db, Guid trainerId, string name, Guid? catalogExerciseId,
    CancellationToken ct)
{
    if (catalogExerciseId is Guid existing) return existing;

    var trimmed = name.Trim();
    var match = await db.CatalogExercises
        .Where(c => c.TrainerId == trainerId && c.IsActive && EF.Functions.ILike(c.Name, trimmed))
        .Select(c => (Guid?)c.Id)
        .FirstOrDefaultAsync(ct);
    if (match is Guid found) return found;

    var entity = new CatalogExercise {
        TrainerId = trainerId,
        Name = trimmed,
        IsActive = true,
        UpdatedAt = DateTimeOffset.UtcNow,
        VideoSource = VideoSource.None,
    };
    db.CatalogExercises.Add(entity);
    return entity.Id;
}
```

- [ ] **Step 2: Make `BuildDays` async and call the helper**

Change `BuildDays` signature to accept `db`, `trainerId`, `ct`, and make it async. Call `EnsureCatalogEntryAsync` for each exercise; set `exercise.CatalogExerciseId = <result>`.

- [ ] **Step 3: Update both handlers**

In `CreateRoutineCommand.cs` and `UpdateRoutineCommand.cs`, update the call to `BuildDays` to pass `db`, `trainerId`, and `cancellationToken`, and await. Single `SaveChangesAsync` at the end covers both catalog upserts and routine persistence (EF will insert catalog entries before committing because of the call order and `Add`).

- [ ] **Step 4: Build**

```bash
dotnet build Kondix.slnx
```

- [ ] **Step 5: Write E2E test for auto-catalog**

**File:** `kondix-web/e2e/06-routine-autocatalog.spec.ts`

```typescript
test('saving a routine upserts uncatalogued exercises', async ({ page, request }) => {
  const { trainerEmail, trainerToken } = await seedTrainer(request);
  const routineBody = {
    name: 'Test Routine',
    days: [{
      name: 'Día A',
      blocks: [{
        blockType: null,
        restSeconds: 90,
        exercises: [{ name: 'Jefferson Curl', catalogExerciseId: null, sets: [{ setType: 'Effective', targetReps: '10' }] }],
      }],
    }],
    tags: [],
  };
  const res = await request.post('/api/v1/routines', { data: routineBody, headers: { Cookie: trainerToken } });
  expect(res.ok()).toBeTruthy();

  // check catalog now has "Jefferson Curl"
  const catalog = await request.get('/api/v1/catalog?q=Jefferson', { headers: { Cookie: trainerToken } });
  const items = await catalog.json();
  expect(items.some((x: { name: string }) => x.name === 'Jefferson Curl')).toBe(true);
});
```

Run:
```bash
E2E_REDIS_CONTAINER=fidly-redis-1 npx playwright test 06-routine-autocatalog.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/Kondix.Application kondix-web/e2e/06-routine-autocatalog.spec.ts
git commit -m "feat(routines): auto-upsert uncatalogued exercises into trainer catalog on save"
```

### Task 3.2: Wizard UX — badge "nuevo" for uncatalogued names

**Files:**
- Modify: `kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts`

- [ ] **Step 1: Show a hint when free-text**

Next to the exercise name input, when `ex.catalogExerciseId` is null AND `ex.name.trim()` is non-empty, render a small badge:

```html
@if (!ex.catalogExerciseId && ex.name.trim().length > 1) {
  <span class="kx-badge kx-badge-warn" title="Se agregará al catálogo al guardar">
    <lucide-icon name="sparkles" class="w-3 h-3" /> nuevo
  </span>
}
```

- [ ] **Step 2: Clear when selected from catalog**

Ensure `selectCatalogExercise` sets `ex.catalogExerciseId` so the badge disappears.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts
git commit -m "feat(wizard): show 'nuevo' badge for exercises about to be catalogued"
```

---

# PHASE 5 — Seeder of common exercises

### Task 5.1: Write the seed SQL

**Files:**
- Create: `setup/seed-catalog-exercises.sql`

- [ ] **Step 1: List ~50 canonical exercises**

Create the file with the following structure. The list below is the final content — use it verbatim:

```sql
-- Canonical catalog exercises. Inserted per-trainer by SeedCatalogCommand.
-- Placeholder trainer_id = '{{TRAINER_ID}}' — replaced at runtime.

INSERT INTO kondix.catalog_exercises (id, trainer_id, name, muscle_group, video_source, video_url, image_url, notes, is_active, updated_at, created_at)
VALUES
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Press banca',           'Pecho',    'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Press inclinado',       'Pecho',    'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Aperturas con mancuernas','Pecho', 'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Fondos en paralelas',   'Pecho',    'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Sentadilla libre',      'Piernas',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Sentadilla búlgara',    'Piernas',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Prensa',                'Piernas',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Extensiones de cuádriceps','Piernas','None',NULL,NULL,NULL,true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Curl femoral',          'Piernas',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Peso muerto',           'Espalda',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Peso muerto rumano',    'Espalda',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Dominadas',             'Espalda',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Jalón al pecho',        'Espalda',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Remo con barra',        'Espalda',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Remo con mancuerna',    'Espalda',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Remo en polea baja',    'Espalda',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Pull-over con mancuerna','Espalda', 'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Press militar',         'Hombro',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Press Arnold',          'Hombro',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Elevaciones laterales', 'Hombro',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Elevaciones frontales', 'Hombro',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Pájaros / reverse fly', 'Hombro',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Encogimientos',         'Hombro',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Curl de bíceps con barra','Brazos', 'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Curl martillo',         'Brazos',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Curl predicador',       'Brazos',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Extensiones de tríceps en polea','Brazos','None',NULL,NULL,NULL,true,now(),now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Press francés',         'Brazos',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Fondos entre bancos',   'Brazos',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Plancha',               'Core',     'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Plancha lateral',       'Core',     'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Crunch',                'Core',     'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Elevaciones de piernas colgado','Core','None',NULL,NULL,NULL,true,now(),now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Rueda abdominal',       'Core',     'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Pallof press',          'Core',     'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Hip thrust',            'Glúteos',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Sentadilla goblet',     'Glúteos',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Patada de glúteo',      'Glúteos',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Abducción en máquina',  'Glúteos',  'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Caminadora',            'Cardio',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Bicicleta estática',    'Cardio',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Elíptica',              'Cardio',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Remoergómetro',         'Cardio',   'None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Burpees',               'Funcional','None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Kettlebell swing',      'Funcional','None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Turkish get-up',        'Funcional','None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Battle ropes',          'Funcional','None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Movilidad de hombros',  'Movilidad','None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Movilidad de caderas',  'Movilidad','None', NULL, NULL, NULL, true, now(), now()),
  (gen_random_uuid(), '{{TRAINER_ID}}', 'Estiramientos isquios', 'Movilidad','None', NULL, NULL, NULL, true, now(), now());
```

- [ ] **Step 2: Commit**

```bash
git add setup/seed-catalog-exercises.sql
git commit -m "chore(setup): add canonical catalog exercises seed"
```

### Task 5.2: `SeedCatalogCommand`

**Files:**
- Create: `src/Kondix.Application/Commands/Catalog/SeedCatalogCommand.cs`
- Modify: `src/Kondix.Api/Controllers/CatalogController.cs`

- [ ] **Step 1: Define canonical list in C# (mirror of SQL)**

Rather than executing raw SQL from Application layer (recall cross-project gotcha), build the list in C#.

```csharp
public sealed record SeedCatalogCommand(Guid TrainerId) : IRequest<int>;

public sealed class SeedCatalogCommandHandler(IKondixDbContext db) : IRequestHandler<SeedCatalogCommand, int>
{
    private static readonly (string Name, string Muscle)[] Canonical = new[]
    {
        ("Press banca", "Pecho"),
        ("Press inclinado", "Pecho"),
        ("Aperturas con mancuernas", "Pecho"),
        ("Fondos en paralelas", "Pecho"),
        ("Sentadilla libre", "Piernas"),
        ("Sentadilla búlgara", "Piernas"),
        ("Prensa", "Piernas"),
        ("Extensiones de cuádriceps", "Piernas"),
        ("Curl femoral", "Piernas"),
        ("Peso muerto", "Espalda"),
        ("Peso muerto rumano", "Espalda"),
        ("Dominadas", "Espalda"),
        ("Jalón al pecho", "Espalda"),
        ("Remo con barra", "Espalda"),
        ("Remo con mancuerna", "Espalda"),
        ("Remo en polea baja", "Espalda"),
        ("Pull-over con mancuerna", "Espalda"),
        ("Press militar", "Hombro"),
        ("Press Arnold", "Hombro"),
        ("Elevaciones laterales", "Hombro"),
        ("Elevaciones frontales", "Hombro"),
        ("Pájaros / reverse fly", "Hombro"),
        ("Encogimientos", "Hombro"),
        ("Curl de bíceps con barra", "Brazos"),
        ("Curl martillo", "Brazos"),
        ("Curl predicador", "Brazos"),
        ("Extensiones de tríceps en polea", "Brazos"),
        ("Press francés", "Brazos"),
        ("Fondos entre bancos", "Brazos"),
        ("Plancha", "Core"),
        ("Plancha lateral", "Core"),
        ("Crunch", "Core"),
        ("Elevaciones de piernas colgado", "Core"),
        ("Rueda abdominal", "Core"),
        ("Pallof press", "Core"),
        ("Hip thrust", "Glúteos"),
        ("Sentadilla goblet", "Glúteos"),
        ("Patada de glúteo", "Glúteos"),
        ("Abducción en máquina", "Glúteos"),
        ("Caminadora", "Cardio"),
        ("Bicicleta estática", "Cardio"),
        ("Elíptica", "Cardio"),
        ("Remoergómetro", "Cardio"),
        ("Burpees", "Funcional"),
        ("Kettlebell swing", "Funcional"),
        ("Turkish get-up", "Funcional"),
        ("Battle ropes", "Funcional"),
        ("Movilidad de hombros", "Movilidad"),
        ("Movilidad de caderas", "Movilidad"),
        ("Estiramientos isquios", "Movilidad"),
    };

    public async Task<int> Handle(SeedCatalogCommand request, CancellationToken ct)
    {
        var existingNames = await db.CatalogExercises
            .Where(c => c.TrainerId == request.TrainerId)
            .Select(c => c.Name.ToLower())
            .ToListAsync(ct);
        var set = existingNames.ToHashSet();

        var inserted = 0;
        foreach (var (name, muscle) in Canonical)
        {
            if (set.Contains(name.ToLower())) continue;
            db.CatalogExercises.Add(new CatalogExercise {
                TrainerId = request.TrainerId,
                Name = name,
                MuscleGroup = muscle,
                IsActive = true,
                VideoSource = VideoSource.None,
                UpdatedAt = DateTimeOffset.UtcNow,
            });
            inserted++;
        }
        await db.SaveChangesAsync(ct);
        return inserted;
    }
}
```

- [ ] **Step 2: Controller endpoint**

In `CatalogController.cs`, add:

```csharp
[HttpPost("seed")]
public async Task<IActionResult> Seed(CancellationToken ct)
{
    var trainerId = trainerContext.TrainerId; // existing pattern in controller
    var count = await mediator.Send(new SeedCatalogCommand(trainerId), ct);
    return Ok(new { inserted = count });
}
```

- [ ] **Step 3: Manual test**

Start the API. Call `POST /api/v1/catalog/seed` (as an approved trainer cookie). Expected: 200 with `{ inserted: 50 }`. Second call: `{ inserted: 0 }` (idempotent).

- [ ] **Step 4: Commit**

```bash
git add src/Kondix.Application/Commands/Catalog/SeedCatalogCommand.cs \
        src/Kondix.Api/Controllers/CatalogController.cs
git commit -m "feat(catalog): add trainer seed endpoint for canonical exercises"
```

### Task 5.3: Onboarding CTA

**Files:**
- Modify: `kondix-web/src/app/features/onboarding/feature/onboarding-setup.ts` (or whichever component renders the setup screen — locate by grep for "onboarding/setup" route)
- Modify: `kondix-web/src/app/features/trainer/catalog/feature/catalog-list.ts`

- [ ] **Step 1: Add "Cargar ejercicios base" button to onboarding setup completion**

After the trainer saves their display name & bio, show an optional CTA: "Cargar 50 ejercicios base". Call `POST /catalog/seed`. On success, show toast "50 ejercicios agregados al catálogo".

- [ ] **Step 2: Add the same button to empty catalog**

In `catalog-list.ts`, when the list is empty, show a prominent button alongside "Nuevo ejercicio" with the text "Cargar ejercicios base" and a subtle explanation.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/onboarding kondix-web/src/app/features/trainer/catalog
git commit -m "feat(onboarding): add seed-catalog CTA on setup completion and empty catalog"
```

---

# PHASE 6 — UI polish: `<kx-icon-button>` + ghost-button unification

### Task 6.1: Create `<kx-icon-button>`

**Files:**
- Create: `kondix-web/src/app/shared/ui/icon-button.ts`
- Modify: `kondix-web/src/app/shared/ui/index.ts`

- [ ] **Step 1: Implement the component**

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider,
  Video, Play, Trash2, Plus, ArrowUp, ArrowDown, Check, X } from 'lucide-angular';

type Variant = 'ghost' | 'primary' | 'danger';
type Size = 'sm' | 'md';

@Component({
  selector: 'kx-icon-button',
  standalone: true,
  imports: [LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true,
    useValue: new LucideIconProvider({ Video, Play, Trash2, Plus, ArrowUp, ArrowDown, Check, X }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button"
      [attr.aria-label]="ariaLabel()"
      [class]="classes()"
      [disabled]="disabled()"
      (click)="clicked.emit($event)">
      <lucide-icon [name]="icon()" [class]="iconSize()" />
      @if (label()) { <span class="text-xs font-medium">{{ label() }}</span> }
    </button>`,
})
export class KxIconButton {
  icon = input.required<string>();
  ariaLabel = input.required<string>();
  label = input<string | null>(null);
  variant = input<Variant>('ghost');
  size = input<Size>('md');
  active = input(false);
  disabled = input(false);
  clicked = output<MouseEvent>();

  classes() {
    const base = 'inline-flex items-center gap-1.5 rounded-lg transition press disabled:opacity-40 disabled:cursor-not-allowed';
    const sz = this.size() === 'sm' ? 'h-7 px-2' : 'h-9 px-2.5';
    const variant = {
      ghost: this.active()
        ? 'bg-primary/10 text-primary hover:bg-primary/20'
        : 'bg-card hover:bg-card-hover text-text-muted hover:text-text',
      primary: 'bg-primary hover:bg-primary-hover text-white',
      danger: 'text-text-muted hover:bg-danger/10 hover:text-danger',
    }[this.variant()];
    return `${base} ${sz} ${variant}`;
  }

  iconSize() { return this.size() === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'; }
}
```

- [ ] **Step 2: Export from index**

Append to `kondix-web/src/app/shared/ui/index.ts`:

```typescript
export * from './icon-button';
```

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/shared/ui/icon-button.ts kondix-web/src/app/shared/ui/index.ts
git commit -m "feat(ui): add KxIconButton with ghost/primary/danger variants"
```

### Task 6.2: Replace text-styled controls in routine-wizard

**Files:**
- Modify: `kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts`

- [ ] **Step 1: Import the component**

Add to the wizard's `imports: [..., KxIconButton]`.

- [ ] **Step 2: Replace each occurrence**

| Current | Replacement |
|---|---|
| Move day up button (line ~193) | `<kx-icon-button icon="arrow-up" ariaLabel="Subir día" size="sm" (clicked)="moveDayUp(di)" />` |
| Move day down button (~196) | `<kx-icon-button icon="arrow-down" ariaLabel="Bajar día" size="sm" (clicked)="moveDayDown(di)" />` |
| Remove group/block (~281) | `<kx-icon-button icon="trash-2" ariaLabel="Eliminar bloque" size="sm" variant="danger" (clicked)="removeBlock(bi)" />` |
| Remove exercise (~331) | `<kx-icon-button icon="trash-2" ariaLabel="Eliminar ejercicio" size="sm" variant="danger" (clicked)="removeExercise(bi, ei)" />` |
| "+ Agregar serie" (~437) | `<kx-icon-button icon="plus" ariaLabel="Agregar serie" size="sm" label="Serie" (clicked)="addSet(bi, ei)" />` |
| "+ Agregar ejercicio" (~459) | Kept in new form (Phase 2 Step 4) but restyled: `<kx-icon-button icon="plus" ariaLabel="..." label="..." (clicked)="..." />` |

- [ ] **Step 3: Remove the old ad-hoc button CSS**

No longer needed — delete the related inline class strings.

- [ ] **Step 4: Manual test**

Open `/trainer/routines/new`. Inspect each icon-button — should have a visible background on hover, proper spacing, and accessible tooltip.

- [ ] **Step 5: Commit**

```bash
git add kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts
git commit -m "refactor(wizard): replace text-styled controls with KxIconButton"
```

---

## Final verification checklist (run after all phases)

- [ ] `dotnet build Kondix.slnx` — 0 warnings / 0 errors
- [ ] `dotnet ef database update` — clean apply (fresh container) on all migrations in order
- [ ] `cd kondix-web && npm run build` — production Angular build succeeds
- [ ] `cd kondix-web && E2E_REDIS_CONTAINER=fidly-redis-1 npx playwright test --project=chromium` — full suite green
- [ ] Smoke test as trainer:
  - Create catalog exercise with image upload → thumbnail visible
  - Create routine with individual exercises → block selector hidden
  - Add a 2nd exercise to a block → Superset selector + rest appear
  - Save routine with uncatalogued name → appears in catalog after save
  - Call "Cargar ejercicios base" → 50 new exercises
- [ ] Smoke test as student:
  - Start workout → thumbnail + video visible (if catalog has them)
  - Superset round complete → rest-timer shows block rest (90s), not set rest

---

## Notes for the implementer

- **Do not skip the E2E tests between phases.** The helpers in `kondix-web/e2e/fixtures/seed.ts` will need `groups` → `blocks` and `groupType` → `blockType` rewrites during Phase 2; renaming those helpers is part of Phase 2.4 Step 7.
- **Routine builder migration copy step (Task 1.5 Step 7) is best-effort.** If a trainer had a per-routine video that overrode the catalog, they lose that override. Document in the commit message — it's the intended behavior of this phase.
- **Phase 2 changes the public API shape** (`groups` → `blocks`). There is no external consumer yet (single SPA frontend), so no backward-compatibility shim is needed. Ship frontend + backend in the same PR.
- **The seed list is intentionally media-less** — trainers can upload thumbnails/videos after seeding. Keeps the seed itself small, portable, and legally simple (no third-party video URLs in source control).
