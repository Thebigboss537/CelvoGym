# KONDIX v2 — Feedback Loop, Recovery System & Visual Refresh

**Date:** 2026-04-26
**Status:** Draft — pending user review
**Scope:** Multi-phase iteration on existing app (.NET 10 + Angular 21). Not a rewrite.

---

## 1. Goal

Add the bidirectional trainer↔student feedback loop, recovery system for missed sessions, video demo overlay in student logging, PR celebration toast, and visual refinements across trainer drawer / programs editor / library — all incrementally on top of the existing codebase.

The handoff bundle (`design_handoff_kondix_v2/`) is the source of truth for visual + behavioral decisions. This spec captures the architectural decisions (data model, API contracts, component inventory, migration approach) needed before the implementation plan.

---

## 2. Prerequisite (already done)

`feat/exercise-catalog-and-block-refactor` was merged to `main` on 2026-04-26. The following invariants now hold and the v2 work depends on them:

- `CatalogExercise` carries `ImageUrl`, `VideoUrl`, `VideoSource`, `MuscleGroup`.
- Routine `Exercise` rows do **not** carry video fields directly — they always reference a `CatalogExerciseId`. DTOs project `imageUrl`, `videoUrl`, `videoSource` (and now `muscleGroup`) from the catalog.
- `ExerciseGroup` → `ExerciseBlock` rename completed; `BlockType` is `Superset | Triset | Circuit | null`.
- Auto-cataloging on routine save means every `Exercise.CatalogExerciseId` is always populated.

**v2-specific addition:** project `muscleGroup` to `ExerciseDto` (in `RoutineBuilder` + `GetMyRoutineDetailQuery` + `GetRoutineByIdQuery`) so `<kx-exercise-thumb>` reads it without a join.

---

## 3. Architectural decisions (decisions log)

| # | Question | Decision | Rationale |
|---|---|---|---|
| Q1 | Mood storage | Enum `MoodType { Great, Good, Ok, Tough }`, stored as string in DB | Consistency with `SetType`, `BlockType`, `AssignmentMode`. Validated server-side via FluentValidation. |
| Q2 | "Unread feedback" badge for trainer | `WorkoutSession.FeedbackReviewedAt` (DateTimeOffset?) — set on first GET to the Progreso tab; badge counts sessions with feedback that have `FeedbackReviewedAt IS NULL` | Richer UX than "last 14 days"; clear semantic ("there's new feedback"); cheap to implement. |
| Q3 | Per-exercise feedback (RPE + notes) | New entity `ExerciseFeedback (Id, SessionId, ExerciseId, ActualRpe, Notes, CreatedAt)` with `UNIQUE(SessionId, ExerciseId)` | Separates from `SetLog.ActualRpe` (per-set ≠ per-exercise perceived RPE). Clean queries for "exercise X feedback over time". |
| Q4 | PR detection wiring to toast | Inline: `UpdateSetDataCommand` calls `DetectNewPRsCommand` after save and returns `newPR?` in response | One round-trip; immediate feedback. Existing `GET /records/detect` kept but deprecated. |
| Q5 | Missed session detection | Inferred on-the-fly from `ProgramAssignment.TrainingDays` + `WorkoutSession` history. No precomputed `missed` rows | No nightly job; no state to sync; calendar already drives the schedule. |
| Q6 | Drag-and-drop in programs editor | Add `@angular/cdk` (~30kb gzipped) | Industry standard for D&D in Angular; saves writing custom logic. |
| Q7 | Per-week program overrides | New entity `ProgramWeekOverride (Id, ProgramId, WeekIndex, Notes)`, `UNIQUE(ProgramId, WeekIndex)` | Scales for future per-week metadata; semantic clarity (overrides are of the week, not of the routine-program junction). |
| Q8 | Video pill on `<kx-exercise-thumb>` | Show pill **only** in catalog grid and exercise picker. Hidden in routine wizard, student logging, and trainer timeline. | Avoid visual noise where redundant ("Ver demo" button already covers logging) or out-of-context (timeline is historical). |
| Q9 | `muscleGroup` access in frontend | Project from catalog into `ExerciseDto` (server side) | Avoids extra join on client; consistent with how `imageUrl` / `videoUrl` are already projected. |

