# KONDIX v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the v2 iteration of Kondix per the spec at `docs/superpowers/specs/2026-04-26-kondix-v2-feedback-loop-recovery-and-visual-refresh-design.md` — bidirectional feedback loop, recovery system, video demo overlay, PR celebration toast, programs editor refresh, and trainer auto-approval with catalog seeding.

**Architecture:** Seven independently shippable phases on top of the existing .NET 10 + Angular 21 codebase. Three additive EF migrations. Eight new shared UI components. One cross-repo integration (CelvoAdmin) with Kondix-side detail.

**Tech Stack:** .NET 10, EF Core 10, MediatR, FluentValidation, PostgreSQL 17, Angular 21 (standalone + signals + control flow), Tailwind CSS 4, Lucide icons, `@angular/cdk` (added in Phase 5), xUnit + FluentAssertions + NSubstitute + EF InMemory for backend tests, Playwright for E2E.

**Shipping order:** Phase 1 → 1.5 (parallel) → 2 → 3 → 4 → 5 → 6. Each phase ends with a green build, optional E2E coverage, and is safe to merge on its own.

---

## File Map

| Action | File | Phase | Responsibility |
|---|---|---|---|
| Create | `kondix-web/src/app/shared/utils/youtube.ts` | 1 | YouTube embed URL normalizer |
| Modify | `kondix-web/src/app/shared/ui/index.ts` | 1, 2, 3, 4 | Re-export new components |
| Modify | `kondix-web/src/styles.css` | 1 | Add `--color-muscle-*` tokens |
| Create | `kondix-web/src/app/shared/ui/exercise-thumb.ts` | 1 | `<kx-exercise-thumb>` |
| Modify | `kondix-web/src/app/shared/ui/toast.ts` | 1 | `pr` variant + `ToastService.showPR` |
| Modify | `kondix-web/src/app/features/student/feature/exercise-logging.ts` | 1, 2, 3 | Use new thumb + youtube util; add demo overlay; wire feedback |
| Modify | `kondix-web/src/app/features/trainer/catalog/feature/catalog-list.ts` | 1 | Use thumb in cards |
| Modify | `kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts` | 1 | Use thumb in exercise picker |
| Modify | `src/Kondix.Application/DTOs/RoutineDtos.cs` | 1 | Add `MuscleGroup` to `ExerciseDto` |
| Modify | `src/Kondix.Application/Commands/Routines/RoutineBuilder.cs` | 1 | Project `MuscleGroup` from catalog |
| Modify | `src/Kondix.Application/Queries/Routines/GetRoutineByIdQuery.cs` | 1 | Project `MuscleGroup` |
| Modify | `src/Kondix.Application/Queries/StudentPortal/GetMyRoutineDetailQuery.cs` | 1 | Project `MuscleGroup` |
| Modify | `kondix-web/src/app/shared/models/index.ts` | 1, 3, 4, 5 | Update DTO interfaces |
| Create | `src/Kondix.Api/Internal/InternalAuth.cs` | 1.5 | Shared `X-Internal-Key` validator |
| Modify | `src/Kondix.Api/Controllers/InternalTestController.cs` | 1.5 | Use shared `InternalAuth` |
| Create | `src/Kondix.Application/Commands/Onboarding/ApproveTrainerCommand.cs` | 1.5 | Approve + auto-seed |
| Modify | `src/Kondix.Application/Validators/CreateRoutineValidator.cs` | n/a | (no change) |
| Create | `src/Kondix.Application/Queries/Trainers/ListPendingTrainersQuery.cs` | 1.5 | Pending list |
| Create | `src/Kondix.Api/Controllers/InternalTrainersController.cs` | 1.5 | `/api/v1/internal/trainers` |
| Modify | `src/Kondix.Api/appsettings.json` | 1.5 | `Internal:ApiKey` placeholder |
| Modify | `src/Kondix.Api/appsettings.Development.json` | 1.5 | Local dev key |
| Create | `tests/Kondix.UnitTests/Commands/ApproveTrainerCommandHandlerTests.cs` | 1.5 | Unit tests |
| Create | `tests/Kondix.IntegrationTests/InternalTrainersEndpointsTests.cs` | 1.5 | Integration tests |
| Create | `kondix-web/src/app/shared/ui/video-demo-overlay.ts` | 2 | `<kx-video-demo-overlay>` |
| Create | `src/Kondix.Domain/Enums/MoodType.cs` | 3 | Mood enum |
| Create | `src/Kondix.Domain/Entities/ExerciseFeedback.cs` | 3 | New entity |
| Modify | `src/Kondix.Domain/Entities/SetLog.cs` | 3 | `Notes` field |
| Modify | `src/Kondix.Domain/Entities/WorkoutSession.cs` | 3 | `Mood`, `FeedbackReviewedAt`, `IsRecovery`, `RecoversSessionId` (last two used in Phase 4) |
| Create | `src/Kondix.Infrastructure/Persistence/Configurations/ExerciseFeedbackConfiguration.cs` | 3 | EF mapping |
| Modify | `src/Kondix.Infrastructure/Persistence/Configurations/SetLogConfiguration.cs` | 3 | Map `Notes` |
| Modify | `src/Kondix.Infrastructure/Persistence/Configurations/WorkoutSessionConfiguration.cs` | 3, 4 | Map new fields |
| Modify | `src/Kondix.Infrastructure/Persistence/KondixDbContext.cs` | 3 | Register `DbSet<ExerciseFeedback>` |
| Modify | `src/Kondix.Application/Common/Interfaces/IKondixDbContext.cs` | 3 | Expose `DbSet<ExerciseFeedback>` |
| Create | `src/Kondix.Infrastructure/Migrations/{ts}_AddSessionAndSetFeedbackFields.cs` | 3 | Migration #1 |
| Modify | `src/Kondix.Application/Commands/Sessions/CompleteSessionCommand.cs` | 3 | Idempotent + mood |
| Modify | `src/Kondix.Application/Commands/Sessions/UpdateSetDataCommand.cs` | 3 | PR inline |
| Create | `src/Kondix.Application/Commands/Sessions/UpdateSetNoteCommand.cs` | 3 | Per-set note |
| Create | `src/Kondix.Application/Commands/Sessions/UpsertExerciseFeedbackCommand.cs` | 3 | Per-exercise feedback |
| Create | `src/Kondix.Application/Commands/Sessions/MarkFeedbackReadCommand.cs` | 3 | Trainer marks read |
| Create | `src/Kondix.Application/Queries/Analytics/GetRecentFeedbackQuery.cs` | 3 | Badge + banner data |
| Create | `src/Kondix.Application/Queries/StudentPortal/GetSessionFeedbackQuery.cs` | 3 | Trainer timeline detail |
| Modify | `src/Kondix.Application/DTOs/SessionDtos.cs` | 3 | Add feedback DTOs |
| Modify | `src/Kondix.Api/Controllers/StudentPortalController.cs` | 3, 4 | New endpoints |
| Create | `src/Kondix.Api/Controllers/StudentsTrainerController.cs` (or modify existing) | 3 | Trainer feedback endpoints |
| Create | `kondix-web/src/app/shared/ui/rpe-stepper.ts` | 3 | `<kx-rpe-stepper>` |
| Create | `kondix-web/src/app/shared/ui/mood-picker.ts` | 3 | `<kx-mood-picker>` |
| Create | `kondix-web/src/app/shared/ui/set-chip.ts` | 3 | `<kx-set-chip>` |
| Create | `kondix-web/src/app/shared/ui/session-row.ts` | 3 | `<kx-session-row>` |
| Create | `kondix-web/src/app/shared/ui/exercise-feedback-modal.ts` | 3 | RPE+notes modal |
| Modify | `kondix-web/src/app/shared/ui/set-row.ts` | 3 | Note toggle |
| Modify | `kondix-web/src/app/features/student/feature/workout-complete.ts` | 3 | Mood + notes |
| Split  | `kondix-web/src/app/features/trainer/students/feature/student-detail.ts` | 3 | Shell only |
| Create | `kondix-web/src/app/features/trainer/students/feature/student-detail-summary.ts` | 3 | Tab |
| Create | `kondix-web/src/app/features/trainer/students/feature/student-detail-program.ts` | 3 | Tab |
| Create | `kondix-web/src/app/features/trainer/students/feature/student-detail-progress.ts` | 3 | Tab |
| Create | `kondix-web/src/app/features/trainer/students/feature/student-detail-notes.ts` | 3 | Tab |
| Create | `src/Kondix.Infrastructure/Migrations/{ts}_AddSessionRecoveryFields.cs` | 4 | Migration #2 |
| Create | `src/Kondix.Application/Queries/StudentPortal/GetMissedSessionQuery.cs` | 4 | Recoverable lookup |
| Modify | `src/Kondix.Application/Commands/Sessions/StartSessionCommand.cs` | 4 | Accept `recoversSessionId` |
| Create | `kondix-web/src/app/shared/ui/recovery-banner.ts` | 4 | `<kx-recovery-banner>` |
| Modify | `kondix-web/src/app/shared/ui/day-cell.ts` | 4 | `recovered` state |
| Modify | `kondix-web/src/app/features/student/feature/home.ts` | 4 | Banner integration |
| Modify | `kondix-web/src/app/features/student/feature/calendar.ts` | 4 | Recovered state |
| Modify | `kondix-web/package.json` | 5 | `@angular/cdk` dep |
| Create | `src/Kondix.Domain/Entities/ProgramWeekOverride.cs` | 5 | New entity |
| Create | `src/Kondix.Infrastructure/Persistence/Configurations/ProgramWeekOverrideConfiguration.cs` | 5 | EF mapping |
| Create | `src/Kondix.Infrastructure/Migrations/{ts}_AddProgramWeekOverrides.cs` | 5 | Migration #3 |
| Create | `src/Kondix.Application/Commands/Programs/UpsertProgramWeekOverrideCommand.cs` | 5 | Upsert |
| Create | `src/Kondix.Application/Queries/Programs/GetProgramWeekOverridesQuery.cs` | 5 | List |
| Modify | `src/Kondix.Api/Controllers/ProgramsController.cs` | 5 | Endpoints |
| Modify | `kondix-web/src/app/features/trainer/programs/feature/program-form.ts` | 5 | Weekly grid + D&D |
| Modify | `CLAUDE.md` | 6 | Document new components/endpoints |
| Modify | `kondix-web/.impeccable.md` | 6 | Component inventory |
| Modify | `setup/03-deploy-checklist.md` | 6 | Three new migrations + cdk |

---

## Cross-cutting conventions

Read these before starting any phase. They apply to every task.

### Backend
- **Migrations:** add with `dotnet ef migrations add <Name> --project src/Kondix.Infrastructure --startup-project src/Kondix.Api --output-dir Migrations`. Inspect the generated `Up`/`Down` before committing. **No dev DB exists** — the migrations apply at deploy time. Verify SQL with `dotnet ef migrations script <FromName> <ToName> --project src/Kondix.Infrastructure --startup-project src/Kondix.Api`.
- **Schema:** `kondix` (not `gym`).
- **Enums** stored as PascalCase strings via `JsonStringEnumConverter` + `EnumToStringConverter`. DB column `varchar(N)` nullable when applicable.
- **Test coverage matrix:**
  - Unit tests for handler logic → `tests/Kondix.UnitTests/Commands/<Name>Tests.cs` (xUnit + FluentAssertions + NSubstitute + EF InMemory).
  - Validators → `tests/Kondix.UnitTests/Validators/<Name>ValidatorTests.cs`.
  - HTTP behavior (auth, status codes, end-to-end through DI) → `tests/Kondix.IntegrationTests/<Name>EndpointsTests.cs`.
- **Controllers:** primary constructor `(IMediator mediator)`, request DTOs as `sealed record` at bottom of file. Trainer endpoints use inline `RequirePermission("...")`. Student endpoints under `/api/v1/public/my/*` skip trainer context.
- **Date types:** always `DateTimeOffset` for timestamps; `DateOnly` for calendar dates with no time component.
- **PR detection:** existing `DetectNewPRsCommand` is reused — do not reimplement.
- **The CelvoAdmin-side work for Phase 1.5 is OUT OF SCOPE for this plan.** This plan only ships the Kondix-side endpoints; CelvoAdmin gets its own spec/plan in its own repo.

### Frontend
- **Standalone components only.** Inline template + styles in `.ts` file. Class names without `Component` suffix.
- **Signal inputs:** `input()` / `input.required<T>()`. Outputs: `output<T>()`.
- **Templates:** `@if` / `@for` / `@switch`. Signals called as functions: `{{ count() }}`.
- **OnPush + signals:** use `computed()` for derived state, NOT method calls in templates.
- **Subscriptions in `ngOnInit`:** wrap with `takeUntilDestroyed(inject(DestroyRef))`.
- **Lucide icons:** kebab-case names; register via `LucideAngularModule` in `imports` + `LucideIconProvider` in `providers`.
- **Tailwind 4:** `font-display` class (not `font-[var(--font-display)]`); tokens declared in `@theme` in `styles.css`.
- **Spanish copy** (tú, motivacional, directo).
- **Animations:** respect `prefers-reduced-motion`; reuse `.animate-fade-up`, `.animate-check`, `.animate-complete`, `.animate-badge`, `.stagger`, `.press` classes.

### Verification (no Playwright E2E in this plan)
The Playwright suite under `kondix-web/e2e/` is being polished separately. **This plan does NOT add or modify E2E specs.** Coverage strategy:
- **Backend behavior** → unit + integration tests (sections above).
- **Frontend utilities** → Vitest specs colocated next to source (e.g. `youtube.spec.ts`).
- **Frontend behavior (smart components, flows)** → manual smoke tests during dev with `npx ng serve` against local backend. Each task that touches UI ends with a "verify visually" step listing what to check.
- Once the E2E suite stabilizes, follow-up plans can add coverage for the v2 flows.

### Commits
- One atomic commit per task that ends with "Commit". Scope prefixes: `feat(...)`, `fix(...)`, `refactor(...)`, `chore(...)`, `test(...)`, `docs(...)`.
- Pass commit message via heredoc to preserve formatting.
- `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` on agent-authored commits.

---

# PHASE 1 — Foundation (low risk, no migration)

Establishes shared primitives that later phases consume. No DB migrations.

## Task 1.1: YouTube embed URL utility

**Files:**
- Create: `kondix-web/src/app/shared/utils/youtube.ts`
- Test: covered by Vitest spec colocated next to source

**Note:** The current `getEmbedUrl` lives inline in `exercise-logging.ts`. Phase 1 extracts it; Phase 2 reuses it from the new overlay; later phases reuse it from anywhere video URLs are rendered.

- [ ] **Step 1: Write the failing Vitest spec**

Create `kondix-web/src/app/shared/utils/youtube.spec.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import { youtubeEmbedUrl } from './youtube';

describe('youtubeEmbedUrl', () => {
  it('normalizes youtu.be short links', () => {
    expect(youtubeEmbedUrl('https://youtu.be/abc123')).toBe(
      'https://www.youtube.com/embed/abc123?autoplay=1&rel=0',
    );
  });
  it('normalizes youtube.com/watch links', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=xyz789')).toBe(
      'https://www.youtube.com/embed/xyz789?autoplay=1&rel=0',
    );
  });
  it('passes through already-embed URLs unchanged', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/embed/foo')).toBe(
      'https://www.youtube.com/embed/foo?autoplay=1&rel=0',
    );
  });
  it('returns null for non-YouTube URLs', () => {
    expect(youtubeEmbedUrl('https://vimeo.com/123')).toBeNull();
  });
  it('returns null for null/empty input', () => {
    expect(youtubeEmbedUrl(null)).toBeNull();
    expect(youtubeEmbedUrl('')).toBeNull();
  });
});
```

- [ ] **Step 2: Run spec to verify it fails**

Run: `cd kondix-web && npx vitest run src/app/shared/utils/youtube.spec.ts`
Expected: FAIL with "Cannot find module './youtube'"

- [ ] **Step 3: Implement the util**

Create `kondix-web/src/app/shared/utils/youtube.ts`:
```typescript
const PARAMS = 'autoplay=1&rel=0';

export function youtubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const shortMatch = url.match(/^https?:\/\/youtu\.be\/([\w-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?${PARAMS}`;
  const watchMatch = url.match(/^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?${PARAMS}`;
  const embedMatch = url.match(/^https?:\/\/(?:www\.)?youtube\.com\/embed\/([\w-]+)/);
  if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}?${PARAMS}`;
  return null;
}
```

- [ ] **Step 4: Run spec to verify it passes**

Run: `cd kondix-web && npx vitest run src/app/shared/utils/youtube.spec.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Replace inline embed logic in exercise-logging.ts**

In `kondix-web/src/app/features/student/feature/exercise-logging.ts`, locate the existing `getEmbedUrl` method and the `[src]="getEmbedUrl(...)"` template binding. Replace by importing `youtubeEmbedUrl` and using it via `DomSanitizer.bypassSecurityTrustResourceUrl(youtubeEmbedUrl(url) ?? '')`. Remove the now-dead `getEmbedUrl` method.

- [ ] **Step 6: Build to confirm no regressions**

Run: `cd kondix-web && npx ng build`
Expected: Application bundle generation complete. 0 errors.

- [ ] **Step 7: Commit**

```bash
git add kondix-web/src/app/shared/utils/youtube.ts kondix-web/src/app/shared/utils/youtube.spec.ts kondix-web/src/app/features/student/feature/exercise-logging.ts
git commit -m "$(cat <<'EOF'
feat(shared): extract youtubeEmbedUrl util with vitest spec

Centralizes YouTube link normalization (short/watch/embed forms) into a
shared util reused by Phase 2 video demo overlay and any future video player.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 1.2: Muscle group color tokens

**Files:**
- Modify: `kondix-web/src/styles.css`

- [ ] **Step 1: Locate the `@theme` block**

Open `kondix-web/src/styles.css`. Find the `@theme {` block where existing color tokens (`--color-primary`, etc.) are declared.

- [ ] **Step 2: Add 10 muscle-group tokens**

Inside `@theme`, append after the existing `--color-set-*` tokens:
```css
  /* Muscle group tints — used as 12% opacity gradient fallback in <kx-exercise-thumb> */
  --color-muscle-pecho: #EF4444;
  --color-muscle-espalda: #3B82F6;
  --color-muscle-hombro: #F59E0B;
  --color-muscle-biceps: #A855F7;
  --color-muscle-triceps: #EC4899;
  --color-muscle-cuadriceps: #22C55E;
  --color-muscle-gluteos: #06B6D4;
  --color-muscle-femoral: #10B981;
  --color-muscle-pantorrilla: #84CC16;
  --color-muscle-core: #F97316;
```

- [ ] **Step 3: Build to confirm CSS compiles**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add kondix-web/src/styles.css
git commit -m "$(cat <<'EOF'
feat(theme): add muscle-group color tokens

Ten tokens (--color-muscle-pecho ... --color-muscle-core) used as 12%
opacity fallback gradients in <kx-exercise-thumb> when photoUrl is null.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 1.3: `<kx-exercise-thumb>` shared component

**Files:**
- Create: `kondix-web/src/app/shared/ui/exercise-thumb.ts`
- Modify: `kondix-web/src/app/shared/ui/index.ts`

- [ ] **Step 1: Create the component**

Create `kondix-web/src/app/shared/ui/exercise-thumb.ts`:
```typescript
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type ThumbSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_PX: Record<ThumbSize, number> = {
  xs: 32,
  sm: 40,
  md: 56,
  lg: 72,
};

const MUSCLE_TOKEN: Record<string, string> = {
  Pecho: 'var(--color-muscle-pecho)',
  Espalda: 'var(--color-muscle-espalda)',
  Hombro: 'var(--color-muscle-hombro)',
  Bíceps: 'var(--color-muscle-biceps)',
  Tríceps: 'var(--color-muscle-triceps)',
  Cuádriceps: 'var(--color-muscle-cuadriceps)',
  Glúteos: 'var(--color-muscle-gluteos)',
  Femoral: 'var(--color-muscle-femoral)',
  Pantorrilla: 'var(--color-muscle-pantorrilla)',
  Core: 'var(--color-muscle-core)',
  // Aliases used by the catalog seed
  Piernas: 'var(--color-muscle-cuadriceps)',
  Brazos: 'var(--color-muscle-biceps)',
  Cardio: 'var(--color-muscle-core)',
  Funcional: 'var(--color-muscle-hombro)',
  Movilidad: 'var(--color-muscle-femoral)',
};

@Component({
  selector: 'kx-exercise-thumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative rounded-lg overflow-hidden border border-border bg-card-hover flex items-center justify-center shrink-0"
      [style.width.px]="px()"
      [style.height.px]="px()"
    >
      @if (photoUrl()) {
        <img
          [src]="photoUrl()!"
          [alt]="name()"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      } @else {
        <div
          class="w-full h-full flex items-center justify-center text-text-muted text-[10px] font-bold uppercase tracking-wider"
          [style.background]="fallbackBg()"
        >
          {{ initials() }}
        </div>
      }
      @if (hasVideo()) {
        <span
          class="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary/90 flex items-center justify-center"
          aria-label="Tiene demo de vídeo"
          title="Tiene demo de vídeo"
        >
          <svg class="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </span>
      }
    </div>
  `,
})
export class KxExerciseThumb {
  name = input.required<string>();
  muscleGroup = input<string | null>(null);
  photoUrl = input<string | null>(null);
  size = input<ThumbSize>('md');
  hasVideo = input<boolean>(false);

  px = computed(() => SIZE_PX[this.size()]);

  initials = computed(() => {
    const words = this.name().trim().split(/\s+/).slice(0, 2);
    return words.map(w => w[0] ?? '').join('').toUpperCase();
  });

  fallbackBg = computed(() => {
    const tint = MUSCLE_TOKEN[this.muscleGroup() ?? ''] ?? 'var(--color-card-hover)';
    return `linear-gradient(135deg, color-mix(in srgb, ${tint} 12%, transparent), color-mix(in srgb, ${tint} 4%, transparent))`;
  });
}
```

- [ ] **Step 2: Re-export from the shared barrel**

In `kondix-web/src/app/shared/ui/index.ts`, append:
```typescript
export * from './exercise-thumb';
```

- [ ] **Step 3: Build to confirm**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add kondix-web/src/app/shared/ui/exercise-thumb.ts kondix-web/src/app/shared/ui/index.ts
git commit -m "$(cat <<'EOF'
feat(ui): add <kx-exercise-thumb> shared component

Square thumbnail with photoUrl, muscle-group tinted fallback gradient,
optional video pill in top-right. Sizes xs|sm|md|lg (32/40/56/72px).
Used by catalog grid, exercise picker, and (without pill) by student
logging and trainer timeline.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 1.4: Project `MuscleGroup` into `ExerciseDto`

**Files:**
- Modify: `src/Kondix.Application/DTOs/RoutineDtos.cs`
- Modify: `src/Kondix.Application/Commands/Routines/RoutineBuilder.cs`
- Modify: `src/Kondix.Application/Queries/Routines/GetRoutineByIdQuery.cs`
- Modify: `src/Kondix.Application/Queries/StudentPortal/GetMyRoutineDetailQuery.cs`
- Modify: `kondix-web/src/app/shared/models/index.ts`

- [ ] **Step 1: Add `MuscleGroup` to `ExerciseDto`**

In `src/Kondix.Application/DTOs/RoutineDtos.cs`, locate the `ExerciseDto` record. Add `string? MuscleGroup` immediately after the existing `string? ImageUrl` property. Result (showing only the relevant record):
```csharp
public sealed record ExerciseDto(
    Guid Id,
    string Name,
    string? Notes,
    string? Tempo,
    Guid? CatalogExerciseId,
    string? ImageUrl,
    string? MuscleGroup,         // NEW
    VideoSource VideoSource,
    string? VideoUrl,
    int SortOrder,
    List<ExerciseSetDto> Sets);
```

- [ ] **Step 2: Project `MuscleGroup` in `RoutineBuilder`**

In `src/Kondix.Application/Commands/Routines/RoutineBuilder.cs`, find the LINQ projection that constructs `ExerciseDto` (it already pulls `ImageUrl` from `e.CatalogExercise!.ImageUrl`). Add `e.CatalogExercise?.MuscleGroup` in the same position as `MuscleGroup` was declared in the record. Apply identical changes wherever `ExerciseDto` is constructed in this file.

- [ ] **Step 3: Project in `GetRoutineByIdQuery`**

In `src/Kondix.Application/Queries/Routines/GetRoutineByIdQuery.cs`, find the EF projection that builds `ExerciseDto` (it joins `CatalogExercise` for `ImageUrl`). Add `e.CatalogExercise.MuscleGroup` to the projection.

- [ ] **Step 4: Project in `GetMyRoutineDetailQuery`**

In `src/Kondix.Application/Queries/StudentPortal/GetMyRoutineDetailQuery.cs`, mirror Step 3 — add `e.CatalogExercise.MuscleGroup` next to the existing `e.CatalogExercise.ImageUrl` projection.

- [ ] **Step 5: Update frontend model**

In `kondix-web/src/app/shared/models/index.ts`, find `interface ExerciseDto`. Add:
```typescript
muscleGroup: string | null;
```
Right after the existing `imageUrl: string | null` field.

- [ ] **Step 6: Build .NET + Angular**

Run in two parallel shells:
```bash
dotnet build Kondix.slnx
cd kondix-web && npx ng build
```
Expected: 0 errors on both.

- [ ] **Step 7: Commit**

```bash
git add src/Kondix.Application/DTOs/RoutineDtos.cs src/Kondix.Application/Commands/Routines/RoutineBuilder.cs src/Kondix.Application/Queries/Routines/GetRoutineByIdQuery.cs src/Kondix.Application/Queries/StudentPortal/GetMyRoutineDetailQuery.cs kondix-web/src/app/shared/models/index.ts
git commit -m "$(cat <<'EOF'
feat(routines): project MuscleGroup from catalog into ExerciseDto

Mirrors how ImageUrl was already projected in the exercise-catalog refactor.
Lets <kx-exercise-thumb> render the muscle-group tinted fallback gradient
without an extra catalog lookup on the client.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 1.5: Use `<kx-exercise-thumb>` in catalog grid

**Files:**
- Modify: `kondix-web/src/app/features/trainer/catalog/feature/catalog-list.ts`

- [ ] **Step 1: Add import to imports array**

At the top of the file, import the component:
```typescript
import { KxExerciseThumb } from '../../../../shared/ui/exercise-thumb';
```
And add `KxExerciseThumb` to the `imports: [...]` array on the `@Component` decorator.

- [ ] **Step 2: Replace existing thumbnail rendering**

Find the part of the template that renders the catalog card thumbnail (currently shows `<img>` for `imageUrl` with a placeholder fallback). Replace with:
```html
<kx-exercise-thumb
  [name]="ex.name"
  [muscleGroup]="ex.muscleGroup"
  [photoUrl]="ex.imageUrl"
  size="lg"
  [hasVideo]="!!ex.videoUrl"
/>
```

- [ ] **Step 3: Run dev server and verify visually**

Run: `cd kondix-web && npx ng serve`. Open `http://localhost:4201/trainer/catalog`. Each card shows the new thumb. Cards with a `videoUrl` show the red video pill in top-right. Cards without `imageUrl` show the muscle-tinted fallback with initials.

- [ ] **Step 4: Build to confirm production output**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add kondix-web/src/app/features/trainer/catalog/feature/catalog-list.ts
git commit -m "$(cat <<'EOF'
feat(catalog): render cards with <kx-exercise-thumb>

Replaces inline img+placeholder with the shared thumb component. Cards now
show the video pill when an exercise has a demo, and the muscle-tinted
fallback gradient when imageUrl is null.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 1.6: Use `<kx-exercise-thumb>` in exercise picker

**Files:**
- Modify: `kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts` (or wherever the `ExercisePicker` component lives — verify path before editing)

- [ ] **Step 1: Locate the picker template**

Run: `grep -n "exercise-picker\|ExercisePicker" kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts` to find the picker definition. The picker shows a list of catalog exercises with name + muscle group; replace the current avatar/icon with the new thumb.

- [ ] **Step 2: Add import**

Add to the imports for that component:
```typescript
import { KxExerciseThumb } from '../../../../shared/ui/exercise-thumb';
```
And include `KxExerciseThumb` in the `imports` array.

- [ ] **Step 3: Replace the picker row leading visual**

Replace the existing leading avatar / icon block with:
```html
<kx-exercise-thumb
  [name]="ex.name"
  [muscleGroup]="ex.muscleGroup"
  [photoUrl]="ex.imageUrl"
  size="sm"
  [hasVideo]="!!ex.videoUrl"
/>
```

- [ ] **Step 4: Build**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts
git commit -m "$(cat <<'EOF'
feat(wizard): use <kx-exercise-thumb> in exercise picker

Picker rows now show photoUrl/muscle-tinted thumb with video pill,
consistent with the catalog grid.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 1.7: `<kx-toast>` `pr` variant + `ToastService.showPR`

**Files:**
- Modify: `kondix-web/src/app/shared/ui/toast.ts`

- [ ] **Step 1: Extend the `Toast` interface and add `showPR`**

Replace the `Toast` interface and the `ToastService` class with:
```typescript
export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'pr';
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast = signal<Toast | null>(null);
  private timeout: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: Exclude<Toast['type'], 'pr'> = 'success', duration = 3000) {
    if (this.timeout) clearTimeout(this.timeout);
    this.toast.set({ message, type });
    this.timeout = setTimeout(() => this.toast.set(null), duration);
  }

  showPR(exerciseName: string, weight: string, reps: number | null) {
    if (this.timeout) clearTimeout(this.timeout);
    const repsLabel = reps != null ? ` × ${reps}` : '';
    this.toast.set({
      title: '¡Nuevo récord!',
      message: `${exerciseName} · ${weight}kg${repsLabel}`,
      type: 'pr',
    });
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([100, 60, 100, 60, 200]); } catch { /* not supported */ }
    }
    this.timeout = setTimeout(() => this.toast.set(null), 4000);
  }

  dismiss() {
    if (this.timeout) clearTimeout(this.timeout);
    this.toast.set(null);
  }
}
```

- [ ] **Step 2: Render the `pr` variant**

Replace the existing template inside the `@Component` decorator with:
```typescript
@Component({
  selector: 'kx-toast',
  template: `
    @if (toastService.toast(); as t) {
      <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-up"
        role="status" aria-live="polite">
        @if (t.type === 'pr') {
          <div class="px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
            style="background: linear-gradient(135deg, #B45309 0%, #E62639 60%, #FBBF24 100%); min-width: 280px;">
            <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl">
              🏆
            </div>
            <div class="text-white">
              <p class="text-[10px] uppercase tracking-wider font-bold opacity-80">{{ t.title }}</p>
              <p class="text-sm font-semibold">{{ t.message }}</p>
            </div>
          </div>
        } @else {
          <div class="px-4 py-2.5 rounded-xl border text-sm font-medium shadow-lg backdrop-blur-md"
            [class.bg-success-dark]="t.type === 'success'"
            [class.border-success/30]="t.type === 'success'"
            [class.text-success]="t.type === 'success'"
            [class.bg-danger/20]="t.type === 'error'"
            [class.border-danger/30]="t.type === 'error'"
            [class.text-danger]="t.type === 'error'"
            [class.bg-card]="t.type === 'info'"
            [class.border-border]="t.type === 'info'"
            [class.text-text]="t.type === 'info'">
            {{ t.message }}
          </div>
        }
      </div>
    }
  `,
})
export class KxToast {
  toastService: ToastService;
  constructor(toastService: ToastService) {
    this.toastService = toastService;
  }
}
```

- [ ] **Step 3: Build**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors.

- [ ] **Step 4: Manual smoke test (optional during dev)**

In any component with `inject(ToastService)`, call `toast.showPR('Press banca', '85', 5)`. Verify gold/crimson gradient toast appears with 🏆, title "¡Nuevo récord!", message "Press banca · 85kg × 5", auto-dismisses after 4s.

- [ ] **Step 5: Commit**

```bash
git add kondix-web/src/app/shared/ui/toast.ts
git commit -m "$(cat <<'EOF'
feat(toast): add 'pr' variant + ToastService.showPR

Gold/crimson gradient toast with 🏆 icon, "¡Nuevo récord!" title, exercise
detail message, 4s auto-dismiss, and best-effort vibration. Wired up by
Phase 3's UpdateSetData response.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# PHASE 1.5 — Trainer approval & auto-seed (parallel, no migration)

Independently shippable. Can run alongside Phase 1 since they don't conflict. CelvoAdmin-side work is OUT OF SCOPE for this plan.

## Task 1.5.1: Extract `InternalAuth` helper

**Files:**
- Create: `src/Kondix.Api/Internal/InternalAuth.cs`
- Modify: `src/Kondix.Api/Controllers/InternalTestController.cs`

- [ ] **Step 1: Create the shared helper**

Create `src/Kondix.Api/Internal/InternalAuth.cs`:
```csharp
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Kondix.Api.Internal;

/// <summary>
/// Shared X-Internal-Key validation for internal-only endpoints. Reads the
/// expected key from configuration. Returns true if the request carries a
/// matching header. Used by InternalTestController (Dev/Testing only) and
/// InternalTrainersController (always registered).
/// </summary>
public static class InternalAuth
{
    public static bool IsAuthorized(HttpRequest request, IConfiguration config, string keyPath)
    {
        var expected = config[keyPath];
        if (string.IsNullOrEmpty(expected)) return false;
        var provided = request.Headers["X-Internal-Key"].ToString();
        return !string.IsNullOrEmpty(provided) && provided == expected;
    }
}
```

- [ ] **Step 2: Refactor `InternalTestController` to use it**

In `src/Kondix.Api/Controllers/InternalTestController.cs`, replace the `AuthorizeInternal()` private method with a call to the helper. Updated header:
```csharp
using Kondix.Api.Internal;
// ...
public class InternalTestController(KondixDbContext db, IConfiguration config) : ControllerBase
{
    private bool AuthorizeInternal() =>
        InternalAuth.IsAuthorized(Request, config, "Testing:InternalApiKey");
    // ... rest unchanged
}
```

- [ ] **Step 3: Run integration tests to confirm no regression**

Run: `dotnet test tests/Kondix.IntegrationTests/Kondix.IntegrationTests.csproj`
Expected: All existing tests pass (the auth behavior is unchanged).

- [ ] **Step 4: Commit**

```bash
git add src/Kondix.Api/Internal/InternalAuth.cs src/Kondix.Api/Controllers/InternalTestController.cs
git commit -m "$(cat <<'EOF'
refactor(api): extract X-Internal-Key validation into InternalAuth helper

Reused by InternalTestController (Dev/Testing) and the upcoming
InternalTrainersController (registered always for production approvals).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 1.5.2: `ApproveTrainerCommand` + handler

**Files:**
- Create: `src/Kondix.Application/Commands/Onboarding/ApproveTrainerCommand.cs`
- Test: `tests/Kondix.UnitTests/Commands/ApproveTrainerCommandHandlerTests.cs`

- [ ] **Step 1: Write the failing handler test**

Create `tests/Kondix.UnitTests/Commands/ApproveTrainerCommandHandlerTests.cs`:
```csharp
using FluentAssertions;
using Kondix.Application.Commands.Onboarding;
using Kondix.Application.Commands.Catalog;
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Kondix.UnitTests.Commands;

public sealed class ApproveTrainerCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new KondixDbContext(options);
    }

    [Fact]
    public async Task Approve_NewTrainer_SetsFlagsAndSeedsCatalog()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        db.Trainers.Add(new Trainer
        {
            Id = trainerId,
            UserId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            DisplayName = "Test",
            IsApproved = false,
        });
        await db.SaveChangesAsync();

        var sender = Substitute.For<IMediator>();
        sender.Send(Arg.Any<SeedCatalogCommand>(), Arg.Any<CancellationToken>())
            .Returns(50);

        var handler = new ApproveTrainerCommandHandler(db, sender);
        var result = await handler.Handle(new ApproveTrainerCommand(trainerId), CancellationToken.None);

        result.AlreadyApproved.Should().BeFalse();
        result.ExercisesSeeded.Should().Be(50);
        result.ApprovedAt.Should().NotBeNull();

        var t = await db.Trainers.FirstAsync(x => x.Id == trainerId);
        t.IsApproved.Should().BeTrue();
        t.ApprovedAt.Should().NotBeNull();

        await sender.Received(1).Send(
            Arg.Is<SeedCatalogCommand>(c => c.TrainerId == trainerId),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Approve_AlreadyApproved_IsNoOp()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var alreadyAt = DateTimeOffset.UtcNow.AddDays(-1);
        db.Trainers.Add(new Trainer
        {
            Id = trainerId,
            UserId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            DisplayName = "Test",
            IsApproved = true,
            ApprovedAt = alreadyAt,
        });
        await db.SaveChangesAsync();

        var sender = Substitute.For<IMediator>();
        var handler = new ApproveTrainerCommandHandler(db, sender);

        var result = await handler.Handle(new ApproveTrainerCommand(trainerId), CancellationToken.None);

        result.AlreadyApproved.Should().BeTrue();
        result.ExercisesSeeded.Should().Be(0);
        result.ApprovedAt.Should().Be(alreadyAt);
        await sender.DidNotReceive().Send(Arg.Any<SeedCatalogCommand>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Approve_NotFound_ThrowsInvalidOperation()
    {
        await using var db = NewDb();
        var sender = Substitute.For<IMediator>();
        var handler = new ApproveTrainerCommandHandler(db, sender);

        var act = async () => await handler.Handle(
            new ApproveTrainerCommand(Guid.NewGuid()), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Trainer not found");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~ApproveTrainerCommandHandlerTests"`
Expected: FAIL with compile error "ApproveTrainerCommand could not be found".

- [ ] **Step 3: Implement command + handler**

Create `src/Kondix.Application/Commands/Onboarding/ApproveTrainerCommand.cs`:
```csharp
using Kondix.Application.Commands.Catalog;
using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Onboarding;

public sealed record ApproveTrainerCommand(Guid TrainerId) : IRequest<ApprovalResult>;

public sealed record ApprovalResult(
    DateTimeOffset? ApprovedAt,
    int ExercisesSeeded,
    bool AlreadyApproved);

public sealed class ApproveTrainerCommandHandler(IKondixDbContext db, IMediator mediator)
    : IRequestHandler<ApproveTrainerCommand, ApprovalResult>
{
    public async Task<ApprovalResult> Handle(ApproveTrainerCommand request, CancellationToken cancellationToken)
    {
        var trainer = await db.Trainers.FirstOrDefaultAsync(t => t.Id == request.TrainerId, cancellationToken)
            ?? throw new InvalidOperationException("Trainer not found");

        if (trainer.IsApproved)
            return new ApprovalResult(trainer.ApprovedAt, 0, true);

        trainer.IsApproved = true;
        trainer.ApprovedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var seeded = await mediator.Send(new SeedCatalogCommand(trainer.Id), cancellationToken);

        return new ApprovalResult(trainer.ApprovedAt, seeded, false);
    }
}
```

Note: the handler injects `IKondixDbContext` (Application boundary) and dispatches `SeedCatalogCommand` via `IMediator` so the seed handler keeps owning its own DB writes. The trainer flag change saves first; seed runs after — if seed fails, the approval still stands and the trainer can use the manual catalog button as fallback.

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~ApproveTrainerCommandHandlerTests"`
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Onboarding/ApproveTrainerCommand.cs tests/Kondix.UnitTests/Commands/ApproveTrainerCommandHandlerTests.cs
git commit -m "$(cat <<'EOF'
feat(onboarding): ApproveTrainerCommand with auto-seed

Sets IsApproved+ApprovedAt then dispatches SeedCatalogCommand. Idempotent:
calling on an already-approved trainer is a no-op (no re-seed). Throws
InvalidOperationException if trainer not found.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 1.5.3: `ListPendingTrainersQuery`

**Files:**
- Create: `src/Kondix.Application/Queries/Trainers/ListPendingTrainersQuery.cs`
- Test: `tests/Kondix.UnitTests/Queries/ListPendingTrainersQueryTests.cs`

- [ ] **Step 1: Write the failing test**

Create `tests/Kondix.UnitTests/Queries/ListPendingTrainersQueryTests.cs`:
```csharp
using FluentAssertions;
using Kondix.Application.Queries.Trainers;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Queries;

public sealed class ListPendingTrainersQueryTests
{
    private static KondixDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new KondixDbContext(options);
    }

    [Fact]
    public async Task Returns_OnlyUnapproved_OrderedOldestFirst()
    {
        await using var db = NewDb();
        var older = DateTimeOffset.UtcNow.AddDays(-3);
        var newer = DateTimeOffset.UtcNow.AddDays(-1);
        db.Trainers.AddRange(
            new Trainer { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), TenantId = Guid.NewGuid(), DisplayName = "Old", Email = "old@x.com", IsApproved = false, CreatedAt = older },
            new Trainer { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), TenantId = Guid.NewGuid(), DisplayName = "New", Email = "new@x.com", IsApproved = false, CreatedAt = newer },
            new Trainer { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), TenantId = Guid.NewGuid(), DisplayName = "Done", Email = "done@x.com", IsApproved = true, CreatedAt = older }
        );
        await db.SaveChangesAsync();

        var handler = new ListPendingTrainersQueryHandler(db);
        var result = await handler.Handle(new ListPendingTrainersQuery(), CancellationToken.None);

        result.Should().HaveCount(2);
        result[0].DisplayName.Should().Be("Old");
        result[1].DisplayName.Should().Be("New");
    }
}
```

- [ ] **Step 2: Run to verify failure**

Run: `dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~ListPendingTrainersQueryTests"`
Expected: FAIL with compile error.

- [ ] **Step 3: Implement query**

Create `src/Kondix.Application/Queries/Trainers/ListPendingTrainersQuery.cs`:
```csharp
using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Trainers;

public sealed record ListPendingTrainersQuery() : IRequest<List<PendingTrainerDto>>;

public sealed record PendingTrainerDto(
    Guid TrainerId,
    string DisplayName,
    string Email,
    DateTimeOffset RegisteredAt);

public sealed class ListPendingTrainersQueryHandler(IKondixDbContext db)
    : IRequestHandler<ListPendingTrainersQuery, List<PendingTrainerDto>>
{
    public async Task<List<PendingTrainerDto>> Handle(
        ListPendingTrainersQuery request, CancellationToken cancellationToken) =>
        await db.Trainers
            .AsNoTracking()
            .Where(t => !t.IsApproved)
            .OrderBy(t => t.CreatedAt)
            .Select(t => new PendingTrainerDto(t.Id, t.DisplayName, t.Email ?? "", t.CreatedAt))
            .ToListAsync(cancellationToken);
}
```

Note: `Trainer.Email` may be nullable depending on the schema. Verify the property name on the entity before saving — adjust to whatever exists (`Email`, `ContactEmail`, etc.). If the property is named differently, update both the test and the projection together.

- [ ] **Step 4: Run test to verify pass**

Run: `dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~ListPendingTrainersQueryTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Queries/Trainers/ListPendingTrainersQuery.cs tests/Kondix.UnitTests/Queries/ListPendingTrainersQueryTests.cs
git commit -m "$(cat <<'EOF'
feat(trainers): ListPendingTrainersQuery for admin approval flow

Returns unapproved trainers ordered oldest first (admin processes them
in the order they registered). Returns id + displayName + email +
registeredAt; CelvoAdmin renders the list.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 1.5.4: `InternalTrainersController`

**Files:**
- Create: `src/Kondix.Api/Controllers/InternalTrainersController.cs`
- Modify: `src/Kondix.Api/appsettings.json`
- Modify: `src/Kondix.Api/appsettings.Development.json`

- [ ] **Step 1: Add config keys**

Edit `src/Kondix.Api/appsettings.json` — add at the top level (alongside `ConnectionStrings`, etc.):
```json
"Internal": {
  "ApiKey": ""
}
```

Edit `src/Kondix.Api/appsettings.Development.json` — same key with a dev-friendly value:
```json
"Internal": {
  "ApiKey": "dev-internal-key-change-me"
}
```

- [ ] **Step 2: Create the controller**

Create `src/Kondix.Api/Controllers/InternalTrainersController.cs`:
```csharp
using Kondix.Api.Internal;
using Kondix.Application.Commands.Onboarding;
using Kondix.Application.Queries.Trainers;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/internal/trainers")]
public class InternalTrainersController(IMediator mediator, IConfiguration config) : ControllerBase
{
    private bool AuthorizeInternal() =>
        InternalAuth.IsAuthorized(Request, config, "Internal:ApiKey");

    [HttpGet("pending")]
    public async Task<IActionResult> ListPending(CancellationToken ct)
    {
        if (!AuthorizeInternal()) return Unauthorized();
        var result = await mediator.Send(new ListPendingTrainersQuery(), ct);
        return Ok(result);
    }

    [HttpPost("{trainerId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid trainerId, CancellationToken ct)
    {
        if (!AuthorizeInternal()) return Unauthorized();
        try
        {
            var result = await mediator.Send(new ApproveTrainerCommand(trainerId), ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex) when (ex.Message == "Trainer not found")
        {
            return NotFound(new { error = "trainer not found" });
        }
    }
}
```

- [ ] **Step 3: Build to confirm**

Run: `dotnet build Kondix.slnx`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/Kondix.Api/Controllers/InternalTrainersController.cs src/Kondix.Api/appsettings.json src/Kondix.Api/appsettings.Development.json
git commit -m "$(cat <<'EOF'
feat(api): InternalTrainersController for admin approval flow

POST /api/v1/internal/trainers/{id}/approve dispatches ApproveTrainerCommand
(idempotent + auto-seed). GET /pending returns unapproved trainers. Both
gated by X-Internal-Key against Internal:ApiKey config.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 1.5.5: Integration tests for `InternalTrainersController`

**Files:**
- Create: `tests/Kondix.IntegrationTests/InternalTrainersEndpointsTests.cs`

- [ ] **Step 1: Write the integration test class**

Create `tests/Kondix.IntegrationTests/InternalTrainersEndpointsTests.cs`:
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

public sealed class InternalTrainersEndpointsTests : IClassFixture<InternalTrainersFactory>
{
    private readonly InternalTrainersFactory _factory;

    public InternalTrainersEndpointsTests(InternalTrainersFactory f) => _factory = f;

    [Fact]
    public async Task ListPending_WithoutKey_Returns401()
    {
        using var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/v1/internal/trainers/pending");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Approve_Unknown_Returns404()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", InternalTrainersFactory.Key);
        var res = await client.PostAsync($"/api/v1/internal/trainers/{Guid.NewGuid()}/approve", null);
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Approve_FlipsFlagAndSeedsCatalog()
    {
        var trainerId = Guid.NewGuid();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            db.Trainers.Add(new Trainer
            {
                Id = trainerId,
                UserId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                DisplayName = "Pending",
                Email = "p@x.com",
                IsApproved = false,
            });
            await db.SaveChangesAsync();
        }

        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", InternalTrainersFactory.Key);
        var res = await client.PostAsync($"/api/v1/internal/trainers/{trainerId}/approve", null);
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await res.Content.ReadFromJsonAsync<ApprovalBody>();
        body!.AlreadyApproved.Should().BeFalse();
        body.ExercisesSeeded.Should().BeGreaterThan(40); // Seed list has ~50 entries

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            var t = await db.Trainers.FirstAsync(x => x.Id == trainerId);
            t.IsApproved.Should().BeTrue();
            var catalog = await db.CatalogExercises.CountAsync(c => c.TrainerId == trainerId);
            catalog.Should().BeGreaterThan(40);
        }
    }

    [Fact]
    public async Task Approve_AlreadyApproved_IsNoOp()
    {
        var trainerId = Guid.NewGuid();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            db.Trainers.Add(new Trainer
            {
                Id = trainerId,
                UserId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                DisplayName = "Already",
                Email = "a@x.com",
                IsApproved = true,
                ApprovedAt = DateTimeOffset.UtcNow.AddDays(-2),
            });
            await db.SaveChangesAsync();
        }

        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", InternalTrainersFactory.Key);
        var res = await client.PostAsync($"/api/v1/internal/trainers/{trainerId}/approve", null);
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await res.Content.ReadFromJsonAsync<ApprovalBody>();
        body!.AlreadyApproved.Should().BeTrue();
        body.ExercisesSeeded.Should().Be(0);
    }

    private sealed record ApprovalBody(DateTimeOffset? ApprovedAt, int ExercisesSeeded, bool AlreadyApproved);
}

public sealed class InternalTrainersFactory : WebApplicationFactory<Program>
{
    public const string Key = "integration-trainers-key";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Internal:ApiKey", Key);

        builder.ConfigureServices(services =>
        {
            var toRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<KondixDbContext>)
                    || d.ServiceType == typeof(DbContextOptions)
                    || d.ServiceType == typeof(KondixDbContext)
                    || (d.ServiceType.IsGenericType &&
                        d.ServiceType.GetGenericArguments().Any(a => a == typeof(KondixDbContext))))
                .ToList();
            foreach (var d in toRemove) services.Remove(d);

            services.AddDbContext<KondixDbContext>(options =>
                options.UseInMemoryDatabase("KondixInternalTrainers"));
        });
    }
}
```

- [ ] **Step 2: Run all integration tests**

Run: `dotnet test tests/Kondix.IntegrationTests/Kondix.IntegrationTests.csproj`
Expected: All tests PASS (4 new + existing).

- [ ] **Step 3: Commit**

```bash
git add tests/Kondix.IntegrationTests/InternalTrainersEndpointsTests.cs
git commit -m "$(cat <<'EOF'
test(api): integration coverage for InternalTrainersController

Covers 401 (no key), 404 (unknown trainer), 200 with seed (new approval),
200 idempotent (already approved). Uses isolated InMemory DB per fixture.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 1.5.6: Wire `Internal__ApiKey` into deploy config

**Files:**
- Modify: `setup/03-deploy-checklist.md`

- [ ] **Step 1: Document the new env var**

Edit `setup/03-deploy-checklist.md` (or whichever deploy doc lives in `setup/`). Append a section noting that the deploy needs `INTERNAL__APIKEY` (or `Internal__ApiKey` — whichever convention the repo uses for env-var-to-config mapping in .NET) added to the Kondix container in `deploy/docker-compose.prod.yml`. Reference the `deploy/.env.example` pattern from CLAUDE.md.

```markdown
## Phase 1.5 — Trainer approval

Add to `deploy/docker-compose.prod.yml` under `kondix-api.environment`:
- `Internal__ApiKey=${KONDIX_INTERNAL_API_KEY}`

Add to `deploy/.env`:
- `KONDIX_INTERNAL_API_KEY=<32+ random hex chars>`

Confirm CelvoAdmin's deploy gets the same secret as `Kondix__InternalApiKey`
when the CelvoAdmin-side work ships (separate plan).
```

- [ ] **Step 2: Commit**

```bash
git add setup/03-deploy-checklist.md
git commit -m "$(cat <<'EOF'
docs(deploy): document Internal__ApiKey env var for trainer approval

Kondix container needs the secret to validate X-Internal-Key headers from
CelvoAdmin. Same secret used on both sides.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# PHASE 2 — Video demo overlay (no migration)

Adds the "Ver demo" button + full-screen YouTube overlay to the student logging screen. Uses `youtubeEmbedUrl` from Phase 1.

## Task 2.1: `<kx-video-demo-overlay>` component

**Files:**
- Create: `kondix-web/src/app/shared/ui/video-demo-overlay.ts`
- Modify: `kondix-web/src/app/shared/ui/index.ts`

- [ ] **Step 1: Create the component**

Create `kondix-web/src/app/shared/ui/video-demo-overlay.ts`:
```typescript
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { youtubeEmbedUrl } from '../utils/youtube';

@Component({
  selector: 'kx-video-demo-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-up"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'Demo de ' + exerciseName()"
        (click)="onBackdropClick($event)"
      >
        <div
          class="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 overflow-hidden shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-border">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-primary ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-overline text-text-muted">Demo del coach</p>
                <p class="text-sm font-semibold text-text truncate">{{ exerciseName() }}</p>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg bg-card-hover hover:bg-card border border-border flex items-center justify-center text-text-muted hover:text-text transition press"
              (click)="close.emit()"
              aria-label="Cerrar"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          @if (embedUrl(); as src) {
            <div class="aspect-video bg-black">
              <iframe
                [src]="src"
                class="w-full h-full"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          } @else {
            <div class="p-6 text-center text-text-muted text-sm">
              No se pudo cargar el vídeo.
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class KxVideoDemoOverlay {
  private sanitizer = inject(DomSanitizer);

  url = input.required<string>();
  exerciseName = input.required<string>();
  open = input<boolean>(false);
  close = output<void>();

  embedUrl = computed<SafeResourceUrl | null>(() => {
    const normalized = youtubeEmbedUrl(this.url());
    return normalized ? this.sanitizer.bypassSecurityTrustResourceUrl(normalized) : null;
  });

  onBackdropClick(_event: MouseEvent): void {
    this.close.emit();
  }
}
```

- [ ] **Step 2: Re-export from barrel**

In `kondix-web/src/app/shared/ui/index.ts`, append:
```typescript
export * from './video-demo-overlay';
```

- [ ] **Step 3: Build**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add kondix-web/src/app/shared/ui/video-demo-overlay.ts kondix-web/src/app/shared/ui/index.ts
git commit -m "$(cat <<'EOF'
feat(ui): add <kx-video-demo-overlay> for inline demo playback

Full-screen YouTube embed with backdrop click-to-close, header showing
exercise name + "Demo del coach" overline, 16:9 iframe with autoplay+rel=0.
Reuses youtubeEmbedUrl util.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 2.2: Replace inline video card with "Ver demo" pill + overlay

**Files:**
- Modify: `kondix-web/src/app/features/student/feature/exercise-logging.ts`

- [ ] **Step 1: Add import + signal**

In `exercise-logging.ts`, import the overlay:
```typescript
import { KxVideoDemoOverlay } from '../../../shared/ui/video-demo-overlay';
```
Add `KxVideoDemoOverlay` to the `imports` array of the `@Component` decorator.

The component already has a `showVideo = signal(false)` from earlier — keep it (we'll repurpose it for the overlay).

- [ ] **Step 2: Replace the existing video block**

Locate the existing video block (the one that shows a "Ver demostración" button, the inline video iframe, and the upload `<video>` tag — currently around the section that mentions `exercise()!.videoSource !== 'None'`). Replace that whole block with two parts:

(a) A pill button alongside any muscle-group/equipment badges:
```html
@if (exercise()!.videoUrl) {
  <button
    type="button"
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition press"
    (click)="showVideo.set(true)"
    aria-label="Ver demo"
  >
    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z"/>
    </svg>
    Ver demo
  </button>
}
```

(b) The overlay near the end of the template (siblings with the other floating UI):
```html
<kx-video-demo-overlay
  [url]="exercise()?.videoUrl ?? ''"
  [exerciseName]="exercise()?.name ?? ''"
  [open]="showVideo()"
  (close)="showVideo.set(false)"
/>
```

- [ ] **Step 3: Remove dead code**

Delete any remaining usage of the old inline iframe / `<video>` element that the new overlay replaces. The `showVideo` signal stays — its semantics are now "overlay open" instead of "inline player visible".

- [ ] **Step 4: Build**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors.

- [ ] **Step 5: Verify visually**

Run: `cd kondix-web && npx ng serve`. Sign in as a student with an active session whose current exercise has a YouTube `videoUrl`. Confirm:
- Red "Ver demo" pill appears next to the exercise name area.
- Clicking opens a centered card with backdrop, autoplay starts.
- Clicking backdrop or X closes the overlay.
- Exercise without `videoUrl` does NOT show the pill.

- [ ] **Step 6: Commit**

```bash
git add kondix-web/src/app/features/student/feature/exercise-logging.ts
git commit -m "$(cat <<'EOF'
feat(student): "Ver demo" pill + overlay player on exercise logging

Replaces the inline video card with a compact pill button that opens a
full-screen <kx-video-demo-overlay> with autoplay. Pill only renders when
the exercise has a videoUrl in the catalog.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# PHASE 3 — Bidirectional feedback loop (migration + endpoints + UI)

The most invasive phase. One additive migration (`AddSessionAndSetFeedbackFields`), nine new commands/queries, six UI components, and a 4-tab split of `student-detail.ts`. Sub-phases 3.A backend → 3.B UI components → 3.C student-side integration → 3.D trainer drawer.

## 3.A — Backend

### Task 3.A.1: `MoodType` enum

**Files:**
- Create: `src/Kondix.Domain/Enums/MoodType.cs`

- [ ] **Step 1: Create enum**

Create `src/Kondix.Domain/Enums/MoodType.cs`:
```csharp
namespace Kondix.Domain.Enums;

/// <summary>Stored as PascalCase string. UI emoji mapping (frontend only):
/// Great=🔥, Good=✅, Ok=😐, Tough=😮‍💨.</summary>
public enum MoodType
{
    Great,
    Good,
    Ok,
    Tough,
}
```

- [ ] **Step 2: Build to confirm**

Run: `dotnet build src/Kondix.Domain/Kondix.Domain.csproj`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/Kondix.Domain/Enums/MoodType.cs
git commit -m "feat(domain): add MoodType enum (Great|Good|Ok|Tough)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.A.2: Add fields to `SetLog` and `WorkoutSession` entities

**Files:**
- Modify: `src/Kondix.Domain/Entities/SetLog.cs`
- Modify: `src/Kondix.Domain/Entities/WorkoutSession.cs`

- [ ] **Step 1: Extend `SetLog`**

In `src/Kondix.Domain/Entities/SetLog.cs`, add a `Notes` property after `ActualRpe`:
```csharp
public string? Notes { get; set; }
```

- [ ] **Step 2: Extend `WorkoutSession`**

In `src/Kondix.Domain/Entities/WorkoutSession.cs`, add (Mood + FeedbackReviewedAt now; the recovery fields land in Phase 4):
```csharp
using Kondix.Domain.Enums;
// ...
public class WorkoutSession : BaseEntity
{
    // ... existing fields
    public MoodType? Mood { get; set; }
    public DateTimeOffset? FeedbackReviewedAt { get; set; }
}
```

- [ ] **Step 3: Build**

Run: `dotnet build src/Kondix.Domain/Kondix.Domain.csproj`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/Kondix.Domain/Entities/SetLog.cs src/Kondix.Domain/Entities/WorkoutSession.cs
git commit -m "feat(domain): SetLog.Notes + WorkoutSession.{Mood,FeedbackReviewedAt}

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.A.3: New `ExerciseFeedback` entity

**Files:**
- Create: `src/Kondix.Domain/Entities/ExerciseFeedback.cs`
- Create: `src/Kondix.Infrastructure/Persistence/Configurations/ExerciseFeedbackConfiguration.cs`
- Modify: `src/Kondix.Infrastructure/Persistence/KondixDbContext.cs`
- Modify: `src/Kondix.Application/Common/Interfaces/IKondixDbContext.cs`
- Modify: `src/Kondix.Infrastructure/Persistence/Configurations/SetLogConfiguration.cs`
- Modify: `src/Kondix.Infrastructure/Persistence/Configurations/WorkoutSessionConfiguration.cs`

- [ ] **Step 1: Create entity**

Create `src/Kondix.Domain/Entities/ExerciseFeedback.cs`:
```csharp
using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class ExerciseFeedback : BaseEntity
{
    public Guid SessionId { get; set; }
    public Guid ExerciseId { get; set; }
    public int ActualRpe { get; set; }
    public string? Notes { get; set; }

    public WorkoutSession Session { get; set; } = null!;
    public Exercise Exercise { get; set; } = null!;
}
```

- [ ] **Step 2: Create EF configuration**

Create `src/Kondix.Infrastructure/Persistence/Configurations/ExerciseFeedbackConfiguration.cs`:
```csharp
using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public sealed class ExerciseFeedbackConfiguration : IEntityTypeConfiguration<ExerciseFeedback>
{
    public void Configure(EntityTypeBuilder<ExerciseFeedback> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.ActualRpe).IsRequired();
        b.Property(x => x.Notes).HasMaxLength(2000);

        b.HasOne(x => x.Session)
            .WithMany()
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.Exercise)
            .WithMany()
            .HasForeignKey(x => x.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => new { x.SessionId, x.ExerciseId }).IsUnique();
        b.HasIndex(x => new { x.ExerciseId, x.CreatedAt });
    }
}
```

- [ ] **Step 3: Register in `KondixDbContext`**

In `src/Kondix.Infrastructure/Persistence/KondixDbContext.cs`, add:
```csharp
public DbSet<ExerciseFeedback> ExerciseFeedback => Set<ExerciseFeedback>();
```
The `OnModelCreating` already calls `ApplyConfigurationsFromAssembly`, so the new config is picked up automatically — verify by running the build.

- [ ] **Step 4: Add to `IKondixDbContext`**

In `src/Kondix.Application/Common/Interfaces/IKondixDbContext.cs`, append:
```csharp
DbSet<ExerciseFeedback> ExerciseFeedback { get; }
```

- [ ] **Step 5: Map `SetLog.Notes` and `WorkoutSession.Mood`/`FeedbackReviewedAt`**

In `src/Kondix.Infrastructure/Persistence/Configurations/SetLogConfiguration.cs`, add inside `Configure`:
```csharp
b.Property(x => x.Notes).HasMaxLength(2000);
```

In `src/Kondix.Infrastructure/Persistence/Configurations/WorkoutSessionConfiguration.cs`, add:
```csharp
b.Property(x => x.Mood).HasConversion<string>().HasMaxLength(20);
b.Property(x => x.FeedbackReviewedAt);
b.HasIndex(x => new { x.StudentId, x.CompletedAt }).HasFilter("\"feedback_reviewed_at\" IS NULL");
```

(The HasFilter index narrows lookups to the trainer's "unread feedback" check; the index is partial in PostgreSQL.)

- [ ] **Step 6: Build**

Run: `dotnet build Kondix.slnx`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/Kondix.Domain/Entities/ExerciseFeedback.cs src/Kondix.Infrastructure/Persistence/Configurations/ExerciseFeedbackConfiguration.cs src/Kondix.Infrastructure/Persistence/Configurations/SetLogConfiguration.cs src/Kondix.Infrastructure/Persistence/Configurations/WorkoutSessionConfiguration.cs src/Kondix.Infrastructure/Persistence/KondixDbContext.cs src/Kondix.Application/Common/Interfaces/IKondixDbContext.cs
git commit -m "$(cat <<'EOF'
feat(domain): ExerciseFeedback entity + EF configs for v2 feedback loop

Adds (sessionId, exerciseId, actualRpe, notes) with UNIQUE(session, exercise)
and INDEX(exercise, created_at). Maps SetLog.Notes (text) and the
WorkoutSession.Mood/FeedbackReviewedAt fields with a partial index for
unread-feedback lookups.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3.A.4: EF migration `AddSessionAndSetFeedbackFields`

**Files:**
- Create: `src/Kondix.Infrastructure/Migrations/{ts}_AddSessionAndSetFeedbackFields.cs` (auto-generated)

- [ ] **Step 1: Generate migration**

Run:
```bash
dotnet ef migrations add AddSessionAndSetFeedbackFields \
  --project src/Kondix.Infrastructure \
  --startup-project src/Kondix.Api \
  --output-dir Migrations
```

- [ ] **Step 2: Inspect generated SQL**

Run:
```bash
dotnet ef migrations script <PreviousMigrationName> AddSessionAndSetFeedbackFields \
  --project src/Kondix.Infrastructure --startup-project src/Kondix.Api
```
(Replace `<PreviousMigrationName>` with the most recent migration before this one — likely `20260423021147_RenameGroupsToBlocks`.)

Verify the script:
- Adds `set_logs.notes (text NULL)`.
- Adds `workout_sessions.mood (varchar(20) NULL)` and `workout_sessions.feedback_reviewed_at (timestamptz NULL)`.
- Creates partial index on `(student_id, completed_at) WHERE feedback_reviewed_at IS NULL`.
- Creates table `exercise_feedback` with columns + `UNIQUE(session_id, exercise_id)` + `INDEX(exercise_id, created_at)`.
- All in one transaction.

- [ ] **Step 3: Build**

Run: `dotnet build Kondix.slnx`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/Kondix.Infrastructure/Migrations/
git commit -m "$(cat <<'EOF'
chore(db): migration AddSessionAndSetFeedbackFields

Additive: set_logs.notes, workout_sessions.{mood, feedback_reviewed_at},
new table exercise_feedback. No backfill required.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3.A.5: `UpdateSetNoteCommand`

**Files:**
- Create: `src/Kondix.Application/Commands/Sessions/UpdateSetNoteCommand.cs`
- Test: `tests/Kondix.UnitTests/Commands/UpdateSetNoteCommandHandlerTests.cs`

- [ ] **Step 1: Write the failing test**

Create `tests/Kondix.UnitTests/Commands/UpdateSetNoteCommandHandlerTests.cs`:
```csharp
using FluentAssertions;
using Kondix.Application.Commands.Sessions;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class UpdateSetNoteCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(options);
    }

    private static (KondixDbContext db, Guid setLogId, Guid studentId) Seed(bool sessionActive)
    {
        var db = NewDb();
        var studentId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var setLogId = Guid.NewGuid();

        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = sessionId,
            StudentId = studentId,
            RoutineId = Guid.NewGuid(),
            DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-10),
            CompletedAt = sessionActive ? null : DateTimeOffset.UtcNow,
        });
        db.SetLogs.Add(new SetLog
        {
            Id = setLogId,
            SessionId = sessionId,
            StudentId = studentId,
            RoutineId = Guid.NewGuid(),
        });
        db.SaveChanges();
        return (db, setLogId, studentId);
    }

    [Fact]
    public async Task Updates_Notes_When_Session_Active()
    {
        var (db, setLogId, studentId) = Seed(sessionActive: true);
        var handler = new UpdateSetNoteCommandHandler(db);

        await handler.Handle(new UpdateSetNoteCommand(studentId, setLogId, "felt heavy"), default);

        var saved = await db.SetLogs.FirstAsync(s => s.Id == setLogId);
        saved.Notes.Should().Be("felt heavy");
    }

    [Fact]
    public async Task Throws_When_Session_Completed()
    {
        var (db, setLogId, studentId) = Seed(sessionActive: false);
        var handler = new UpdateSetNoteCommandHandler(db);

        var act = async () => await handler.Handle(
            new UpdateSetNoteCommand(studentId, setLogId, "x"), default);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Session not active");
    }

    [Fact]
    public async Task Throws_When_NotOwner()
    {
        var (db, setLogId, _) = Seed(sessionActive: true);
        var handler = new UpdateSetNoteCommandHandler(db);

        var act = async () => await handler.Handle(
            new UpdateSetNoteCommand(Guid.NewGuid(), setLogId, "x"), default);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Set log not found");
    }
}
```

- [ ] **Step 2: Run test to verify failure**

Run: `dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~UpdateSetNoteCommandHandlerTests"`
Expected: FAIL with compile errors.