**Out-of-band agreement:** the user accepts wiping Kondix data if migrations need to be destructive. Default approach is still additive + nullable for safety; destructive paths are explicitly flagged below when chosen.

---

## 4. Data model changes

All new tables/columns live in the `kondix` PostgreSQL schema.

### 4.1 Modify `SetLog`
```csharp
public class SetLog : BaseEntity {
    // ...existing fields
    public string? Notes { get; set; }   // student's per-set free-text note
}
```
Migration: `ALTER TABLE set_logs ADD COLUMN notes text NULL;` — additive, no backfill needed.

### 4.2 Modify `WorkoutSession`
```csharp
public class WorkoutSession : BaseEntity {
    // ...existing fields (StudentId, RoutineId, DayId, StartedAt, CompletedAt, Notes...)
    public MoodType? Mood { get; set; }                       // enum stored as string
    public DateTimeOffset? FeedbackReviewedAt { get; set; }   // null = unread by trainer
    public bool IsRecovery { get; set; } = false;
    public Guid? RecoversSessionId { get; set; }              // FK self, nullable
    public WorkoutSession? RecoversSession { get; set; }
}
```
Migration: additive — `mood varchar(20) NULL`, `feedback_reviewed_at timestamptz NULL`, `is_recovery bool NOT NULL DEFAULT false`, `recovers_session_id uuid NULL REFERENCES workout_sessions(id)`.

### 4.3 New entity `ExerciseFeedback`
```csharp
public class ExerciseFeedback : BaseEntity {
    public Guid SessionId { get; set; }
    public Guid ExerciseId { get; set; }
    public int ActualRpe { get; set; }      // 1..10, validated 1-10 in FluentValidation
    public string? Notes { get; set; }

    public WorkoutSession Session { get; set; } = null!;
    public Exercise Exercise { get; set; } = null!;
}
```
Indexes: `UNIQUE(session_id, exercise_id)`, `INDEX(exercise_id, created_at DESC)` (for "feedback over time" queries).

### 4.4 New entity `ProgramWeekOverride`
```csharp
public class ProgramWeekOverride : BaseEntity {
    public Guid ProgramId { get; set; }
    public int WeekIndex { get; set; }      // 1-based to match UI
    public string Notes { get; set; } = string.Empty;

    public Program Program { get; set; } = null!;
}
```
Indexes: `UNIQUE(program_id, week_index)`.

### 4.5 New enum `MoodType`
```csharp
namespace Kondix.Domain.Enums;
public enum MoodType { Great, Good, Ok, Tough }
```
Stored as PascalCase string in DB and JSON via `JsonStringEnumConverter` + `EnumToStringConverter` (existing pattern, same as `SetType`/`BlockType`/`AssignmentMode`). DB column type: `varchar(20) NULL`.

UI emoji mapping (frontend only, in `<kx-mood-picker>`): `Great` → 🔥, `Good` → ✅, `Ok` → 😐, `Tough` → 😮‍💨.

### 4.6 Migration plan

Three additive EF migrations, applied in order on deploy:

1. `AddSessionAndSetFeedbackFields` — `set_logs.notes`, `workout_sessions.{mood, feedback_reviewed_at}`, new table `exercise_feedback` with indexes.
2. `AddSessionRecoveryFields` — `workout_sessions.{is_recovery, recovers_session_id}` + FK.
3. `AddProgramWeekOverrides` — new table.

No backfills required. All new columns nullable or have safe defaults. Compatible with existing prod data.

---

## 5. API contract changes

### 5.1 Modified — `POST /api/v1/public/my/sets/update`
Request unchanged. Response extended:
```ts
interface UpdateSetDataResponse {
    setLog: SetLogDto;
    newPR?: { exerciseName: string; weight: string; previousWeight: string | null; reps: string | null };
}
```
Implementation: `UpdateSetDataCommandHandler` calls `DetectNewPRsCommand` after save, includes the matching record in response if any. Existing race-condition retry logic preserved.

### 5.2 New — `PATCH /api/v1/public/my/sets/{setLogId}/note`
Body: `{ note: string | null }`. Persists `SetLog.Notes`. Idempotent. Allowed only while the parent session is active (`StartedAt IS NOT NULL AND CompletedAt IS NULL`); rejected with 409 otherwise.

### 5.3 New — `POST /api/v1/public/my/sessions/{id}/exercise-feedback`
Body: `{ exerciseId: Guid, actualRpe: int (1..10), notes: string? }`. Upserts `ExerciseFeedback` row by `(SessionId, ExerciseId)`. Validates session belongs to caller and is not yet completed.

### 5.4 Extended — `POST /api/v1/public/my/sessions/{id}/complete`
Body extended:
```ts
interface CompleteSessionRequest {
    notes: string | null;       // existing
    mood: MoodType | null;      // new
}
```
Handler is made **idempotent** — if session already has `CompletedAt`, accept the call and update `mood`/`notes` instead of throwing. Mitigates the existing "Session already completed" middleware spam (CLAUDE.md Known Bugs).

### 5.5 New — `GET /api/v1/public/my/missed-sessions`
Returns at most one recoverable session for the caller (the most recent missed training day within the last 2 days). Computed on-the-fly from active assignment's `TrainingDays` + completed sessions. Response:
```ts
interface RecoverableSessionDto {
    plannedDate: string;        // YYYY-MM-DD
    routineId: Guid; routineName: string;
    dayId: Guid; dayName: string;
    deadlineDate: string;       // YYYY-MM-DD = plannedDate + 2 days
}
```
**Date semantics:** "today" = `DateOnly.FromDateTime(DateTime.UtcNow)` server-side. A training day is "missed" if it was planned in `[today - 2, today - 1]` and has no `WorkoutSession` (or only a session with `CompletedAt IS NULL` from days ago). The endpoint returns the **most recent** missed day — older missed days are unrecoverable. The `deadlineDate` is `plannedDate + 2 days`, so a day missed yesterday has deadline tomorrow ("vence mañana").

Returns `204 No Content` if nothing recoverable. Also returns 204 if a recovery for that planned date already exists.

### 5.6 Modified — `POST /api/v1/public/my/sessions/start`
Body extended:
```ts
interface StartSessionRequest {
    routineId: Guid; dayId: Guid;
    recoversSessionId?: Guid;   // new — when set, marks session as recovery
}
```
If `recoversSessionId` is set, the new `WorkoutSession` row gets `IsRecovery = true` and the FK populated. Validation: the referenced session must belong to the caller and be missed.

### 5.7 New — `GET /api/v1/students/{id}/recent-feedback`
Trainer-only. Returns count of unread sessions + a brief list of latest 5 sessions with `notes/mood/exercise-feedback IS NOT NULL`. Used for the badge on Progreso tab and the "Resumen" banner.
```ts
interface RecentFeedbackDto {
    unreadCount: int;
    sessions: { sessionId: Guid; routineName: string; completedAt: string; mood?: string; hasNotes: bool }[];
}
```

### 5.8 New — `POST /api/v1/students/{id}/feedback/mark-read`
Trainer-only. Marks all completed sessions of student `{id}` with `FeedbackReviewedAt = now`. Called by frontend on first mount of Progreso tab.

### 5.9 New — `GET /api/v1/programs/{id}/week-overrides` and `PUT /api/v1/programs/{id}/week-overrides/{weekIndex}`
Trainer-only. CRUD for `ProgramWeekOverride`. PUT body: `{ notes: string }` (empty string deletes the override).