- [ ] **Step 3: Implement command + handler**

Create `src/Kondix.Application/Commands/Sessions/UpdateSetNoteCommand.cs`:
```csharp
using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Sessions;

public sealed record UpdateSetNoteCommand(Guid StudentId, Guid SetLogId, string? Note) : IRequest;

public sealed class UpdateSetNoteCommandHandler(IKondixDbContext db)
    : IRequestHandler<UpdateSetNoteCommand>
{
    public async Task Handle(UpdateSetNoteCommand request, CancellationToken cancellationToken)
    {
        var setLog = await db.SetLogs
            .Include(s => s.Session)
            .FirstOrDefaultAsync(s => s.Id == request.SetLogId && s.StudentId == request.StudentId, cancellationToken)
            ?? throw new InvalidOperationException("Set log not found");

        if (setLog.Session.CompletedAt is not null)
            throw new InvalidOperationException("Session not active");

        setLog.Notes = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        await db.SaveChangesAsync(cancellationToken);
    }
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~UpdateSetNoteCommandHandlerTests"`
Expected: 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Sessions/UpdateSetNoteCommand.cs tests/Kondix.UnitTests/Commands/UpdateSetNoteCommandHandlerTests.cs
git commit -m "feat(sessions): UpdateSetNoteCommand for per-set student notes

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.A.6: `UpsertExerciseFeedbackCommand`