### 5.10 Auth & CSRF
All trainer endpoints follow existing pattern: `RequirePermission("kondix:students:read|write" | "kondix:programs:write")` inline. Student endpoints under `/api/v1/public/my/*` skip trainer context but require CelvoGuard JWT + CSRF.

---

## 6. Frontend component inventory

### 6.1 New shared components (`kondix-web/src/app/shared/ui/`)

| Component | File | Inputs | Outputs |
|---|---|---|---|
| `<kx-exercise-thumb>` | `exercise-thumb.ts` | `name: string`, `muscleGroup: string \| null`, `photoUrl: string \| null`, `size: 'xs'\|'sm'\|'md'\|'lg' = 'md'`, `hasVideo: boolean = false` | — |
| `<kx-set-chip>` | `set-chip.ts` | `weight: string`, `reps: number`, `isPR: boolean = false`, `note: string \| null = null`, `setType: string = 'Effective'` | — |
| `<kx-session-row>` | `session-row.ts` | `session: TrainerSessionDto`, `expanded: boolean = false` | `toggle: void` |
| `<kx-mood-picker>` | `mood-picker.ts` | `value: MoodType \| null` | `valueChange: MoodType` |
| `<kx-rpe-stepper>` | `rpe-stepper.ts` | `value: number \| null`, `showLabel: boolean = true` | `valueChange: number` |
| `<kx-video-demo-overlay>` | `video-demo-overlay.ts` | `url: string`, `exerciseName: string`, `open: boolean = false` | `close: void` |
| `<kx-recovery-banner>` | `recovery-banner.ts` | `missedSession: RecoverableSessionDto` | `recover: void`, `dismiss: void` |
| `<kx-exercise-feedback-modal>` | `exercise-feedback-modal.ts` | `exerciseName: string`, `open: boolean` | `submit: { rpe: number; notes: string \| null }`, `skip: void` |

### 6.2 Modified shared components

| Component | Change |
|---|---|
| `<kx-toast>` | Add `'pr'` to `Toast.type`. New method `ToastService.showPR(exerciseName, weight, reps)` with 4s duration, gold/crimson gradient, 🏆 icon, optional `navigator.vibrate([100,60,100,60,200])` (feature-detected). |
| `<kx-set-row>` | New input `note: string \| null = null`. New input `showNoteToggle: boolean = false`. New output `noteChange: string`. Toggle 💬 icon opens inline textarea (CSS-grid collapse animation, `prefers-reduced-motion` respected). |
| `<kx-day-cell>` | Add `'recovered'` to state literal type. Visual: green tint + Lucide `rotate-ccw` icon. |

### 6.3 Smart components & feature changes

**Student** (`features/student/`):
- `feature/home.ts` — fetch `GET /missed-sessions` on init; render `<kx-recovery-banner>` when present.
- `feature/exercise-logging.ts` — wire "Ver demo" button (only when `exercise.videoUrl != null`); render `<kx-video-demo-overlay>`. Wire `<kx-set-row>` note toggle (calls `PATCH /sets/{id}/note`). Open `<kx-exercise-feedback-modal>` after last set of an exercise. Show PR toast when response includes `newPR`.
- `feature/workout-complete.ts` — replace existing summary with `<kx-mood-picker>` + textarea; submit calls extended `/sessions/{id}/complete`.
- `feature/calendar.ts` — pass `'recovered'` state to `<kx-day-cell>` based on session's `isRecovery` flag.

**Trainer** (`features/trainer/students/feature/`):
- **Split** `student-detail.ts` (currently 443 lines) into:
  - `student-detail.ts` — **shell**: owns `studentId` resolution (route param or input), data fetching (`StudentDto`, `StudentOverviewDto`, `ProgramAssignmentDto[]`, `RecentFeedbackDto`), avatar/header, `<kx-segmented-control>` tabs. Passes loaded data down via inputs.
  - `student-detail-summary.ts` — receives `overview` + `recentFeedback` as inputs. Renders KPI grid, profile inline edit, **feedback CTA banner** when `unreadCount > 0` (clicking it switches to Progreso tab via output event).
  - `student-detail-program.ts` — receives `assignments` as input + outputs for assign/cancel actions; current "programa actual" block, assignment form, history.
  - `student-detail-progress.ts` — receives `studentId` as input, fetches sessions/PRs/measurements itself. `<kx-session-row>` timeline, segmented filter (Todas/Hechas/Saltadas/Con notas), PRs section, body metrics sparkline, photos strip. **On first mount, calls `POST /students/{id}/feedback/mark-read`** to clear the badge.
  - `student-detail-notes.ts` — existing private notes panel (lift unchanged).

**Trainer** (`features/trainer/programs/feature/`):
- `program-form.ts` — extend with weekly grid (`@angular/cdk/drag-drop`). 7 cols × N weeks; cells accept routine drops from a sidebar picker. Per-week notes row with `<input>` bound to `PUT /week-overrides/{weekIndex}`.

**Trainer** (`features/trainer/catalog/feature/`):
- `catalog-list.ts` — render cards with `<kx-exercise-thumb size="lg" [hasVideo]="!!ex.videoUrl">`. Editor uses square `PhotoUpload` + `videoSource` selector (already done in refactor — verify).

### 6.4 Tokens & utilities

- Add `--color-muscle-pecho`, `--color-muscle-espalda`, …, `--color-muscle-core` (10 tokens) to `kondix-web/src/styles.css` `@theme`. Used by `<kx-exercise-thumb>` as 12% opacity gradient fallback when `photoUrl` is null.
- Extract YouTube embed normalizer to `shared/utils/youtube.ts` (`youtubeEmbedUrl(url): SafeResourceUrl`). The current implementation lives inline in `exercise-logging.ts` — dedupe.

---

## 7. Phased implementation roadmap

Each phase ends with a green build, optional E2E coverage, and is independently shippable.

### Phase 1 — Foundation (low risk, no migration)
- `<kx-exercise-thumb>` + muscle-group tokens.
- Migrate catalog grid + exercise picker to use new thumb. (Routine wizard rows can wait — they currently show name/order, not thumb.)
- `<kx-toast>` `pr` variant + `ToastService.showPR`.
- `youtubeEmbedUrl` util extracted.
- Project `muscleGroup` into `ExerciseDto` (backend, no migration — add to projections).

### Phase 2 — Video demo overlay (no migration)
- `<kx-video-demo-overlay>`.
- "Ver demo" button in `exercise-logging.ts`. Visual sólo.

### Phase 3 — Bidirectional feedback loop (migration #1 + endpoints + UI)
- Migration `AddSessionAndSetFeedbackFields`.
- `MoodType` enum, `ExerciseFeedback` entity + EF config + DbContext registration.
- Endpoints §5.1 (PR inline), §5.2 (set note), §5.3 (exercise feedback), §5.4 (extended complete + idempotent), §5.7 (recent-feedback), §5.8 (mark-read).
- `<kx-set-row>` extended with note toggle.
- `<kx-rpe-stepper>`, `<kx-mood-picker>`, `<kx-exercise-feedback-modal>`, `<kx-set-chip>`, `<kx-session-row>`.
- Student logging: note per set, exercise feedback modal on last set, PR toast on `newPR`.
- Workout complete: mood + notes.
- Trainer: split `student-detail.ts` into 4 sub-components (Resumen/Programa/Progreso/Notas) + tab `<kx-segmented-control>` + badge + Resumen banner.

### Phase 4 — Recovery system (migration #2 + endpoints + UI)
- Migration `AddSessionRecoveryFields`.
- Endpoint §5.5 (`GET /missed-sessions`) and §5.6 (`POST /sessions/start` extended).
- `<kx-recovery-banner>` on student home.
- Recovery flow: tapping banner starts a session with `recoversSessionId`; logging screen shows "RECUPERANDO DEL {dayName}" label.
- `<kx-day-cell>` `recovered` state.
- Edge cases handled (see §8).