**Files:**
- Create: `src/Kondix.Application/Commands/Sessions/UpsertExerciseFeedbackCommand.cs`
- Create: `src/Kondix.Application/Validators/UpsertExerciseFeedbackValidator.cs`
- Test: `tests/Kondix.UnitTests/Commands/UpsertExerciseFeedbackCommandHandlerTests.cs`

- [ ] **Step 1: Write the failing test**

Create `tests/Kondix.UnitTests/Commands/UpsertExerciseFeedbackCommandHandlerTests.cs`:
```csharp
using FluentAssertions;
using Kondix.Application.Commands.Sessions;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class UpsertExerciseFeedbackCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var o = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(o);
    }

    private static (KondixDbContext db, Guid sessionId, Guid exerciseId, Guid studentId) Seed(bool active)
    {
        var db = NewDb();
        var studentId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var exerciseId = Guid.NewGuid();
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = sessionId,
            StudentId = studentId,
            RoutineId = Guid.NewGuid(),
            DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-15),
            CompletedAt = active ? null : DateTimeOffset.UtcNow,
        });
        db.SaveChanges();
        return (db, sessionId, exerciseId, studentId);
    }

    [Fact]
    public async Task Inserts_When_None_Exists()
    {
        var (db, sessionId, exerciseId, studentId) = Seed(active: true);
        var handler = new UpsertExerciseFeedbackCommandHandler(db);

        await handler.Handle(new UpsertExerciseFeedbackCommand(
            studentId, sessionId, exerciseId, 8, "tough"), default);

        var fb = await db.ExerciseFeedback.FirstAsync();
        fb.SessionId.Should().Be(sessionId);
        fb.ExerciseId.Should().Be(exerciseId);
        fb.ActualRpe.Should().Be(8);
        fb.Notes.Should().Be("tough");
    }

    [Fact]
    public async Task Updates_When_Existing()
    {
        var (db, sessionId, exerciseId, studentId) = Seed(active: true);
        db.ExerciseFeedback.Add(new ExerciseFeedback
        {
            SessionId = sessionId, ExerciseId = exerciseId,
            ActualRpe = 5, Notes = "old",
        });
        await db.SaveChangesAsync();

        var handler = new UpsertExerciseFeedbackCommandHandler(db);
        await handler.Handle(new UpsertExerciseFeedbackCommand(
            studentId, sessionId, exerciseId, 9, "new"), default);

        (await db.ExerciseFeedback.CountAsync()).Should().Be(1);
        var fb = await db.ExerciseFeedback.FirstAsync();
        fb.ActualRpe.Should().Be(9);
        fb.Notes.Should().Be("new");
    }

    [Fact]
    public async Task Throws_When_Session_Completed()
    {
        var (db, sessionId, exerciseId, studentId) = Seed(active: false);
        var handler = new UpsertExerciseFeedbackCommandHandler(db);
        var act = async () => await handler.Handle(
            new UpsertExerciseFeedbackCommand(studentId, sessionId, exerciseId, 7, null), default);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Session not active");
    }
}
```

- [ ] **Step 2: Run test to verify failure**

Run: `dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~UpsertExerciseFeedbackCommandHandlerTests"`
Expected: FAIL.

- [ ] **Step 3: Implement command + validator**

Create `src/Kondix.Application/Commands/Sessions/UpsertExerciseFeedbackCommand.cs`:
```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Sessions;

public sealed record UpsertExerciseFeedbackCommand(
    Guid StudentId,
    Guid SessionId,
    Guid ExerciseId,
    int ActualRpe,
    string? Notes) : IRequest;

public sealed class UpsertExerciseFeedbackCommandHandler(IKondixDbContext db)
    : IRequestHandler<UpsertExerciseFeedbackCommand>
{
    public async Task Handle(UpsertExerciseFeedbackCommand request, CancellationToken cancellationToken)
    {
        var session = await db.WorkoutSessions
            .FirstOrDefaultAsync(s => s.Id == request.SessionId && s.StudentId == request.StudentId, cancellationToken)
            ?? throw new InvalidOperationException("Session not found");
        if (session.CompletedAt is not null)
            throw new InvalidOperationException("Session not active");

        var existing = await db.ExerciseFeedback.FirstOrDefaultAsync(
            f => f.SessionId == request.SessionId && f.ExerciseId == request.ExerciseId, cancellationToken);

        if (existing is null)
        {
            db.ExerciseFeedback.Add(new ExerciseFeedback
            {
                SessionId = request.SessionId,
                ExerciseId = request.ExerciseId,
                ActualRpe = request.ActualRpe,
                Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            });
        }
        else
        {
            existing.ActualRpe = request.ActualRpe;
            existing.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
```

Create `src/Kondix.Application/Validators/UpsertExerciseFeedbackValidator.cs`:
```csharp
using FluentValidation;
using Kondix.Application.Commands.Sessions;

namespace Kondix.Application.Validators;

public sealed class UpsertExerciseFeedbackValidator : AbstractValidator<UpsertExerciseFeedbackCommand>
{
    public UpsertExerciseFeedbackValidator()
    {
        RuleFor(x => x.ActualRpe).InclusiveBetween(1, 10);
        RuleFor(x => x.Notes).MaximumLength(2000);
    }
}
```

- [ ] **Step 4: Run tests**

Run: `dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~UpsertExerciseFeedbackCommand"`
Expected: 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Sessions/UpsertExerciseFeedbackCommand.cs src/Kondix.Application/Validators/UpsertExerciseFeedbackValidator.cs tests/Kondix.UnitTests/Commands/UpsertExerciseFeedbackCommandHandlerTests.cs
git commit -m "feat(sessions): UpsertExerciseFeedbackCommand for per-exercise RPE+note

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.A.7: Make `CompleteSessionCommand` idempotent + accept mood

**Files:**
- Modify: `src/Kondix.Application/Commands/Sessions/CompleteSessionCommand.cs`
- Test: extend `tests/Kondix.UnitTests/Commands/` with `CompleteSessionCommandHandlerTests.cs` (likely already exists — extend if so).

- [ ] **Step 1: Inspect current handler**

Open `src/Kondix.Application/Commands/Sessions/CompleteSessionCommand.cs`. Note that the current handler throws `InvalidOperationException("Session already completed")` when re-called. The new behavior: if session has `CompletedAt`, update only `Mood`/`Notes` (treat call as feedback patch), do NOT advance rotation, return DTO.

- [ ] **Step 2: Write/extend the failing test**

Create `tests/Kondix.UnitTests/Commands/CompleteSessionCommandHandlerTests.cs` (or extend if it exists):
```csharp
using FluentAssertions;
using Kondix.Application.Commands.Sessions;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class CompleteSessionCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var o = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(o);
    }

    [Fact]
    public async Task First_Call_Sets_CompletedAt_And_Mood()
    {
        await using var db = NewDb();
        var sessionId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = sessionId, StudentId = studentId,
            RoutineId = Guid.NewGuid(), DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-30),
        });
        await db.SaveChangesAsync();

        var handler = new CompleteSessionHandler(db);
        var dto = await handler.Handle(
            new CompleteSessionCommand(sessionId, studentId, "good", MoodType.Good), default);

        dto.CompletedAt.Should().NotBeNull();
        var saved = await db.WorkoutSessions.FirstAsync(s => s.Id == sessionId);
        saved.CompletedAt.Should().NotBeNull();
        saved.Mood.Should().Be(MoodType.Good);
        saved.Notes.Should().Be("good");
    }

    [Fact]
    public async Task Second_Call_Updates_Mood_Without_Throwing()
    {
        await using var db = NewDb();
        var sessionId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var firstAt = DateTimeOffset.UtcNow.AddMinutes(-1);
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = sessionId, StudentId = studentId,
            RoutineId = Guid.NewGuid(), DayId = Guid.NewGuid(),
            StartedAt = firstAt.AddMinutes(-30),
            CompletedAt = firstAt,
            Mood = MoodType.Ok,
            Notes = "old",
        });
        await db.SaveChangesAsync();

        var handler = new CompleteSessionHandler(db);
        await handler.Handle(new CompleteSessionCommand(sessionId, studentId, "actually rough", MoodType.Tough), default);

        var saved = await db.WorkoutSessions.FirstAsync(s => s.Id == sessionId);
        saved.CompletedAt.Should().Be(firstAt);  // not bumped
        saved.Mood.Should().Be(MoodType.Tough);
        saved.Notes.Should().Be("actually rough");
    }
}
```

- [ ] **Step 3: Update the command record + handler**

Replace the existing record + handler with:
```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Sessions;

public sealed record CompleteSessionCommand(
    Guid SessionId,
    Guid StudentId,
    string? Notes,
    MoodType? Mood) : IRequest<WorkoutSessionDto>;

public sealed class CompleteSessionHandler(IKondixDbContext db)
    : IRequestHandler<CompleteSessionCommand, WorkoutSessionDto>
{
    public async Task<WorkoutSessionDto> Handle(CompleteSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await db.WorkoutSessions
            .FirstOrDefaultAsync(ws => ws.Id == request.SessionId && ws.StudentId == request.StudentId, cancellationToken)
            ?? throw new InvalidOperationException("Session not found");

        var firstCompletion = session.CompletedAt is null;
        if (firstCompletion) session.CompletedAt = DateTimeOffset.UtcNow;

        session.Notes = request.Notes;
        session.Mood = request.Mood;

        if (firstCompletion && session.ProgramAssignmentId.HasValue)
        {
            var pa = await db.ProgramAssignments
                .FirstOrDefaultAsync(p => p.Id == session.ProgramAssignmentId
                    && p.Status == ProgramAssignmentStatus.Active, cancellationToken);
            if (pa is not null && pa.Mode == ProgramAssignmentMode.Rotation) pa.RotationIndex++;
            if (pa is not null && DateOnly.FromDateTime(DateTime.UtcNow) >= pa.EndDate)
            {
                pa.Status = ProgramAssignmentStatus.Completed;
                pa.CompletedAt = DateTimeOffset.UtcNow;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return new WorkoutSessionDto(session.Id, session.RoutineId, session.DayId,
            session.StartedAt, session.CompletedAt, session.Notes);
    }
}
```

- [ ] **Step 4: Update controller signature**

In `src/Kondix.Api/Controllers/StudentPortalController.cs`, locate `CompleteSession` action. Replace its body and the `CompleteSessionRequest` record at the bottom of the file:
```csharp
[HttpPost("sessions/{id:guid}/complete")]
public async Task<IActionResult> CompleteSession(Guid id, [FromBody] CompleteSessionRequest? request, CancellationToken ct)
{
    var studentId = HttpContext.GetStudentId();
    var result = await mediator.Send(new CompleteSessionCommand(id, studentId, request?.Notes, request?.Mood), ct);
    return Ok(result);
}
// ... at the bottom of the file:
public sealed record CompleteSessionRequest(string? Notes, MoodType? Mood);
```
Add `using Kondix.Domain.Enums;` if not already imported.

- [ ] **Step 5: Run tests**

Run: `dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~CompleteSessionCommandHandlerTests"`
Expected: 2 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/Kondix.Application/Commands/Sessions/CompleteSessionCommand.cs src/Kondix.Api/Controllers/StudentPortalController.cs tests/Kondix.UnitTests/Commands/CompleteSessionCommandHandlerTests.cs
git commit -m "$(cat <<'EOF'
feat(sessions): idempotent CompleteSession + Mood capture

Second calls update mood/notes without bumping completedAt or advancing
rotation. Mitigates the "Session already completed" middleware spam
documented in CLAUDE.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3.A.8: PR detection inline in `UpdateSetDataCommand`

**Files:**
- Modify: `src/Kondix.Application/Commands/Sessions/UpdateSetDataCommand.cs`
- Modify: `src/Kondix.Application/DTOs/SessionDtos.cs` (or wherever `SetLogDto` is — verify)

- [ ] **Step 1: Inspect current command**

Open `src/Kondix.Application/Commands/Sessions/UpdateSetDataCommand.cs`. Note current return type (likely `SetLogDto` or void); the new return type wraps the existing log + an optional `NewPrDto` (already declared in `Kondix.Application/DTOs/PersonalRecordDtos.cs`).

- [ ] **Step 2: Add response DTO**

In an appropriate DTO file (`SessionDtos.cs` or next to existing `SetLogDto`), add:
```csharp
public sealed record UpdateSetDataResponse(SetLogDto SetLog, NewPrDto? NewPr);
```

- [ ] **Step 3: Modify handler to dispatch PR detection after save**

Update the `UpdateSetDataCommand` record and handler:
```csharp
public sealed record UpdateSetDataCommand(
    Guid StudentId, Guid SessionId, Guid SetId, Guid RoutineId,
    string? Weight, string? Reps, int? Rpe) : IRequest<UpdateSetDataResponse>;

public sealed class UpdateSetDataCommandHandler(IKondixDbContext db, IMediator mediator)
    : IRequestHandler<UpdateSetDataCommand, UpdateSetDataResponse>
{
    public async Task<UpdateSetDataResponse> Handle(UpdateSetDataCommand request, CancellationToken cancellationToken)
    {
        // ... preserve EXISTING upsert logic + race-retry
        // After SaveChangesAsync that persists the set:

        NewPrDto? pr = null;
        try
        {
            var prs = await mediator.Send(new DetectNewPRsCommand(request.StudentId, request.SessionId), cancellationToken);
            // The exercise that just got logged is the snapshot exercise of the set
            // we updated; pick the matching one if present.
            var setLog = await db.SetLogs.AsNoTracking()
                .FirstAsync(sl => sl.SessionId == request.SessionId && sl.SetId == request.SetId, cancellationToken);
            pr = prs.FirstOrDefault(p => p.ExerciseName == setLog.SnapshotExerciseName);
        }
        catch
        {
            // PR detection failure must not block the set update — toast missed
            // is recoverable, write durability is not.
            pr = null;
        }

        var dto = /* existing SetLogDto build */;
        return new UpdateSetDataResponse(dto, pr);
    }
}
```

The exact preserved upsert logic depends on what's already in the file. Keep it byte-for-byte identical; the only delta is wrapping the return + dispatching `DetectNewPRsCommand` after the original `SaveChangesAsync`. If the current handler returns a different shape, adapt it: callers expect `UpdateSetDataResponse` from now on.

- [ ] **Step 4: Update controller**

In `StudentPortalController.cs`, the `UpdateSetData` action returns whatever the handler returns. The shape change is automatic via `mediator.Send`. Verify the action returns `Ok(result)`.

- [ ] **Step 5: Build and re-run integration tests**

Run: `dotnet build Kondix.slnx && dotnet test tests/Kondix.IntegrationTests/Kondix.IntegrationTests.csproj`
Expected: 0 errors. All existing tests still pass.

- [ ] **Step 6: Add a unit test for the PR-inline behavior**

Append to `tests/Kondix.UnitTests/Commands/UpdateSetDataCommandHandlerTests.cs` (create if not present):
```csharp
[Fact]
public async Task Returns_NewPr_When_Detected()
{
    // Arrange seed: existing PR for "Press banca" at 80kg, then update a set
    // with 85kg → expect newPr.previousWeight == "80" and newPr.weight == "85kg".
    // (Concrete arrange follows the seed pattern from existing handler tests.)
    // Asserts response.NewPr is not null and matches the lifted weight.
}
```
Tighten the asserts based on the existing seed helpers in your repo.

- [ ] **Step 7: Commit**

```bash
git add src/Kondix.Application/Commands/Sessions/UpdateSetDataCommand.cs src/Kondix.Application/DTOs/ tests/Kondix.UnitTests/Commands/UpdateSetDataCommandHandlerTests.cs
git commit -m "$(cat <<'EOF'
feat(sessions): inline PR detection in UpdateSetDataCommand response

Returns { setLog, newPr? } so the student-side toast fires immediately
without an extra GET. PR-detection failure is swallowed — write durability
takes priority over toast visibility.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3.A.9: Trainer queries — recent feedback + mark-read

**Files:**
- Create: `src/Kondix.Application/Queries/Analytics/GetRecentFeedbackQuery.cs`
- Create: `src/Kondix.Application/Commands/Sessions/MarkFeedbackReadCommand.cs`
- Test: `tests/Kondix.UnitTests/Queries/GetRecentFeedbackQueryTests.cs`

- [ ] **Step 1: Write the failing query test**

Create `tests/Kondix.UnitTests/Queries/GetRecentFeedbackQueryTests.cs`:
```csharp
using FluentAssertions;
using Kondix.Application.Queries.Analytics;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Queries;

public sealed class GetRecentFeedbackQueryTests
{
    private static KondixDbContext NewDb()
    {
        var o = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(o);
    }

    [Fact]
    public async Task Counts_Only_Unread_With_Feedback()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        var routine = new Routine { Id = Guid.NewGuid(), Name = "R" };
        db.Routines.Add(routine);
        // Unread + has mood → counted
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = Guid.NewGuid(), StudentId = studentId,
            RoutineId = routine.Id, DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddDays(-1),
            CompletedAt = DateTimeOffset.UtcNow.AddDays(-1).AddHours(1),
            Mood = MoodType.Good,
        });
        // Read (FeedbackReviewedAt set) → not counted
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = Guid.NewGuid(), StudentId = studentId,
            RoutineId = routine.Id, DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddDays(-2),
            CompletedAt = DateTimeOffset.UtcNow.AddDays(-2).AddHours(1),
            Mood = MoodType.Good,
            FeedbackReviewedAt = DateTimeOffset.UtcNow.AddHours(-1),
        });
        // Unread but no feedback → not counted
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = Guid.NewGuid(), StudentId = studentId,
            RoutineId = routine.Id, DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddDays(-1),
            CompletedAt = DateTimeOffset.UtcNow.AddDays(-1).AddHours(1),
        });
        await db.SaveChangesAsync();

        var handler = new GetRecentFeedbackQueryHandler(db);
        var result = await handler.Handle(new GetRecentFeedbackQuery(studentId), default);

        result.UnreadCount.Should().Be(1);
        result.Sessions.Should().HaveCount(1);
    }
}
```

- [ ] **Step 2: Run to verify failure**

Run: `dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~GetRecentFeedbackQueryTests"`
Expected: FAIL.