### Phase 5 — Programs editor refresh (migration #3 + CDK D&D)
- Add `@angular/cdk` dep.
- Migration `AddProgramWeekOverrides`.
- Endpoint §5.9.
- `program-form.ts` weekly grid with D&D + week-override notes.
- Assignment modal with searchable student list + datepicker.

### Phase 6 — Library polish + docs
- Verify catalog editor matches handoff (`PhotoUpload` square + video source selector). Likely already done by refactor; confirm pixel match.
- Update `CLAUDE.md` and `kondix-web/.impeccable.md` with new components.
- Update `setup/03-deploy-checklist.md` with the three new migrations + `@angular/cdk` dep.

---

## 8. Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| `student-detail.ts` already 443 lines; adding 4 tabs without split makes it unmaintainable. | High | **Phase 3 splits it into 4 sub-components first**, before adding new tab content. Stable refactor commit, separate from feature commits. |
| PR detection inline in `UpdateSetDataCommand` lengthens transaction; existing race retry logic must be preserved. | Med | Keep retry block intact. Run PR detection **after** save+commit, in a separate transaction; if it fails, log + return setLog without `newPR` (toast missed is recoverable, write durability is not). |
| "Session already completed" middleware spam (CLAUDE.md Known Bug) could amplify with new feedback endpoints writing to a completed session. | Med | Phase 3 makes `CompleteSessionCommand` idempotent (§5.4). Exercise feedback (§5.3) explicitly rejects calls on completed sessions to keep semantic clear; per-set notes (§5.2) are allowed only while session active. |
| Recovery edge cases: multiple missed days, partial sessions, rotation index after recovery, program transitions across recovery. | Med | Spec rules: (a) `GET /missed-sessions` returns **at most one** — the most recent missed within 2 days; multiple older missed are not recoverable. (b) Partial sessions (started but not completed) count as missed. (c) Recovery sessions DO advance `RotationIndex` like normal sessions in rotation mode. (d) If the program is `Completed`/`Cancelled` between miss and recovery, the recovery is denied — banner does not appear. |
| Migrations applied only at deploy (no dev DB). | Low | Each migration is additive + nullable. Test build green pre-deploy via `dotnet build` + EF Core migration validation (`dotnet ef migrations script` to inspect SQL). |
| `@angular/cdk` adds ~30kb to bundle. | Low | Only included in lazy-loaded `programs` chunk if imported there. Verify post-build chunk size. |
| Existing E2E tests under `kondix-web/e2e/` may break when extending API responses. | Low | Run `npx playwright test` locally before each Phase merge. Extend specs in same commit when behavior changes (e.g., set logging now expects `note` toggle). |

---

## 9. Out of scope (explicit non-goals)

- Push notifications when PRs happen (toast only).
- Trainer commenting on a specific feedback note from the timeline (stays at session level).
- Importing the JSX/HTML prototypes verbatim — they are visual reference; everything is rewritten in Angular following repo conventions.
- Migrating `gym.celvo.dev` traffic (already a 301 redirect).
- The `Healthcheck fails` and `Session already completed` known bugs (CLAUDE.md) get **partial** mitigation (idempotent complete) but full root-cause fix is out of scope.
- Support for video uploads to MinIO (`kondix-videos` bucket) — not yet provisioned in prod; YouTube-only stays.

---

## 10. Success criteria

- Student can: take a per-set note, give per-exercise RPE+note feedback, choose mood + note at session end, recover a missed training day, see PR toast on new record, watch demo video inline.
- Trainer can: see "unread" badge on Progreso tab, see banner CTA on Resumen when there's recent feedback, expand sessions in timeline to read all notes/RPE/mood, drag-drop routines into a weekly program grid, add per-week notes.
- All shared components consistent with `kondix-web/.impeccable.md` design tokens. No new color tokens outside the existing system.
- Each phase shippable independently; production deploy applies migrations cleanly without backfill scripts.
- Build green (.NET + Angular + ArchTests + IntegrationTests + Playwright E2E for changed flows).