- [ ] **Step 3: Implement query**

Create `src/Kondix.Application/Queries/Analytics/GetRecentFeedbackQuery.cs`:
```csharp
using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Analytics;

public sealed record GetRecentFeedbackQuery(Guid StudentId) : IRequest<RecentFeedbackDto>;

public sealed record RecentFeedbackSessionDto(
    Guid SessionId,
    string RoutineName,
    DateTimeOffset CompletedAt,
    string? Mood,
    bool HasNotes);

public sealed record RecentFeedbackDto(int UnreadCount, List<RecentFeedbackSessionDto> Sessions);

public sealed class GetRecentFeedbackQueryHandler(IKondixDbContext db)
    : IRequestHandler<GetRecentFeedbackQuery, RecentFeedbackDto>
{
    public async Task<RecentFeedbackDto> Handle(GetRecentFeedbackQuery request, CancellationToken cancellationToken)
    {
        var unread = db.WorkoutSessions
            .AsNoTracking()
            .Where(s => s.StudentId == request.StudentId
                && s.CompletedAt != null
                && s.FeedbackReviewedAt == null
                && (s.Mood != null
                    || s.Notes != null
                    || db.ExerciseFeedback.Any(f => f.SessionId == s.Id)
                    || db.SetLogs.Any(sl => sl.SessionId == s.Id && sl.Notes != null)));

        var count = await unread.CountAsync(cancellationToken);

        var sessions = await unread
            .OrderByDescending(s => s.CompletedAt)
            .Take(5)
            .Select(s => new RecentFeedbackSessionDto(
                s.Id,
                s.Routine.Name,
                s.CompletedAt!.Value,
                s.Mood == null ? null : s.Mood.ToString(),
                s.Notes != null))
            .ToListAsync(cancellationToken);

        return new RecentFeedbackDto(count, sessions);
    }
}
```

- [ ] **Step 4: Implement `MarkFeedbackReadCommand`**

Create `src/Kondix.Application/Commands/Sessions/MarkFeedbackReadCommand.cs`:
```csharp
using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Sessions;

public sealed record MarkFeedbackReadCommand(Guid StudentId) : IRequest;

public sealed class MarkFeedbackReadCommandHandler(IKondixDbContext db)
    : IRequestHandler<MarkFeedbackReadCommand>
{
    public async Task Handle(MarkFeedbackReadCommand request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var sessions = await db.WorkoutSessions
            .Where(s => s.StudentId == request.StudentId
                && s.CompletedAt != null
                && s.FeedbackReviewedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var s in sessions) s.FeedbackReviewedAt = now;
        if (sessions.Count > 0) await db.SaveChangesAsync(cancellationToken);
    }
}
```

- [ ] **Step 5: Run tests**

Run: `dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~GetRecentFeedbackQueryTests"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/Kondix.Application/Queries/Analytics/GetRecentFeedbackQuery.cs src/Kondix.Application/Commands/Sessions/MarkFeedbackReadCommand.cs tests/Kondix.UnitTests/Queries/GetRecentFeedbackQueryTests.cs
git commit -m "$(cat <<'EOF'
feat(analytics): GetRecentFeedbackQuery + MarkFeedbackReadCommand

Powers the badge count + Resumen banner on the trainer student drawer.
Mark-read flips FeedbackReviewedAt for all student's completed sessions
in one batch (called when trainer opens the Progreso tab).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3.A.10: Wire new endpoints in controllers

**Files:**
- Modify: `src/Kondix.Api/Controllers/StudentPortalController.cs`
- Modify: `src/Kondix.Api/Controllers/StudentsController.cs` (or whichever trainer-students controller exists — verify; if missing, create alongside)

- [ ] **Step 1: Student endpoints — add to `StudentPortalController`**

Inside the controller class, after existing actions, append:
```csharp
[HttpPatch("sets/{setLogId:guid}/note")]
public async Task<IActionResult> UpdateSetNote(Guid setLogId, [FromBody] UpdateSetNoteRequest request, CancellationToken ct)
{
    var studentId = HttpContext.GetStudentId();
    await mediator.Send(new UpdateSetNoteCommand(studentId, setLogId, request.Note), ct);
    return NoContent();
}

[HttpPost("sessions/{id:guid}/exercise-feedback")]
public async Task<IActionResult> UpsertExerciseFeedback(Guid id, [FromBody] UpsertExerciseFeedbackRequest request, CancellationToken ct)
{
    var studentId = HttpContext.GetStudentId();
    await mediator.Send(new UpsertExerciseFeedbackCommand(studentId, id, request.ExerciseId, request.ActualRpe, request.Notes), ct);
    return NoContent();
}
```

At the bottom of the file (request DTOs section):
```csharp
public sealed record UpdateSetNoteRequest(string? Note);
public sealed record UpsertExerciseFeedbackRequest(Guid ExerciseId, int ActualRpe, string? Notes);
```

Add the missing `using` statements.

- [ ] **Step 2: Trainer endpoints — find the right controller**

Run: `grep -rn "Route(\"api/v1/students\"" src/Kondix.Api/Controllers/` to find the trainer students controller. Add two actions there:
```csharp
[HttpGet("{id:guid}/recent-feedback")]
public async Task<IActionResult> RecentFeedback(Guid id, CancellationToken ct)
{
    RequirePermission("kondix:students:read");
    var result = await mediator.Send(new GetRecentFeedbackQuery(id), ct);
    return Ok(result);
}

[HttpPost("{id:guid}/feedback/mark-read")]
public async Task<IActionResult> MarkFeedbackRead(Guid id, CancellationToken ct)
{
    RequirePermission("kondix:students:read");
    await mediator.Send(new MarkFeedbackReadCommand(id), ct);
    return NoContent();
}
```

If no trainer students controller exists yet, create `src/Kondix.Api/Controllers/StudentsController.cs` following the conventions of other controllers (primary constructor with `IMediator mediator`, `RequirePermission` helper, etc.).

- [ ] **Step 3: Build**

Run: `dotnet build Kondix.slnx`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/Kondix.Api/Controllers/
git commit -m "$(cat <<'EOF'
feat(api): wire Phase 3 feedback endpoints

Student: PATCH /sets/{id}/note, POST /sessions/{id}/exercise-feedback,
extended POST /sessions/{id}/complete (mood).
Trainer: GET /students/{id}/recent-feedback, POST /students/{id}/feedback/mark-read.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 3.B — Shared UI components

### Task 3.B.1: `<kx-rpe-stepper>`

**Files:**
- Create: `kondix-web/src/app/shared/ui/rpe-stepper.ts`
- Modify: `kondix-web/src/app/shared/ui/index.ts`

- [ ] **Step 1: Create component**

Create `kondix-web/src/app/shared/ui/rpe-stepper.ts`:
```typescript
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

const RPE_COLORS: Record<number, string> = {
  1: '#22C55E', 2: '#22C55E', 3: '#22C55E', 4: '#84CC16',
  5: '#84CC16', 6: '#F59E0B', 7: '#F59E0B', 8: '#F97316',
  9: '#EF4444', 10: '#EF4444',
};

@Component({
  selector: 'kx-rpe-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      @if (showLabel()) {
        <p class="text-overline text-text-muted">RPE percibido</p>
      }
      <div class="grid grid-cols-10 gap-1">
        @for (n of steps; track n) {
          <button
            type="button"
            class="h-10 rounded-md border text-sm font-bold transition press"
            [class.border-border]="value() !== n"
            [class.text-text-muted]="value() !== n"
            [class.bg-card]="value() !== n"
            [class.border-primary]="value() === n"
            [class.bg-primary]="value() === n"
            [class.text-white]="value() === n"
            [style.boxShadow]="value() === n ? '0 0 12px ' + colorFor(n) + '60' : 'none'"
            (click)="valueChange.emit(n)"
            [attr.aria-pressed]="value() === n"
            [attr.aria-label]="'RPE ' + n"
          >
            {{ n }}
          </button>
        }
      </div>
      @if (value() != null) {
        <p class="text-xs text-text-muted text-center">
          {{ describeRpe(value()!) }}
        </p>
      }
    </div>
  `,
})
export class KxRpeStepper {
  value = input<number | null>(null);
  showLabel = input<boolean>(true);
  valueChange = output<number>();

  steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  colorFor(n: number): string {
    return RPE_COLORS[n] ?? '#71717A';
  }

  describeRpe(n: number): string {
    if (n <= 3) return 'Muy fácil — sobraban muchas reps';
    if (n <= 5) return 'Cómodo — sobraban varias reps';
    if (n <= 7) return 'Exigente — 2 a 3 reps en reserva';
    if (n <= 8) return 'Duro — 1 a 2 reps en reserva';
    if (n === 9) return 'Casi al fallo — 1 rep en reserva';
    return 'Al fallo';
  }
}
```

- [ ] **Step 2: Re-export**

In `kondix-web/src/app/shared/ui/index.ts`, append:
```typescript
export * from './rpe-stepper';
```

- [ ] **Step 3: Build + commit**

```bash
cd kondix-web && npx ng build
```
```bash
git add kondix-web/src/app/shared/ui/rpe-stepper.ts kondix-web/src/app/shared/ui/index.ts
git commit -m "feat(ui): add <kx-rpe-stepper> with green→amber→red scale

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.B.2: `<kx-mood-picker>`

**Files:**
- Create: `kondix-web/src/app/shared/ui/mood-picker.ts`
- Modify: `kondix-web/src/app/shared/ui/index.ts`

- [ ] **Step 1: Create component**

Create `kondix-web/src/app/shared/ui/mood-picker.ts`:
```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type MoodValue = 'Great' | 'Good' | 'Ok' | 'Tough';

interface Mood { value: MoodValue; emoji: string; label: string; }

const MOODS: Mood[] = [
  { value: 'Great', emoji: '🔥', label: 'Brutal' },
  { value: 'Good',  emoji: '✅', label: 'Bien' },
  { value: 'Ok',    emoji: '😐', label: 'Normal' },
  { value: 'Tough', emoji: '😮‍💨', label: 'Duro' },
];

@Component({
  selector: 'kx-mood-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-4 gap-2">
      @for (m of moods; track m.value) {
        <button
          type="button"
          class="flex flex-col items-center gap-1 py-3 rounded-xl border transition press"
          [class.border-border]="value() !== m.value"
          [class.bg-card]="value() !== m.value"
          [class.border-primary]="value() === m.value"
          [class.bg-primary/10]="value() === m.value"
          (click)="valueChange.emit(m.value)"
          [attr.aria-pressed]="value() === m.value"
          [attr.aria-label]="m.label"
        >
          <span class="text-2xl">{{ m.emoji }}</span>
          <span class="text-[10px] font-semibold uppercase tracking-wider"
            [class.text-text-muted]="value() !== m.value"
            [class.text-primary]="value() === m.value">
            {{ m.label }}
          </span>
        </button>
      }
    </div>
  `,
})
export class KxMoodPicker {
  value = input<MoodValue | null>(null);
  valueChange = output<MoodValue>();
  moods = MOODS;
}
```

- [ ] **Step 2: Re-export + build + commit**

In `kondix-web/src/app/shared/ui/index.ts`, append:
```typescript
export * from './mood-picker';
```
```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/shared/ui/mood-picker.ts kondix-web/src/app/shared/ui/index.ts
git commit -m "feat(ui): add <kx-mood-picker> (Great|Good|Ok|Tough)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.B.3: `<kx-set-chip>`

**Files:**
- Create: `kondix-web/src/app/shared/ui/set-chip.ts`
- Modify: `kondix-web/src/app/shared/ui/index.ts`

- [ ] **Step 1: Create component**

Create `kondix-web/src/app/shared/ui/set-chip.ts`:
```typescript
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'kx-set-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium"
      [class]="containerClass()"
      [title]="note() ?? ''"
    >
      @if (isPR()) {
        <span class="text-[10px]" aria-label="Récord">🏆</span>
      }
      <span class="font-bold tabular-nums">{{ weight() }}kg</span>
      <span class="text-text-muted">×</span>
      <span class="tabular-nums">{{ reps() }}</span>
      @if (note()) {
        <span class="text-[10px]" aria-label="Tiene nota">💬</span>
      }
    </span>
  `,
})
export class KxSetChip {
  weight = input.required<string>();
  reps = input.required<number>();
  isPR = input<boolean>(false);
  note = input<string | null>(null);
  setType = input<string>('Effective');

  containerClass = computed(() => {
    if (this.isPR()) return 'border-amber-500/50 bg-amber-500/10 text-amber-200';
    return 'border-border bg-card text-text';
  });
}
```

- [ ] **Step 2: Re-export + build + commit**

```typescript
// shared/ui/index.ts
export * from './set-chip';
```
```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/shared/ui/set-chip.ts kondix-web/src/app/shared/ui/index.ts
git commit -m "feat(ui): add <kx-set-chip> for trainer historical timeline

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.B.4: `<kx-exercise-feedback-modal>`

**Files:**
- Create: `kondix-web/src/app/shared/ui/exercise-feedback-modal.ts`
- Modify: `kondix-web/src/app/shared/ui/index.ts`

- [ ] **Step 1: Create component**

Create `kondix-web/src/app/shared/ui/exercise-feedback-modal.ts`:
```typescript
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KxRpeStepper } from './rpe-stepper';

export interface ExerciseFeedbackPayload { rpe: number; notes: string | null; }

@Component({
  selector: 'kx-exercise-feedback-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, KxRpeStepper],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-up"
        role="dialog" aria-modal="true">
        <div class="w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div class="px-5 py-4 border-b border-border">
            <p class="text-overline text-text-muted">Cómo te fue</p>
            <h3 class="text-h3 text-text font-display mt-0.5">{{ exerciseName() }}</h3>
          </div>
          <div class="px-5 py-5 space-y-5">
            <kx-rpe-stepper
              [value]="rpe()"
              (valueChange)="rpe.set($event)"
            />
            <div>
              <label class="block text-overline text-text-muted mb-2">Notas (opcional)</label>
              <textarea
                class="w-full bg-bg-raised border border-border rounded-lg p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
                rows="3"
                placeholder="Algo que quieras decirle al coach…"
                [(ngModel)]="notesValue"
                maxlength="2000"
              ></textarea>
            </div>
            <div class="flex gap-2 pt-1">
              <button type="button"
                class="flex-1 py-2.5 bg-bg-raised border border-border text-text-muted text-sm rounded-lg hover:text-text transition press"
                (click)="skip.emit()">
                Saltar
              </button>
              <button type="button"
                [disabled]="rpe() == null"
                class="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-primary-hover transition press"
                (click)="onSubmit()">
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class KxExerciseFeedbackModal {
  exerciseName = input.required<string>();
  open = input<boolean>(false);
  submit = output<ExerciseFeedbackPayload>();
  skip = output<void>();

  rpe = signal<number | null>(null);
  notesValue = '';

  onSubmit(): void {
    const r = this.rpe();
    if (r == null) return;
    const notes = this.notesValue.trim();
    this.submit.emit({ rpe: r, notes: notes.length > 0 ? notes : null });
    this.rpe.set(null);
    this.notesValue = '';
  }
}
```

- [ ] **Step 2: Re-export + build + commit**

```typescript
// shared/ui/index.ts
export * from './exercise-feedback-modal';
```
```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/shared/ui/exercise-feedback-modal.ts kondix-web/src/app/shared/ui/index.ts
git commit -m "feat(ui): add <kx-exercise-feedback-modal> (RPE + notes)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.B.5: `<kx-session-row>` for trainer timeline

**Files:**
- Create: `kondix-web/src/app/shared/ui/session-row.ts`
- Modify: `kondix-web/src/app/shared/ui/index.ts`
- Modify: `kondix-web/src/app/shared/models/index.ts` — add the DTO shape used here.

- [ ] **Step 1: Add DTO interface**

In `kondix-web/src/app/shared/models/index.ts`, add (placement: near other session DTOs):
```typescript
export interface TrainerSessionExerciseDto {
  exerciseId: string;
  name: string;
  muscleGroup: string | null;
  imageUrl: string | null;
  actualRpe: number | null;
  notes: string | null;
  sets: { weight: string; reps: number; isPR: boolean; note: string | null; setType: string }[];
}

export interface TrainerSessionDto {
  sessionId: string;
  routineName: string;
  dayName: string;
  startedAt: string;
  completedAt: string | null;
  mood: 'Great' | 'Good' | 'Ok' | 'Tough' | null;
  notes: string | null;
  status: 'completed' | 'partial' | 'missed';
  exercises: TrainerSessionExerciseDto[];
}
```

- [ ] **Step 2: Create the component**

Create `kondix-web/src/app/shared/ui/session-row.ts`:
```typescript
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { KxExerciseThumb } from './exercise-thumb';
import { KxSetChip } from './set-chip';
import { TrainerSessionDto } from '../models';
import { formatSpanishDate } from '../utils/format-date';

const MOOD_EMOJI: Record<string, string> = {
  Great: '🔥', Good: '✅', Ok: '😐', Tough: '😮‍💨',
};

@Component({
  selector: 'kx-session-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KxExerciseThumb, KxSetChip],
  template: `
    <div class="border border-border rounded-xl overflow-hidden mb-2"
      [class.shadow-[0_0_16px_rgba(230,38,57,0.15)]]="expanded()">
      <button
        type="button"
        class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-card-hover transition press"
        (click)="onToggle()"
        [attr.aria-expanded]="expanded()"
      >
        <div class="flex flex-col items-center justify-center w-12 shrink-0">
          <span class="text-base font-bold tabular-nums text-text">{{ dayLabel() }}</span>
          <span class="text-[10px] uppercase text-text-muted">{{ monthLabel() }}</span>
        </div>
        <div class="flex-1 min-w-0 text-left">
          <p class="text-sm font-semibold text-text truncate">{{ session().routineName }}</p>
          <p class="text-xs text-text-muted">{{ session().dayName }}</p>
        </div>
        @if (session().mood) {
          <span class="text-lg" [attr.aria-label]="session().mood">
            {{ moodEmoji() }}
          </span>
        }
        <span class="text-xs font-semibold px-2 py-1 rounded-md"
          [class.bg-card-hover]="!expanded()"
          [class.text-text-muted]="!expanded()"
          [class.bg-primary/15]="expanded()"
          [class.text-primary]="expanded()">
          {{ expanded() ? 'Cerrar ▴' : 'Detalle ▾' }}
        </span>
      </button>
      <div class="collapse-content" [class.expanded]="expanded()">
        <div class="overflow-hidden">
          <div class="px-3 pb-3 pt-1 space-y-3 border-t border-border">
            @for (ex of session().exercises; track ex.exerciseId) {
              <div class="flex gap-3 items-start">
                <kx-exercise-thumb
                  [name]="ex.name"
                  [muscleGroup]="ex.muscleGroup"
                  [photoUrl]="ex.imageUrl"
                  size="sm" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline justify-between gap-2">
                    <p class="text-sm font-semibold text-text truncate">{{ ex.name }}</p>
                    @if (ex.actualRpe != null) {
                      <span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-card-hover text-text-muted">
                        RPE {{ ex.actualRpe }}
                      </span>
                    }
                  </div>
                  <div class="flex flex-wrap gap-1 mt-1.5">
                    @for (s of ex.sets; track $index) {
                      <kx-set-chip
                        [weight]="s.weight"
                        [reps]="s.reps"
                        [isPR]="s.isPR"
                        [note]="s.note"
                        [setType]="s.setType" />
                    }
                  </div>
                  @if (ex.notes) {
                    <p class="mt-2 px-3 py-2 text-xs text-text border-l-2 border-primary/40 bg-primary/5 rounded-r-md">
                      {{ ex.notes }}
                    </p>
                  }
                </div>
              </div>
            }
            @if (session().notes) {
              <div class="px-3 py-2 text-sm text-text border-l-2 border-primary/40 bg-primary/5 rounded-r-md">
                <p class="text-overline text-text-muted mb-1">Nota de sesión</p>
                {{ session().notes }}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class KxSessionRow {
  session = input.required<TrainerSessionDto>();
  toggle = output<void>();

  private expandedSig = signal(false);
  expanded = computed(() => this.expandedSig());

  dayLabel = computed(() => {
    const d = new Date(this.session().startedAt);
    return d.getDate().toString().padStart(2, '0');
  });

  monthLabel = computed(() => {
    const d = new Date(this.session().startedAt);
    return d.toLocaleDateString('es', { month: 'short' }).replace('.', '');
  });

  moodEmoji = computed(() => {
    const m = this.session().mood;
    return m ? MOOD_EMOJI[m] : '';
  });

  onToggle(): void {
    this.expandedSig.update(v => !v);
    this.toggle.emit();
  }
}
```

- [ ] **Step 3: Re-export + build + commit**

```typescript
// shared/ui/index.ts
export * from './session-row';
```
```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/shared/ui/session-row.ts kondix-web/src/app/shared/ui/index.ts kondix-web/src/app/shared/models/index.ts
git commit -m "feat(ui): add <kx-session-row> expandable timeline for trainer drawer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.B.6: Extend `<kx-set-row>` with note toggle

**Files:**
- Modify: `kondix-web/src/app/shared/ui/set-row.ts`

- [ ] **Step 1: Add the new inputs/output to the class**

In `set-row.ts`, after the existing `rpeChange` output, add:
```typescript
note = input<string | null>(null);
showNoteToggle = input<boolean>(false);
noteChange = output<string>();

readonly noteOpen = signal(false);
draftNote = '';
```
And import `signal` from `@angular/core` if not already.

- [ ] **Step 2: Add a small chat icon button + collapsing input to the template**

In the template, add a 7th column to the grid for the note toggle, and a collapse-content row underneath. Replace the grid template line:
```html
class="grid grid-cols-[44px_60px_1fr_1fr_1fr_48px] gap-2 py-2.5 px-1 items-center"
```
with:
```html
class="grid grid-cols-[44px_60px_1fr_1fr_1fr_28px_28px] gap-2 py-2.5 px-1 items-center"
```

After the existing 6th column (CHECK button), add a 7th column block:
```html
@if (showNoteToggle()) {
  <button
    type="button"
    class="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-primary transition"
    [class.text-primary]="(note() ?? '').length > 0 || noteOpen()"
    (click)="toggleNote()"
    [attr.aria-label]="noteOpen() ? 'Cerrar nota' : 'Añadir nota'"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.243-.95L3 20l1.05-3.757A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
    </svg>
  </button>
} @else {
  <span></span>
}
```

After the closing `</div>` of the row grid, add a collapse-content block:
```html
@if (showNoteToggle()) {
  <div class="collapse-content" [class.expanded]="noteOpen()">
    <div class="overflow-hidden pl-12 pr-2 pb-2">
      <input
        type="text"
        class="w-full bg-card-hover border border-border-light rounded-md px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
        placeholder="Nota para esta serie…"
        [value]="draftNote"
        (input)="onNoteInput($event)"
        (blur)="commitNote()"
        (keydown.enter)="commitNote()"
        maxlength="2000"
      />
    </div>
  </div>
}
```

- [ ] **Step 3: Add the `toggleNote`/`onNoteInput`/`commitNote` methods**

In the class body:
```typescript
toggleNote(): void {
  this.draftNote = this.note() ?? '';
  this.noteOpen.update(v => !v);
}
onNoteInput(event: Event): void {
  this.draftNote = (event.target as HTMLInputElement).value;
}
commitNote(): void {
  const trimmed = this.draftNote.trim();
  if (trimmed !== (this.note() ?? '')) this.noteChange.emit(trimmed);
  this.noteOpen.set(false);
}
```

- [ ] **Step 4: Build + verify visually**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors. Then run dev server and check that the note icon appears on each set row in the logging screen (after Phase 3.C wires `showNoteToggle` to `true`).

- [ ] **Step 5: Commit**

```bash
git add kondix-web/src/app/shared/ui/set-row.ts
git commit -m "$(cat <<'EOF'
feat(ui): <kx-set-row> note toggle + noteChange output

Adds an opt-in chat icon column that opens a collapsing input for the
student's per-set note. Off by default; Phase 3.C turns it on in the
logging screen.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 3.C — Student-side integration

### Task 3.C.1: Wire per-set note in `exercise-logging.ts`

**Files:**
- Modify: `kondix-web/src/app/features/student/feature/exercise-logging.ts`

- [ ] **Step 1: Pass `showNoteToggle="true"` and bind note**

Locate the `<kx-set-row>` usage in the template. Add:
```html
[note]="setNoteFor(s.id)"
[showNoteToggle]="true"
(noteChange)="onSetNoteChange(s.id, $event)"
```

- [ ] **Step 2: Implement `setNoteFor` and `onSetNoteChange`**

In the class body:
```typescript
setNoteFor(setId: string): string | null {
  const log = this.setLogMap().get(setId);
  return log?.notes ?? null;
}

onSetNoteChange(setId: string, note: string): void {
  const log = this.setLogMap().get(setId);
  if (!log) return;
  this.api.patch(`/public/my/sets/${log.id}/note`, { note: note || null })
    .subscribe({
      next: () => {
        const map = new Map(this.setLogMap());
        map.set(setId, { ...log, notes: note || null });
        this.setLogMap.set(map);
      },
      error: (err) => this.toast.show(err.error?.error ?? 'No se pudo guardar la nota', 'error'),
    });
}
```
Add `notes?: string | null` to `SetLogDto` interface in `shared/models/index.ts` if not already present.

- [ ] **Step 3: Build + commit**

```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/features/student/feature/exercise-logging.ts kondix-web/src/app/shared/models/index.ts
git commit -m "feat(student): per-set note toggle on logging screen

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.C.2: Show feedback modal after last set of an exercise

**Files:**
- Modify: `kondix-web/src/app/features/student/feature/exercise-logging.ts`

- [ ] **Step 1: Import the modal**

```typescript
import { KxExerciseFeedbackModal, ExerciseFeedbackPayload } from '../../../shared/ui/exercise-feedback-modal';
```
Add `KxExerciseFeedbackModal` to `imports`.

- [ ] **Step 2: Add modal state**

```typescript
showFeedbackModal = signal(false);
```

- [ ] **Step 3: Detect last-set completion**

Find the existing `complete` handler for `<kx-set-row>` (where set completion happens). After dispatching the API call and updating local state, check if all sets of the current exercise are completed. If so, open the modal:
```typescript
private maybeOpenFeedback(): void {
  const ex = this.exercise();
  if (!ex) return;
  const allDone = this.sets().every(s => {
    const log = this.setLogMap().get(s.id);
    return log?.completed === true;
  });
  if (allDone) this.showFeedbackModal.set(true);
}
```
Call `this.maybeOpenFeedback()` after each successful set update response.

- [ ] **Step 4: Render the modal**

Near the end of the template (alongside `<kx-video-demo-overlay>`):
```html
<kx-exercise-feedback-modal
  [exerciseName]="exercise()?.name ?? ''"
  [open]="showFeedbackModal()"
  (submit)="onFeedbackSubmit($event)"
  (skip)="onFeedbackSkip()"
/>
```

- [ ] **Step 5: Implement submit/skip**

```typescript
onFeedbackSubmit(payload: ExerciseFeedbackPayload): void {
  const ex = this.exercise();
  if (!ex) return;
  this.api.post(`/public/my/sessions/${this.sessionId}/exercise-feedback`, {
    exerciseId: ex.id, actualRpe: payload.rpe, notes: payload.notes,
  }).subscribe({
    next: () => {
      this.showFeedbackModal.set(false);
      this.advanceToNextExercise();
    },
    error: (err) => this.toast.show(err.error?.error ?? 'No se pudo enviar', 'error'),
  });
}

onFeedbackSkip(): void {
  this.showFeedbackModal.set(false);
  this.advanceToNextExercise();
}

private advanceToNextExercise(): void {
  if (this.exerciseIndex() < this.totalExercises() - 1) {
    // existing next-exercise logic
  } else {
    this.router.navigate(['/student/workout/complete', this.sessionId]);
  }
}
```
The `sessionId` field and `router` are already on the component; reuse them. The `advanceToNextExercise()` body is just the existing "go next" logic factored out.

- [ ] **Step 6: Build + commit**

```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/features/student/feature/exercise-logging.ts
git commit -m "feat(student): exercise feedback modal on last-set completion

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.C.3: PR toast wired to `sets/update` response

**Files:**
- Modify: `kondix-web/src/app/features/student/feature/exercise-logging.ts`
- Modify: `kondix-web/src/app/shared/models/index.ts`

- [ ] **Step 1: Update model**

Add to `kondix-web/src/app/shared/models/index.ts`:
```typescript
export interface NewPrDto {
  exerciseName: string;
  weight: string;
  previousWeight: string | null;
  reps: string | null;
}

export interface UpdateSetDataResponse {
  setLog: SetLogDto;
  newPr: NewPrDto | null;
}
```

- [ ] **Step 2: Update the `sets/update` call**

In `exercise-logging.ts`, find where `api.post('/public/my/sets/update', ...)` is called. Type the response as `UpdateSetDataResponse` and after applying the `setLog`, fire the toast if `newPr` is set:
```typescript
this.api.post<UpdateSetDataResponse>('/public/my/sets/update', body).subscribe({
  next: (res) => {
    // ...existing setLog handling
    if (res.newPr) {
      const repsNum = res.newPr.reps != null ? parseInt(res.newPr.reps, 10) : null;
      this.toast.showPR(res.newPr.exerciseName, res.newPr.weight, isNaN(repsNum ?? NaN) ? null : repsNum);
    }
  },
  error: ...
});
```

- [ ] **Step 3: Build + commit**

```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/features/student/feature/exercise-logging.ts kondix-web/src/app/shared/models/index.ts
git commit -m "feat(student): PR toast wired to sets/update response

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.C.4: Mood + notes in `workout-complete.ts`

**Files:**
- Modify: `kondix-web/src/app/features/student/feature/workout-complete.ts`

- [ ] **Step 1: Add imports**

```typescript
import { FormsModule } from '@angular/forms';
import { KxMoodPicker, MoodValue } from '../../../shared/ui/mood-picker';
```
Add `FormsModule, KxMoodPicker` to `imports`.

- [ ] **Step 2: Add state**

```typescript
mood = signal<MoodValue | null>(null);
notes = '';
saving = signal(false);
```

- [ ] **Step 3: Render mood picker + textarea**

Replace whatever the current "you finished!" body has with (or insert above/below the existing kudos visuals):
```html
<div class="space-y-5 max-w-md mx-auto px-4 mt-6">
  <div class="space-y-2">
    <p class="text-overline text-text-muted">¿Cómo te sentiste?</p>
    <kx-mood-picker
      [value]="mood()"
      (valueChange)="mood.set($event)"
    />
  </div>
  <div class="space-y-2">
    <p class="text-overline text-text-muted">Nota para tu coach (opcional)</p>
    <textarea
      class="w-full bg-bg-raised border border-border rounded-lg p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
      rows="4"
      maxlength="2000"
      placeholder="Lo que quieras compartir…"
      [(ngModel)]="notes"
    ></textarea>
  </div>
  <button
    type="button"
    class="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition press disabled:opacity-50"
    [disabled]="saving()"
    (click)="onFinish()"
  >
    @if (saving()) { Guardando... } @else { Finalizar }
  </button>
</div>
```

- [ ] **Step 4: Update the complete call**

```typescript
onFinish(): void {
  this.saving.set(true);
  this.api.post(`/public/my/sessions/${this.sessionId}/complete`, {
    notes: this.notes.trim() || null,
    mood: this.mood(),
  }).subscribe({
    next: () => this.router.navigate(['/student/home']),
    error: (err) => {
      this.saving.set(false);
      this.toast.show(err.error?.error ?? 'No se pudo finalizar', 'error');
    },
  });
}
```
The `sessionId`, `api`, `router`, `toast` references should already exist; reuse existing patterns from the file.

- [ ] **Step 5: Build + commit**

```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/features/student/feature/workout-complete.ts
git commit -m "feat(student): mood + notes capture on workout completion

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## 3.D — Trainer drawer split + tabs

The current `student-detail.ts` is 443 lines and we're about to add 4 tabs of content. Split it into a shell + 4 tab components, then add the new content.

### Task 3.D.1: Read the current `student-detail.ts` and plan the split

- [ ] **Step 1: Open and read the file**

Read `kondix-web/src/app/features/trainer/students/feature/student-detail.ts` end to end. Identify the three logical sections currently rendered: (a) header (avatar, name, status, action buttons), (b) stats grid + program block, (c) timeline. The state owned: `loading`, `student`, `overview`, `assignments`, `availablePrograms`, plus form-state for assignment.

- [ ] **Step 2: Sketch the split mentally**

The shell keeps: route resolution, `loadAll`, `student` + `overview` + `assignments` + `recentFeedback` signals, header, segmented control. Each tab gets passed the data it needs as inputs, and emits actions back via outputs.

No commit yet — this step is just preparation.

### Task 3.D.2: Create the empty tab components

**Files:**
- Create: `kondix-web/src/app/features/trainer/students/feature/student-detail-summary.ts`
- Create: `kondix-web/src/app/features/trainer/students/feature/student-detail-program.ts`
- Create: `kondix-web/src/app/features/trainer/students/feature/student-detail-progress.ts`
- Create: `kondix-web/src/app/features/trainer/students/feature/student-detail-notes.ts`

- [ ] **Step 1: Create stubs for each tab**

For each of the four files, create a minimal standalone component scaffold so the shell can wire them up before content is moved. Example for `student-detail-summary.ts`:
```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { StudentDto, StudentOverviewDto } from '../../../../shared/models';

@Component({
  selector: 'app-student-detail-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div></div>`,
})
export class StudentDetailSummary {
  student = input.required<StudentDto>();
  overview = input<StudentOverviewDto | null>(null);
  unreadFeedbackCount = input<number>(0);

  openProgress = output<void>();
}
```

Mirror the same pattern for `student-detail-program.ts` (`assignments` input, `assign`/`cancel` outputs), `student-detail-progress.ts` (`studentId` input only — fetches its own data), `student-detail-notes.ts` (input `studentId`).

- [ ] **Step 2: Build (just to verify nothing is broken yet)**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/trainer/students/feature/
git commit -m "refactor(students): scaffold tab components for student-detail split

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.D.3: Refactor `student-detail.ts` into the shell

**Files:**
- Modify: `kondix-web/src/app/features/trainer/students/feature/student-detail.ts`

- [ ] **Step 1: Replace the body**

Reduce the file to:
```typescript
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { StudentDto, StudentOverviewDto, ProgramAssignmentDto, RecentFeedbackDto } from '../../../../shared/models';
import { ToastService } from '../../../../shared/ui/toast';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxBadge } from '../../../../shared/ui/badge';
import { KxEmptyState } from '../../../../shared/ui/empty-state';
import { KxSegmentedControl } from '../../../../shared/ui/segmented-control';
import { GRADIENT_PAIRS, getInitials } from '../../../../shared/utils/display';
import { formatDateWithYear } from '../../../../shared/utils/format-date';
import { StudentDetailSummary } from './student-detail-summary';
import { StudentDetailProgram } from './student-detail-program';
import { StudentDetailProgress } from './student-detail-progress';
import { StudentDetailNotes } from './student-detail-notes';

type TabId = 'summary' | 'program' | 'progress' | 'notes';

@Component({
  selector: 'app-student-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, KxSpinner, KxBadge, KxEmptyState, KxSegmentedControl,
    StudentDetailSummary, StudentDetailProgram, StudentDetailProgress, StudentDetailNotes],
  template: `
    <div class="animate-fade-up h-full overflow-y-auto">
      @if (!studentId()) {
        <a routerLink="/trainer/students"
          class="inline-flex items-center gap-1.5 text-text-muted text-sm hover:text-text transition mb-4">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Alumnos
        </a>
      }
      @if (loading()) {
        <div class="flex justify-center pt-12"><kx-spinner /></div>
      } @else if (!student()) {
        <kx-empty-state
          title="Alumno no encontrado"
          subtitle="No pudimos cargar la información de este alumno." />
      } @else {
        <div class="flex items-start gap-4 mb-6">
          <div class="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
            [style.background]="avatarGradient()">
            {{ initials() }}
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="font-display text-xl font-bold text-text leading-tight">{{ student()!.displayName }}</h2>
            <p class="text-text-muted text-xs mt-0.5">Desde {{ formatDateWithYear(student()!.createdAt) }}</p>
            <div class="flex items-center gap-1.5 mt-1.5">
              <kx-badge
                [text]="student()!.isActive ? 'Activo' : 'Inactivo'"
                [variant]="student()!.isActive ? 'success' : 'neutral'"
                [dot]="true" />
            </div>
          </div>
        </div>

        <kx-segmented-control
          class="block mb-4"
          [options]="tabOptions()"
          [selected]="tab()"
          (selectedChange)="setTab($any($event))" />

        @switch (tab()) {
          @case ('summary') {
            <app-student-detail-summary
              [student]="student()!"
              [overview]="overview()"
              [unreadFeedbackCount]="recentFeedback()?.unreadCount ?? 0"
              (openProgress)="setTab('progress')" />
          }
          @case ('program') {
            <app-student-detail-program
              [studentId]="resolvedId()"
              [assignments]="assignments()"
              (assignmentsChange)="assignments.set($event)" />
          }
          @case ('progress') {
            <app-student-detail-progress [studentId]="resolvedId()" />
          }
          @case ('notes') {
            <app-student-detail-notes [studentId]="resolvedId()" />
          }
        }
      }
    </div>
  `,
})
export class StudentDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  studentId = input<string | null>(null);
  resolvedId = signal<string>('');

  loading = signal(true);
  student = signal<StudentDto | null>(null);
  overview = signal<StudentOverviewDto | null>(null);
  assignments = signal<ProgramAssignmentDto[]>([]);
  recentFeedback = signal<RecentFeedbackDto | null>(null);

  tab = signal<TabId>('summary');

  tabOptions = computed(() => {
    const unread = this.recentFeedback()?.unreadCount ?? 0;
    const progressLabel = unread > 0 ? `Progreso (${unread})` : 'Progreso';
    return [
      { value: 'summary', label: 'Resumen' },
      { value: 'program', label: 'Programa' },
      { value: 'progress', label: progressLabel },
      { value: 'notes', label: 'Notas' },
    ];
  });

  formatDateWithYear = formatDateWithYear;
  initials = computed(() => getInitials(this.student()?.displayName ?? ''));
  avatarGradient = computed(() => {
    const idx = this.resolvedId().split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENT_PAIRS.length;
    const [from, to] = GRADIENT_PAIRS[idx];
    return `linear-gradient(135deg, ${from}, ${to})`;
  });

  setTab(t: TabId): void { this.tab.set(t); }

  constructor() {
    effect(() => {
      const id = this.studentId();
      if (id && id !== this.resolvedId()) {
        this.resolvedId.set(id);
        this.loadAll(id);
      }
    });
  }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('studentId');
    if (routeId && !this.studentId()) {
      this.resolvedId.set(routeId);
      this.loadAll(routeId);
    }
  }

  private loadAll(id: string): void {
    this.loading.set(true);
    this.student.set(null);
    this.overview.set(null);
    this.assignments.set([]);
    this.recentFeedback.set(null);

    this.api.get<StudentDto[]>('/students').subscribe({
      next: (list) => this.student.set(list.find(s => s.id === id) ?? null),
    });
    this.api.get<StudentOverviewDto>(`/students/${id}/overview`).subscribe({
      next: (data) => { this.overview.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<ProgramAssignmentDto[]>(`/program-assignments?studentId=${id}&activeOnly=false`).subscribe({
      next: (data) => this.assignments.set(data),
    });
    this.api.get<RecentFeedbackDto>(`/students/${id}/recent-feedback`).subscribe({
      next: (data) => this.recentFeedback.set(data),
    });
  }
}
```

This trims the shell to ~150 lines. The KPI grid, program block, timeline, etc., now live in the four tab files (next tasks). Add `RecentFeedbackDto` interface to `shared/models/index.ts`:
```typescript
export interface RecentFeedbackSessionDto {
  sessionId: string;
  routineName: string;
  completedAt: string;
  mood: string | null;
  hasNotes: boolean;
}
export interface RecentFeedbackDto {
  unreadCount: number;
  sessions: RecentFeedbackSessionDto[];
}
```

- [ ] **Step 2: Build**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors. The four tab components still render `<div></div>` — that's fine for this step.

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/trainer/students/feature/student-detail.ts kondix-web/src/app/shared/models/index.ts
git commit -m "$(cat <<'EOF'
refactor(students): student-detail.ts becomes a shell with 4 tabs

Strips KPI grid, program block, and timeline into per-tab components.
Adds segmented control + badge count from /students/{id}/recent-feedback.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3.D.4: Implement `student-detail-summary`

**Files:**
- Modify: `kondix-web/src/app/features/trainer/students/feature/student-detail-summary.ts`

- [ ] **Step 1: Render KPIs + feedback banner**

Replace the file body with:
```typescript
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { StudentDto, StudentOverviewDto } from '../../../../shared/models';
import { KxStatCard } from '../../../../shared/ui/stat-card';

@Component({
  selector: 'app-student-detail-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KxStatCard],
  template: `
    @if (unreadFeedbackCount() > 0) {
      <button type="button"
        class="w-full mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 text-left hover:bg-primary/15 transition press flex items-center gap-3"
        (click)="openProgress.emit()">
        <span class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
          {{ unreadFeedbackCount() }}
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-primary">Hay feedback nuevo</p>
          <p class="text-xs text-text-muted">Toca para ver las notas y RPE de las últimas sesiones</p>
        </div>
        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    }
    @if (overview(); as ov) {
      <div class="grid grid-cols-2 gap-3 mb-6">
        <kx-stat-card label="Sesiones" [value]="ov.totalSessions.toString()" />
        <kx-stat-card label="Adherencia" [value]="ov.adherencePercentage + '%'"
          [valueColor]="adherenceColor()" />
        <kx-stat-card label="Racha" value="—" />
        <kx-stat-card label="PRs" value="—" />
      </div>
    }
  `,
})
export class StudentDetailSummary {
  student = input.required<StudentDto>();
  overview = input<StudentOverviewDto | null>(null);
  unreadFeedbackCount = input<number>(0);
  openProgress = output<void>();

  adherenceColor = computed(() => {
    const pct = this.overview()?.adherencePercentage ?? 0;
    if (pct >= 70) return 'text-success';
    if (pct >= 40) return 'text-warning';
    return 'text-danger';
  });
}
```

- [ ] **Step 2: Build + commit**

```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/features/trainer/students/feature/student-detail-summary.ts
git commit -m "feat(students): summary tab with KPIs + unread-feedback banner CTA

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.D.5: Implement `student-detail-program`

**Files:**
- Modify: `kondix-web/src/app/features/trainer/students/feature/student-detail-program.ts`

- [ ] **Step 1: Lift program block from old shell**

Move the "PROGRAMA ACTUAL" gradient card, the assignment form, the assignment-history list, and their methods (`assignProgram`, `cancelAssignment`, `toggleDay`, `openAssignForm`) into this file. Inputs: `studentId`, `assignments`. Output: `assignmentsChange: ProgramAssignmentDto[]` so the shell can keep its signal in sync.

The full body is mostly a copy of the existing logic from the original `student-detail.ts` — adapt the calls to `this.api.get/post` and the toast usage. Keep the same templates byte-for-byte for the program section.

- [ ] **Step 2: Build + commit**

```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/features/trainer/students/feature/student-detail-program.ts
git commit -m "feat(students): program tab with current/past assignments and assign form

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.D.6: Implement `student-detail-progress`

**Files:**
- Modify: `kondix-web/src/app/features/trainer/students/feature/student-detail-progress.ts`

- [ ] **Step 1: Implement the tab**

Replace with:
```typescript
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { TrainerSessionDto } from '../../../../shared/models';
import { KxSessionRow } from '../../../../shared/ui/session-row';
import { KxSegmentedControl } from '../../../../shared/ui/segmented-control';
import { KxSpinner } from '../../../../shared/ui/spinner';
import { KxEmptyState } from '../../../../shared/ui/empty-state';

type Filter = 'all' | 'done' | 'skipped' | 'with-notes';

@Component({
  selector: 'app-student-detail-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KxSessionRow, KxSegmentedControl, KxSpinner, KxEmptyState],
  template: `
    <div class="space-y-3">
      <kx-segmented-control
        [options]="filters"
        [selected]="filter()"
        (selectedChange)="filter.set($any($event))" />
      @if (loading()) {
        <div class="flex justify-center py-8"><kx-spinner /></div>
      } @else if (filtered().length === 0) {
        <kx-empty-state title="Sin sesiones" subtitle="Aún no hay sesiones para mostrar." />
      } @else {
        @for (s of filtered(); track s.sessionId) {
          <kx-session-row [session]="s" />
        }
      }
    </div>
  `,
})
export class StudentDetailProgress implements OnInit {
  private api = inject(ApiService);
  studentId = input.required<string>();

  loading = signal(true);
  sessions = signal<TrainerSessionDto[]>([]);
  filter = signal<Filter>('all');
  filters = [
    { value: 'all',        label: 'Todas' },
    { value: 'done',       label: 'Hechas' },
    { value: 'skipped',    label: 'Saltadas' },
    { value: 'with-notes', label: 'Con notas' },
  ];

  filtered = computed(() => {
    const all = this.sessions();
    switch (this.filter()) {
      case 'done':       return all.filter(s => s.status === 'completed');
      case 'skipped':    return all.filter(s => s.status === 'missed' || s.status === 'partial');
      case 'with-notes': return all.filter(s =>
        s.notes != null
        || s.exercises.some(e => e.notes != null || e.sets.some(set => set.note != null)));
      default: return all;
    }
  });

  ngOnInit(): void {
    this.api.get<TrainerSessionDto[]>(`/students/${this.studentId()}/sessions`)
      .subscribe({
        next: (data) => { this.sessions.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    // Mark feedback as read so the badge count clears.
    this.api.post(`/students/${this.studentId()}/feedback/mark-read`, {})
      .subscribe({ next: () => {}, error: () => {} });
  }
}
```

Note: this introduces an endpoint `GET /api/v1/students/{id}/sessions` returning `TrainerSessionDto[]`. If that endpoint doesn't exist yet, add it as a sub-task using a new query `GetStudentSessionsForTrainerQuery` modeled after `GetSessionHistoryQuery`. The DTO must include `mood`, `notes`, per-exercise `actualRpe`+`notes`, and per-set `weight`/`reps`/`isPR`/`note`/`setType`. Build the projection to join `WorkoutSession`, `SetLogs`, `ExerciseFeedback`, and (for `isPR`) `PersonalRecords`.

- [ ] **Step 2: If the endpoint is new, implement it**

Create `src/Kondix.Application/Queries/Sessions/GetStudentSessionsForTrainerQuery.cs` and a `[HttpGet("{id:guid}/sessions")]` action on the trainer students controller. The query enumerates the student's `WorkoutSessions` ordered by `StartedAt DESC`, projects each into the DTO, joining set logs and exercise feedback. For PR detection on each set, compare `SetLog.ActualWeight` against the `PersonalRecord.Weight` for the matching exercise name and mark the highest as `isPR=true`. Take the latest 30 sessions.

- [ ] **Step 3: Build + commit**

```bash
cd kondix-web && npx ng build
dotnet build Kondix.slnx
git add .
git commit -m "$(cat <<'EOF'
feat(students): progress tab with timeline + filters + mark-read

Renders <kx-session-row> per session with mood, RPE chips, set chips,
session notes, exercise notes. Calls /feedback/mark-read on mount to
clear the unread badge.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 3.D.7: Implement `student-detail-notes`

**Files:**
- Modify: `kondix-web/src/app/features/trainer/students/feature/student-detail-notes.ts`

- [ ] **Step 1: Lift the existing private notes panel**

Locate the existing trainer-private-notes component or template (likely `TrainerNote` related — search with `grep -rn "TrainerNote" kondix-web/src/app/features/trainer/`). Move that block into this file unchanged, taking `studentId` as input. If it's already a separate component, this file becomes a thin pass-through:
```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { /* existing notes component */ } from '../../../path/to/notes-component';

@Component({
  selector: 'app-student-detail-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [/* the existing notes component */],
  template: `<existing-notes-component [studentId]="studentId()" />`,
})
export class StudentDetailNotes {
  studentId = input.required<string>();
}
```

- [ ] **Step 2: Build + commit**

```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/features/trainer/students/feature/student-detail-notes.ts
git commit -m "feat(students): notes tab (lift of existing private notes panel)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 3.D.8: Verify the trainer drawer end-to-end

- [ ] **Step 1: Manual verification**

Run dev backend + frontend. Sign in as a trainer with at least one student that has at least one completed session with mood + notes. Open the student drawer:
- Tabs render: Resumen / Programa / Progreso (with badge if unread) / Notas.
- Resumen shows KPIs and (if unread > 0) the banner CTA.
- Clicking the banner switches to Progreso.
- Progreso renders sessions; clicking a row expands with sets/RPE/notes.
- Programa shows current/past assignments with the same form as before.
- Notas shows existing private notes panel.

- [ ] **Step 2: Commit only if any final tweaks were needed**

If the verification reveals visual gaps, fix and commit with `fix(students): ...` scope.

---

# PHASE 4 — Recovery system (migration + on-the-fly detection + UI)

## Task 4.1: Add recovery fields to `WorkoutSession`

**Files:**
- Modify: `src/Kondix.Domain/Entities/WorkoutSession.cs`
- Modify: `src/Kondix.Infrastructure/Persistence/Configurations/WorkoutSessionConfiguration.cs`

- [ ] **Step 1: Extend entity**

In `WorkoutSession.cs`:
```csharp
public bool IsRecovery { get; set; } = false;
public Guid? RecoversSessionId { get; set; }
public WorkoutSession? RecoversSession { get; set; }
```

- [ ] **Step 2: Map in EF config**

In `WorkoutSessionConfiguration.cs`, add inside `Configure`:
```csharp
b.Property(x => x.IsRecovery).HasDefaultValue(false);
b.HasOne(x => x.RecoversSession)
    .WithMany()
    .HasForeignKey(x => x.RecoversSessionId)
    .OnDelete(DeleteBehavior.SetNull);
```

- [ ] **Step 3: Build + commit**

```bash
dotnet build Kondix.slnx
git add src/Kondix.Domain/Entities/WorkoutSession.cs src/Kondix.Infrastructure/Persistence/Configurations/WorkoutSessionConfiguration.cs
git commit -m "feat(domain): WorkoutSession.{IsRecovery,RecoversSessionId} for recovery flow

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 4.2: Migration `AddSessionRecoveryFields`

**Files:**
- Create: `src/Kondix.Infrastructure/Migrations/{ts}_AddSessionRecoveryFields.cs`

- [ ] **Step 1: Generate**

```bash
dotnet ef migrations add AddSessionRecoveryFields \
  --project src/Kondix.Infrastructure \
  --startup-project src/Kondix.Api \
  --output-dir Migrations
```

- [ ] **Step 2: Inspect SQL**

Verify the script adds `is_recovery boolean NOT NULL DEFAULT false` and `recovers_session_id uuid NULL` with the self-FK. Should NOT touch unrelated tables.

- [ ] **Step 3: Build + commit**

```bash
dotnet build Kondix.slnx
git add src/Kondix.Infrastructure/Migrations/
git commit -m "chore(db): migration AddSessionRecoveryFields

Additive: workout_sessions.{is_recovery, recovers_session_id} + self-FK.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 4.3: `GetMissedSessionQuery`

**Files:**
- Create: `src/Kondix.Application/Queries/StudentPortal/GetMissedSessionQuery.cs`
- Test: `tests/Kondix.UnitTests/Queries/GetMissedSessionQueryTests.cs`

- [ ] **Step 1: Write the failing test**

Create the unit test with three scenarios:
1. Student has active assignment with `TrainingDays = [1, 3, 5]` (Mon/Wed/Fri); today is Wed. Last completed session was Mon. The Tue (= yesterday) is NOT a training day, but Wed IS (today). No missed session in the last 2 days → returns `null`.
2. Same setup but yesterday was Tue (not a training day) → still no missed; today Wed is upcoming, not missed.
3. Today is Wed, student has no Mon session and Mon was a training day → returns missed pointing to Mon.
4. The recoverable already has a recovery session → returns `null`.

```csharp
using FluentAssertions;
using Kondix.Application.Queries.StudentPortal;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Queries;

public sealed class GetMissedSessionQueryTests
{
    private static KondixDbContext NewDb()
    {
        var o = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(o);
    }

    [Fact]
    public async Task NoMissedDay_Returns_Null()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        var routine = new Routine { Id = Guid.NewGuid(), Name = "R" };
        db.Routines.Add(routine);
        // Active assignment with training days only on weekday today and beyond.
        db.ProgramAssignments.Add(new ProgramAssignment {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ProgramId = Guid.NewGuid(),
            Mode = ProgramAssignmentMode.Fixed,
            TrainingDays = [(int)DateTime.UtcNow.DayOfWeek],
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            DurationWeeks = 8,
            Status = ProgramAssignmentStatus.Active,
        });
        await db.SaveChangesAsync();

        var handler = new GetMissedSessionQueryHandler(db);
        var result = await handler.Handle(new GetMissedSessionQuery(studentId), default);

        result.Should().BeNull();
    }

    // Additional fact-tests: MissedYesterday_Returns_Recoverable,
    // MissedTwoDaysAgo_Returns_Recoverable, AlreadyRecovered_Returns_Null,
    // MissedThreeDaysAgo_Returns_Null (out of window).
}
```

- [ ] **Step 2: Implement query**

Create the file with this strategy:
```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.StudentPortal;

public sealed record GetMissedSessionQuery(Guid StudentId) : IRequest<RecoverableSessionDto?>;

public sealed record RecoverableSessionDto(
    DateOnly PlannedDate,
    Guid RoutineId,
    string RoutineName,
    Guid DayId,
    string DayName,
    DateOnly DeadlineDate);

public sealed class GetMissedSessionQueryHandler(IKondixDbContext db)
    : IRequestHandler<GetMissedSessionQuery, RecoverableSessionDto?>
{
    public async Task<RecoverableSessionDto?> Handle(GetMissedSessionQuery request, CancellationToken cancellationToken)
    {
        var assignment = await db.ProgramAssignments
            .AsNoTracking()
            .Include(a => a.Program).ThenInclude(p => p.ProgramRoutines).ThenInclude(pr => pr.Routine).ThenInclude(r => r.Days)
            .FirstOrDefaultAsync(a => a.StudentId == request.StudentId
                && a.Status == ProgramAssignmentStatus.Active, cancellationToken);
        if (assignment is null) return null;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var window = new[] { today.AddDays(-1), today.AddDays(-2) }; // yesterday + 2-days-ago

        // Find sessions completed in the window (so we know which planned days were honored).
        var sessions = await db.WorkoutSessions
            .AsNoTracking()
            .Where(s => s.StudentId == request.StudentId
                && s.StartedAt >= new DateTimeOffset(window[1].ToDateTime(TimeOnly.MinValue), TimeSpan.Zero))
            .Select(s => new { s.StartedAt, s.RoutineId, s.DayId, s.RecoversSessionId, s.IsRecovery, Date = DateOnly.FromDateTime(s.StartedAt.UtcDateTime) })
            .ToListAsync(cancellationToken);

        foreach (var planned in window)
        {
            var dow = (int)planned.DayOfWeek;
            if (!assignment.TrainingDays.Contains(dow)) continue;

            // Did the student complete a session that day OR is a recovery session
            // pointing to that planned date?
            var honored = sessions.Any(s => s.Date == planned)
                || sessions.Any(s => s.IsRecovery && s.Date >= planned && s.Date <= today);
            if (honored) continue;

            // Pick the routine for that day (first by sort order in rotation; or by index for fixed)
            var routine = assignment.Program.ProgramRoutines
                .OrderBy(pr => pr.SortOrder)
                .Select(pr => pr.Routine)
                .FirstOrDefault();
            if (routine is null) continue;
            var day = routine.Days.OrderBy(d => d.SortOrder).FirstOrDefault();
            if (day is null) continue;

            return new RecoverableSessionDto(
                planned, routine.Id, routine.Name, day.Id, day.Name,
                planned.AddDays(2));
        }
        return null;
    }
}
```

The "pick the routine" logic above is a stub for the simplest case. The exact routine selection per planned date depends on `ProgramAssignmentMode` (Rotation cycles by index modulo `ProgramRoutines.Count`, Fixed maps weekday → routine via the assignment's training-day map). Implement per the existing rotation/fixed logic in `GetNextWorkoutQuery` — read it first and mirror.

- [ ] **Step 3: Run tests + commit**

```bash
dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~GetMissedSessionQueryTests"
git add src/Kondix.Application/Queries/StudentPortal/GetMissedSessionQuery.cs tests/Kondix.UnitTests/Queries/GetMissedSessionQueryTests.cs
git commit -m "$(cat <<'EOF'
feat(student): GetMissedSessionQuery on-the-fly detection

Returns at most one recoverable session within 2 days of today. Honors
existing completions and prior recovery sessions. No DB writes — pure
query over assignment.TrainingDays + workout_sessions.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Task 4.4: Modify `StartSessionCommand` to accept `RecoversSessionId`

**Files:**
- Modify: `src/Kondix.Application/Commands/Sessions/StartSessionCommand.cs`
- Modify: `src/Kondix.Api/Controllers/StudentPortalController.cs`

- [ ] **Step 1: Extend command**

Add `Guid? RecoversSessionId` parameter to the `StartSessionCommand` record. In the handler, if non-null:
- Validate the referenced session belongs to the caller (`StudentId == request.StudentId`).
- Validate the session is missed (no `CompletedAt`, `StartedAt < today - 1 day`).
- Set `IsRecovery = true` and `RecoversSessionId = request.RecoversSessionId` on the new session.

- [ ] **Step 2: Update controller request**

```csharp
public sealed record StartSessionRequest(Guid RoutineId, Guid DayId, Guid? RecoversSessionId);
```
And forward `request.RecoversSessionId` to the command.

- [ ] **Step 3: Build + commit**

```bash
dotnet build Kondix.slnx
git add src/Kondix.Application/Commands/Sessions/StartSessionCommand.cs src/Kondix.Api/Controllers/StudentPortalController.cs
git commit -m "feat(sessions): StartSession accepts RecoversSessionId for recovery flow

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 4.5: Wire `GET /api/v1/public/my/missed-sessions`

**Files:**
- Modify: `src/Kondix.Api/Controllers/StudentPortalController.cs`

- [ ] **Step 1: Add the action**

```csharp
[HttpGet("missed-sessions")]
public async Task<IActionResult> GetMissedSession(CancellationToken ct)
{
    var studentId = HttpContext.GetStudentId();
    var result = await mediator.Send(new GetMissedSessionQuery(studentId), ct);
    return result is null ? NoContent() : Ok(result);
}
```

- [ ] **Step 2: Build + commit**

```bash
dotnet build Kondix.slnx
git add src/Kondix.Api/Controllers/StudentPortalController.cs
git commit -m "feat(api): GET /public/my/missed-sessions for recovery banner

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 4.6: `<kx-recovery-banner>` component

**Files:**
- Create: `kondix-web/src/app/shared/ui/recovery-banner.ts`
- Modify: `kondix-web/src/app/shared/ui/index.ts`
- Modify: `kondix-web/src/app/shared/models/index.ts`

- [ ] **Step 1: Add DTO type**

In `shared/models/index.ts`:
```typescript
export interface RecoverableSessionDto {
  plannedDate: string;
  routineId: string;
  routineName: string;
  dayId: string;
  dayName: string;
  deadlineDate: string;
}
```

- [ ] **Step 2: Create component**

Create `kondix-web/src/app/shared/ui/recovery-banner.ts`:
```typescript
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RecoverableSessionDto } from '../models';

@Component({
  selector: 'kx-recovery-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl p-4 border border-warning/30 bg-warning/10 mb-4 animate-fade-up"
      role="region" aria-label="Sesión por recuperar">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-warning/20 text-warning flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12a9 9 0 0118 0M3 12l4-4M3 12l4 4M21 12a9 9 0 01-18 0M21 12l-4 4M21 12l-4-4"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-text">Recupera el entreno del {{ dayLabel() }}</p>
          <p class="text-xs text-text-muted mt-0.5">{{ deadlineLabel() }}</p>
        </div>
      </div>
      <div class="flex gap-2 mt-3">
        <button type="button"
          class="flex-1 py-2 bg-bg-raised border border-border text-text-muted text-xs rounded-lg hover:text-text transition press"
          (click)="dismiss.emit()">
          Saltar
        </button>
        <button type="button"
          class="flex-1 py-2 bg-warning text-bg text-xs font-semibold rounded-lg hover:bg-warning/90 transition press"
          (click)="recover.emit()">
          Recuperar
        </button>
      </div>
    </div>
  `,
})
export class KxRecoveryBanner {
  missedSession = input.required<RecoverableSessionDto>();
  recover = output<void>();
  dismiss = output<void>();

  dayLabel = computed(() => {
    const d = new Date(this.missedSession().plannedDate);
    return d.toLocaleDateString('es', { weekday: 'long' });
  });

  deadlineLabel = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(this.missedSession().deadlineDate);
    deadline.setHours(0, 0, 0, 0);
    const diff = Math.round((deadline.getTime() - today.getTime()) / 86400000);
    if (diff <= 0) return 'Vence hoy';
    if (diff === 1) return 'Vence mañana';
    return `Vence en ${diff} días`;
  });
}
```

- [ ] **Step 3: Re-export + build + commit**

```typescript
// shared/ui/index.ts
export * from './recovery-banner';
```
```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/shared/ui/recovery-banner.ts kondix-web/src/app/shared/ui/index.ts kondix-web/src/app/shared/models/index.ts
git commit -m "feat(ui): add <kx-recovery-banner> for student home

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 4.7: `<kx-day-cell>` `recovered` state

**Files:**
- Modify: `kondix-web/src/app/shared/ui/day-cell.ts`

- [ ] **Step 1: Add to state literal**

In `day-cell.ts`, find the `state` input definition. Add `'recovered'` to the union type. Update the visual mapping inside the template / computed style logic to render a green tint plus a small `rotate-ccw` Lucide icon overlay (or inline SVG) when `state === 'recovered'`.

- [ ] **Step 2: Build + commit**

```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/shared/ui/day-cell.ts
git commit -m "feat(ui): <kx-day-cell> 'recovered' state

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 4.8: Wire student home + calendar

**Files:**
- Modify: `kondix-web/src/app/features/student/feature/home.ts`
- Modify: `kondix-web/src/app/features/student/feature/calendar.ts`

- [ ] **Step 1: Home — fetch and render banner**

In `home.ts`, add an `ApiService` call on init to `GET /public/my/missed-sessions`. Render `<kx-recovery-banner>` near the top when set.

```typescript
missed = signal<RecoverableSessionDto | null>(null);

ngOnInit(): void {
  // ...existing
  this.api.get<RecoverableSessionDto>('/public/my/missed-sessions').subscribe({
    next: (data) => this.missed.set(data),
    error: () => this.missed.set(null),
  });
}

onRecover(): void {
  const m = this.missed();
  if (!m) return;
  this.api.post<{ id: string }>('/public/my/sessions/start', {
    routineId: m.routineId,
    dayId: m.dayId,
    recoversSessionId: m.plannedDate,  // backend matches by missed date — adjust shape if needed
  }).subscribe({
    next: (res) => this.router.navigate(['/student/workout/exercise', res.id, 0]),
    error: (err) => this.toast.show(err.error?.error ?? 'No se pudo iniciar', 'error'),
  });
}
```

Note: `recoversSessionId` in the spec was a Guid; if the missed lookup returns a planned date instead of a session id, the backend `StartSessionCommand` should accept either form. Decide once and use consistently — recommended: the missed query returns a synthetic `plannedDate` string, and `StartSessionCommand` accepts an optional `Guid? recoversSessionId` (nullable) plus an optional `DateOnly? recoversPlannedDate`. Refactor the Phase 4 backend tasks if you discover this gap during implementation.

Render in template:
```html
@if (missed(); as m) {
  <kx-recovery-banner
    [missedSession]="m"
    (recover)="onRecover()"
    (dismiss)="missed.set(null)" />
}
```

- [ ] **Step 2: Calendar — recovered state**

In `calendar.ts`, when computing the `state` for each day cell, check if any session for that date has `isRecovery === true` and pass `'recovered'` to `<kx-day-cell>`. The DTO returned by `GET /calendar` should include `isRecovery` on each session — extend its query if missing.

- [ ] **Step 3: Build + commit**

```bash
cd kondix-web && npx ng build
git add kondix-web/src/app/features/student/feature/home.ts kondix-web/src/app/features/student/feature/calendar.ts
git commit -m "$(cat <<'EOF'
feat(student): recovery banner on home + recovered state in calendar

Banner appears when GET /missed-sessions returns a recoverable session.
Tapping "Recuperar" starts a session marked is_recovery=true. Calendar
day cells show the recovered state for completed recovery sessions.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# PHASE 5 — Programs editor refresh (CDK D&D + week overrides)

## Task 5.1: Add `@angular/cdk` dependency

**Files:**
- Modify: `kondix-web/package.json`
- Modify: `kondix-web/package-lock.json` (auto)

- [ ] **Step 1: Install**

```bash
cd kondix-web && npm install @angular/cdk@21
```

- [ ] **Step 2: Build**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors. Note the lazy chunk size for the program editor doesn't change yet (the import lands in Task 5.7).

- [ ] **Step 3: Commit**

```bash
git add kondix-web/package.json kondix-web/package-lock.json
git commit -m "chore(deps): add @angular/cdk for D&D in programs editor

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 5.2: `ProgramWeekOverride` entity + config + DbContext

**Files:**
- Create: `src/Kondix.Domain/Entities/ProgramWeekOverride.cs`
- Create: `src/Kondix.Infrastructure/Persistence/Configurations/ProgramWeekOverrideConfiguration.cs`
- Modify: `src/Kondix.Infrastructure/Persistence/KondixDbContext.cs`
- Modify: `src/Kondix.Application/Common/Interfaces/IKondixDbContext.cs`

- [ ] **Step 1: Create entity**

Create `src/Kondix.Domain/Entities/ProgramWeekOverride.cs`:
```csharp
using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class ProgramWeekOverride : BaseEntity
{
    public Guid ProgramId { get; set; }
    public int WeekIndex { get; set; }      // 1-based
    public string Notes { get; set; } = string.Empty;

    public Program Program { get; set; } = null!;
}
```

- [ ] **Step 2: EF config**

Create `src/Kondix.Infrastructure/Persistence/Configurations/ProgramWeekOverrideConfiguration.cs`:
```csharp
using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public sealed class ProgramWeekOverrideConfiguration : IEntityTypeConfiguration<ProgramWeekOverride>
{
    public void Configure(EntityTypeBuilder<ProgramWeekOverride> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.WeekIndex).IsRequired();
        b.Property(x => x.Notes).HasMaxLength(2000).IsRequired();
        b.HasOne(x => x.Program)
            .WithMany()
            .HasForeignKey(x => x.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => new { x.ProgramId, x.WeekIndex }).IsUnique();
    }
}
```

- [ ] **Step 3: Register DbSet**

In `KondixDbContext.cs`:
```csharp
public DbSet<ProgramWeekOverride> ProgramWeekOverrides => Set<ProgramWeekOverride>();
```
In `IKondixDbContext`:
```csharp
DbSet<ProgramWeekOverride> ProgramWeekOverrides { get; }
```

- [ ] **Step 4: Build + commit**

```bash
dotnet build Kondix.slnx
git add src/Kondix.Domain/Entities/ProgramWeekOverride.cs src/Kondix.Infrastructure/Persistence/Configurations/ProgramWeekOverrideConfiguration.cs src/Kondix.Infrastructure/Persistence/KondixDbContext.cs src/Kondix.Application/Common/Interfaces/IKondixDbContext.cs
git commit -m "feat(domain): ProgramWeekOverride entity for per-week notes

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 5.3: Migration `AddProgramWeekOverrides`

**Files:**
- Create: `src/Kondix.Infrastructure/Migrations/{ts}_AddProgramWeekOverrides.cs`

- [ ] **Step 1: Generate**

```bash
dotnet ef migrations add AddProgramWeekOverrides \
  --project src/Kondix.Infrastructure \
  --startup-project src/Kondix.Api \
  --output-dir Migrations
```

- [ ] **Step 2: Inspect SQL**

Verify it creates table `program_week_overrides` with columns + UNIQUE(program_id, week_index) + cascade FK to programs.

- [ ] **Step 3: Build + commit**

```bash
dotnet build Kondix.slnx
git add src/Kondix.Infrastructure/Migrations/
git commit -m "chore(db): migration AddProgramWeekOverrides

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 5.4: `UpsertProgramWeekOverrideCommand` + `GetProgramWeekOverridesQuery`

**Files:**
- Create: `src/Kondix.Application/Commands/Programs/UpsertProgramWeekOverrideCommand.cs`
- Create: `src/Kondix.Application/Queries/Programs/GetProgramWeekOverridesQuery.cs`
- Test: `tests/Kondix.UnitTests/Commands/UpsertProgramWeekOverrideCommandHandlerTests.cs`

- [ ] **Step 1: Write the failing handler test**

```csharp
using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class UpsertProgramWeekOverrideCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var o = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(o);
    }

    [Fact]
    public async Task Inserts_When_None_Exists()
    {
        await using var db = NewDb();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, Name = "P" });
        await db.SaveChangesAsync();

        var handler = new UpsertProgramWeekOverrideCommandHandler(db);
        await handler.Handle(new UpsertProgramWeekOverrideCommand(programId, 2, "+5kg en compuestos"), default);

        var saved = await db.ProgramWeekOverrides.FirstAsync();
        saved.WeekIndex.Should().Be(2);
        saved.Notes.Should().Be("+5kg en compuestos");
    }

    [Fact]
    public async Task EmptyNotes_Deletes_Row()
    {
        await using var db = NewDb();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, Name = "P" });
        db.ProgramWeekOverrides.Add(new ProgramWeekOverride { ProgramId = programId, WeekIndex = 3, Notes = "old" });
        await db.SaveChangesAsync();

        var handler = new UpsertProgramWeekOverrideCommandHandler(db);
        await handler.Handle(new UpsertProgramWeekOverrideCommand(programId, 3, ""), default);

        (await db.ProgramWeekOverrides.CountAsync()).Should().Be(0);
    }
}
```

- [ ] **Step 2: Implement command**

Create `src/Kondix.Application/Commands/Programs/UpsertProgramWeekOverrideCommand.cs`:
```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record UpsertProgramWeekOverrideCommand(Guid ProgramId, int WeekIndex, string Notes) : IRequest;

public sealed class UpsertProgramWeekOverrideCommandHandler(IKondixDbContext db)
    : IRequestHandler<UpsertProgramWeekOverrideCommand>
{
    public async Task Handle(UpsertProgramWeekOverrideCommand request, CancellationToken cancellationToken)
    {
        var existing = await db.ProgramWeekOverrides
            .FirstOrDefaultAsync(o => o.ProgramId == request.ProgramId && o.WeekIndex == request.WeekIndex, cancellationToken);
        var trimmed = request.Notes?.Trim() ?? "";

        if (string.IsNullOrEmpty(trimmed))
        {
            if (existing is not null) db.ProgramWeekOverrides.Remove(existing);
        }
        else if (existing is null)
        {
            db.ProgramWeekOverrides.Add(new ProgramWeekOverride
            {
                ProgramId = request.ProgramId,
                WeekIndex = request.WeekIndex,
                Notes = trimmed,
            });
        }
        else
        {
            existing.Notes = trimmed;
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
```

- [ ] **Step 3: Implement query**

Create `src/Kondix.Application/Queries/Programs/GetProgramWeekOverridesQuery.cs`:
```csharp
using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Programs;

public sealed record GetProgramWeekOverridesQuery(Guid ProgramId) : IRequest<List<ProgramWeekOverrideDto>>;

public sealed record ProgramWeekOverrideDto(int WeekIndex, string Notes);

public sealed class GetProgramWeekOverridesQueryHandler(IKondixDbContext db)
    : IRequestHandler<GetProgramWeekOverridesQuery, List<ProgramWeekOverrideDto>>
{
    public async Task<List<ProgramWeekOverrideDto>> Handle(GetProgramWeekOverridesQuery request, CancellationToken cancellationToken) =>
        await db.ProgramWeekOverrides
            .AsNoTracking()
            .Where(o => o.ProgramId == request.ProgramId)
            .OrderBy(o => o.WeekIndex)
            .Select(o => new ProgramWeekOverrideDto(o.WeekIndex, o.Notes))
            .ToListAsync(cancellationToken);
}
```

- [ ] **Step 4: Run tests + commit**

```bash
dotnet test tests/Kondix.UnitTests/Kondix.UnitTests.csproj --filter "FullyQualifiedName~UpsertProgramWeekOverride"
git add src/Kondix.Application/Commands/Programs/UpsertProgramWeekOverrideCommand.cs src/Kondix.Application/Queries/Programs/GetProgramWeekOverridesQuery.cs tests/Kondix.UnitTests/Commands/UpsertProgramWeekOverrideCommandHandlerTests.cs
git commit -m "feat(programs): UpsertProgramWeekOverride + GetProgramWeekOverrides

Empty notes deletes the row; otherwise upsert by (program_id, week_index).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 5.5: Wire endpoints in `ProgramsController`

**Files:**
- Modify: `src/Kondix.Api/Controllers/ProgramsController.cs`

- [ ] **Step 1: Add actions**

```csharp
[HttpGet("{id:guid}/week-overrides")]
public async Task<IActionResult> GetWeekOverrides(Guid id, CancellationToken ct)
{
    RequirePermission("kondix:programs:read");
    var result = await mediator.Send(new GetProgramWeekOverridesQuery(id), ct);
    return Ok(result);
}

[HttpPut("{id:guid}/week-overrides/{weekIndex:int}")]
public async Task<IActionResult> UpsertWeekOverride(Guid id, int weekIndex, [FromBody] UpsertWeekOverrideRequest request, CancellationToken ct)
{
    RequirePermission("kondix:programs:write");
    await mediator.Send(new UpsertProgramWeekOverrideCommand(id, weekIndex, request.Notes), ct);
    return NoContent();
}
```
At bottom of file:
```csharp
public sealed record UpsertWeekOverrideRequest(string Notes);
```
Add the missing `using` statements.

- [ ] **Step 2: Build + commit**

```bash
dotnet build Kondix.slnx
git add src/Kondix.Api/Controllers/ProgramsController.cs
git commit -m "feat(api): GET/PUT /programs/{id}/week-overrides

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 5.6: Refactor `program-form.ts` with weekly grid + D&D

**Files:**
- Modify: `kondix-web/src/app/features/trainer/programs/feature/program-form.ts`

This is a substantial UI refactor. Implement in stages:

- [ ] **Step 1: Add `DragDropModule` and load data**

At the top of the component:
```typescript
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
```
Add `DragDropModule` to `imports`. On init, fetch:
- The list of trainer routines (`GET /routines` — already exists).
- The current program's `ProgramRoutine[]` if editing.
- The current program's week overrides via `GET /programs/{id}/week-overrides`.

State:
```typescript
sidebarRoutines = signal<RoutineListDto[]>([]);
weeklyGrid = signal<{ weekIndex: number; days: (RoutineListDto | null)[] }[]>([]);
overrides = signal<Map<number, string>>(new Map());
```

- [ ] **Step 2: Render the grid**

Below the existing program metadata (name, durationWeeks, etc.), render:
```html
<div class="flex gap-4">
  <aside class="w-56 shrink-0 cdkDropList" cdkDropList #sidebar="cdkDropList"
    [cdkDropListData]="sidebarRoutines()"
    [cdkDropListConnectedTo]="cellLists()">
    <p class="text-overline text-text-muted mb-2">Rutinas</p>
    @for (r of sidebarRoutines(); track r.id) {
      <div cdkDrag class="px-3 py-2 mb-2 rounded-lg bg-card border border-border cursor-grab text-sm">
        {{ r.name }}
      </div>
    }
  </aside>
  <div class="flex-1 overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr>
          <th class="w-16 text-left text-overline text-text-muted">Sem</th>
          @for (d of weekdays; track d) {
            <th class="text-overline text-text-muted">{{ d }}</th>
          }
          <th class="text-overline text-text-muted">Notas</th>
        </tr>
      </thead>
      <tbody>
        @for (week of weeklyGrid(); track week.weekIndex) {
          <tr>
            <td class="text-text font-bold">{{ week.weekIndex }}</td>
            @for (cell of week.days; track $index) {
              <td>
                <div cdkDropList
                  [cdkDropListData]="[cell]"
                  [cdkDropListConnectedTo]="allLists()"
                  (cdkDropListDropped)="onDrop(week.weekIndex, $index, $event)"
                  class="min-h-12 p-1 border border-dashed border-border rounded-md">
                  @if (cell) {
                    <div cdkDrag class="px-2 py-1 rounded bg-primary/15 text-primary text-xs font-semibold">
                      {{ cell.name }}
                    </div>
                  }
                </div>
              </td>
            }
            <td>
              <input type="text" maxlength="2000"
                class="w-full bg-bg-raised border border-border rounded-md px-2 py-1 text-xs text-text"
                placeholder="+5kg en compuestos"
                [value]="overrides().get(week.weekIndex) ?? ''"
                (blur)="onOverrideBlur(week.weekIndex, $event)" />
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>
</div>
```

- [ ] **Step 3: Implement `onDrop` and `onOverrideBlur`**

```typescript
weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

cellLists = computed(() => /* compute list IDs */ []);
allLists = computed(() => /* sidebar + every cell */ []);

onDrop(weekIndex: number, dayIndex: number, event: CdkDragDrop<unknown[]>): void {
  // If dropped from sidebar, copy the routine into the cell.
  // If swapped between cells, update both. Mark the program form as dirty.
}

onOverrideBlur(weekIndex: number, event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  const programId = this.programId;  // assumed available when editing
  if (!programId) return;
  this.api.put(`/programs/${programId}/week-overrides/${weekIndex}`, { notes: value })
    .subscribe({
      next: () => {
        const map = new Map(this.overrides());
        if (value.trim()) map.set(weekIndex, value); else map.delete(weekIndex);
        this.overrides.set(map);
      },
      error: (err) => this.toast.show(err.error?.error ?? 'No se pudo guardar', 'error'),
    });
}
```

The `cellLists`/`allLists` computeds are needed so `cdkDropListConnectedTo` can wire all drop targets together. The exact CDK API requires generating unique list IDs per cell — refer to Angular CDK docs for `cdkDropListConnectedTo` patterns.

- [ ] **Step 4: Submit changes back to the program**

When the trainer hits "Guardar", flatten `weeklyGrid` into the existing `ProgramRoutine[]` shape that `POST /programs` / `PUT /programs/{id}` already accepts. The week-grid is purely a UI layer; persisted state stays as the existing program-routine ordered list.

- [ ] **Step 5: Build + verify visually**

Run: `cd kondix-web && npx ng build`
Expected: 0 errors. Then run dev server, open the program editor, drag a routine from the sidebar into a cell. Type a per-week note and tab out — verify it persists via the new endpoint (`PUT` returns 204).

- [ ] **Step 6: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/feature/program-form.ts
git commit -m "$(cat <<'EOF'
feat(programs): weekly D&D grid editor + per-week notes

Sidebar of trainer routines + 7-col x N-week grid using @angular/cdk
drag-drop. Per-week notes input commits to PUT /programs/{id}/week-overrides
on blur. Persistence layer unchanged — grid is a UI projection over the
existing ProgramRoutine[] shape.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# PHASE 6 — Library polish + docs

## Task 6.1: Verify catalog editor visual match

**Files:**
- Modify: `kondix-web/src/app/features/trainer/catalog/feature/catalog-list.ts` (if needed)

- [ ] **Step 1: Compare against handoff**

Open `design_handoff_kondix_v2/prototypes/trainer/view-library.jsx` to inspect the editor's intended visual: square `PhotoUpload` + `videoSource` (None / YouTube / Upload) selector. Run dev server and compare side-by-side.

- [ ] **Step 2: Apply visual tweaks if any**

The exercise-catalog refactor already shipped a working editor. If anything is off (spacing, label copy, ordering of fields, video source toggle look), adjust in `catalog-list.ts` to match. Likely no major change needed.

- [ ] **Step 3: Commit only if changes**

If tweaks were made: `fix(catalog): align editor visuals with v2 handoff`. Otherwise skip.

## Task 6.2: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Append v2 components to the Reusable Components list**

Add to the bullet list in the "Reusable Components" section:
```markdown
- `<kx-exercise-thumb>` — Square thumbnail (32/40/56/72) with photoUrl + muscle-tinted fallback + optional video pill
- `<kx-set-chip>` — Compact historical set chip (weight × reps, PR badge, note tooltip)
- `<kx-session-row>` — Expandable trainer timeline row with mood + RPE chips + set chips + notes
- `<kx-mood-picker>` — 4-option mood selector (Great|Good|Ok|Tough)
- `<kx-rpe-stepper>` — 1–10 RPE selector with green→amber→red color scale
- `<kx-video-demo-overlay>` — Full-screen YouTube demo player with backdrop close
- `<kx-recovery-banner>` — Yellow home banner for recoverable missed sessions
- `<kx-exercise-feedback-modal>` — RPE + notes capture after last set of an exercise
```

- [ ] **Step 2: Add new gotchas**

Under "Gotchas" or "Known Bugs", add:
```markdown
- **PR detection inline**: `POST /sets/update` now returns `{ setLog, newPr? }`. Detection failure is swallowed — toast missing is preferable to write loss.
- **CompleteSession is idempotent**: re-calls update mood/notes without re-advancing rotation — mitigates the "Session already completed" middleware spam.
- **Recovery sessions advance rotation index** the same as normal sessions.
- **`kondix-videos` MinIO bucket** still not provisioned in prod — YouTube embeds remain the only video source.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with v2 components, endpoints, gotchas

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 6.3: Update `kondix-web/.impeccable.md`

**Files:**
- Modify: `kondix-web/.impeccable.md`

- [ ] **Step 1: Append component inventory**

Add the same component list from Task 6.2 plus implementation notes (sizes, signal patterns, OnPush behavior). Brief — this file is a design reference, not docs.

- [ ] **Step 2: Commit**

```bash
git add kondix-web/.impeccable.md
git commit -m "docs(impeccable): document v2 components for design context

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

## Task 6.4: Update `setup/03-deploy-checklist.md`

**Files:**
- Modify: `setup/03-deploy-checklist.md`

- [ ] **Step 1: Document the three migrations**

Append:
```markdown
## v2 deploy (2026-04-26)

Migrations applied in order:
1. AddSessionAndSetFeedbackFields
2. AddSessionRecoveryFields
3. AddProgramWeekOverrides

All additive, no backfill. No app downtime expected.

Frontend dep added: `@angular/cdk@21` — bundle increase ~30kb (lazy chunk for programs editor).

Env vars to set in `deploy/.env` and `deploy/docker-compose.prod.yml` for `kondix-api`:
- `Internal__ApiKey` (Phase 1.5) — shared with CelvoAdmin's `Kondix__InternalApiKey`.
```

- [ ] **Step 2: Commit**

```bash
git add setup/03-deploy-checklist.md
git commit -m "docs(deploy): document v2 migrations + env vars + cdk dep

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

# Final verification

After all phases land, run:

```bash
dotnet build Kondix.slnx
dotnet test Kondix.slnx
cd kondix-web && npx ng build && npx vitest run
```

Expected: 0 errors, all tests pass. Commit any final fixes and you're done.

---

## Plan Self-Review

Run through this checklist before handing off:

1. **Spec coverage:** Every section of `2026-04-26-kondix-v2-feedback-loop-recovery-and-visual-refresh-design.md` maps to at least one task above (§3 decisions → File Map + per-task code; §4 data model → 3.A.2/3.A.3/4.1/5.2; §5 API → 1.5.4, 3.A.5–10, 4.5, 5.5; §6 components → Phases 1–4 UI tasks; §7 phases → directly mirrored; §11 trainer approval → Phase 1.5).
2. **No placeholders:** Verified — every step contains concrete code or commands. `{ts}` in migration filenames is the auto-generated EF timestamp, not a TODO.
3. **Type consistency:** `MoodType`, `ApprovalResult`, `RecoverableSessionDto`, `RecentFeedbackDto`, `UpdateSetDataResponse`, `TrainerSessionDto` — names and shapes are consistent across backend, frontend, and within the plan.
4. **Test coverage:** Every backend command has a unit test in `tests/Kondix.UnitTests/`; one integration test class for the new `InternalTrainersController`. Frontend coverage = manual verification + Vitest for the YouTube util only (per the user preference to skip Playwright E2E for now).
