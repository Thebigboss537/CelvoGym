# KONDIX v2 — Implementation Log

> Live log of issues, decisions, deviations, and gotchas encountered while executing the consolidated plan at `docs/superpowers/plans/2026-04-26-kondix-v2-implementation.md`. Updated during execution. Commits at end of each phase.

## Conventions

- **Tarea:** identificador del plan (e.g., `Task 1.1`).
- **Tipo:** `incident` | `deviation` | `decision` | `note`.
- **Estado:** ¿se resolvió en esta sesión, queda pendiente, o se diferió a una fase posterior?

## Phase 1 — Foundation

_Branch:_ `feat/v2-phase-1`
_Started:_ 2026-04-26

| Tarea | Tipo | Descripción | Resolución |
|---|---|---|---|
| Task 1.1 | decision | Plan asked for Vitest util tests, but the project uses Karma + Jasmine via `ng test` (the `frontend-angular.md` rule mentioning Vitest is aspirational; vitest is not in `devDependencies`). Spec was written with Jasmine globals so `npm test` works on a clean clone. | Resolved in commit `c41c3b34`; future Phase 1+ specs follow the same pattern until vitest is wired up properly as its own task. |
| Task 1.1 | deviation | Plan listed 5 vitest cases for `youtubeEmbedUrl`. Added 2 more: one for `youtube.com/shorts/` (preserves prior inline behavior in `extractYouTubeId`) and one for `watch?v=` URLs with leading query params (covers YouTube "Share" output). | Resolved (commits `dbb01109` + post-fix). |
| Task 1.1 | deviation | Plan said replace the iframe `[src]` with `youtubeEmbedUrl(url)` directly via `DomSanitizer`. Used a `computed<SafeResourceUrl \| null>` instead, per the project's documented OnPush+signals convention. Added an `@if (embedUrl())` guard so non-matching URLs don't render an empty-src iframe. | Resolved (commits `a6d24b8b` + post-fix). |
| Task 1.5 | deviation | Plan said `size="lg"` (72px) for catalog cards. Reviewer flagged this produces a small square inside a large card, breaking the v2 handoff §4.3 ("Card con foto cuadrada 1:1" — full card width). Extended `<kx-exercise-thumb>` with a `'fill'` size variant (`w-full aspect-square`) and used it in the catalog grid. Other consumers (pickers, list rows, trainer timeline) keep the fixed pixel sizes. | Resolved (post-`79052419` commit). |

---

**Phase 1 closeout (2026-04-26):**
- 7 tasks complete in 12 commits across `feat/v2-phase-1`.
- 4 deviations logged above (all approved by per-task and final phase reviews).
- Tests green: .NET 16 unit + 8 arch + 5 integration; Angular Karma 7 (youtube) + 3 (toast.showPR after this commit) = 39 specs.
- Final phase review flagged 2 carryover items to address opportunistically: extract `MUSCLE_TOKEN` to a shared util when a second consumer needs it (Phase 3+); migrate `[class.X]` toast bindings to ternary string form (Phase 6).
- Branch ready to merge to main with `--no-ff`.

## Phase 1.5 — Trainer approval & auto-seed

_Branch:_ `feat/v2-phase-1-5`
_Started:_ 2026-04-26

| Tarea | Tipo | Descripción | Resolución |
|---|---|---|---|
| Task 1.5.2 | deviation | Plan's test fixture used `Trainer { UserId = ... }`; the actual entity field is `CelvoGuardUserId`. Tests adapted; entity untouched. | Resolved in commit `18fb1723`. |
| Task 1.5.3 | deviation | Plan's `PendingTrainerDto` had `Email: string`, but `Trainer` has NO `Email` field — emails live cross-schema in CelvoGuard's user record. DTO replaced `Email` with `CelvoGuardUserId: Guid` so CelvoAdmin (which has read access to the celvoguard schema) cross-resolves emails locally. | Resolved in commit `95657334`. Downstream impact: CelvoAdmin's spec/plan must include the join. |
| Task 1.5.4 | incident | Plan defect: `Program.cs` middleware bypass excluded `/api/v1/internal/test` only; `/api/v1/internal/trainers` was unreachable in prod (would 401 from `CelvoGuardMiddleware` before `AuthorizeInternal()` ran). Caught by code review. Fix widened the bypass to `/api/v1/internal` (covers both controllers and any future internal endpoints). | Resolved in commit `9e8e8da8`. |
| Task 1.5.4 | decision | "Trainer not found" magic string was duplicated between handler `throw` and controller `catch when`. Extracted to `ApproveTrainerCommand.TrainerNotFoundMessage` const referenced from both sides. Test keeps the literal `WithMessage(...)` assertion (proves the public contract). | Resolved in commit `9e8e8da8`. |
| Task 1.5.5 | incident | Two test classes both using `WebApplicationFactory<Program>` raced on `HostFactoryResolver` under xUnit's default cross-class parallelism, deterministically failing `Approve_AlreadyApproved_IsNoOp`. Fix added assembly-level `[CollectionBehavior(DisableTestParallelization = true)]` in a new `tests/Kondix.IntegrationTests/AssemblyInfo.cs` (additive — doesn't touch existing test files). | Resolved in commit `0692592f`. Follow-up: switch to `[Collection]` attributes if a third factory is ever added. |
| Task 1.5.5 | deviation | Plan listed only 4 integration tests; reviewer flagged that the `ListPending` happy path was uncovered (only the 401 path was tested). Added 5th test `ListPending_WithKey_ReturnsOnlyUnapproved`. Also tightened seed-count assertion from `BeGreaterThan(40)` to `BeInRange(40, 100)` to catch accidental duplication. | Resolved in commit `575a470e`. |
| Task 1.5.6 | note | Plan referenced `setup/03-deploy-checklist.md`; actual file is `setup/04-deploy-checklist.md` (slot 03 is `minio-bucket.sh`). Implementer used the right file. | Resolved in commit `2fc550ce`. Plan path reference is stale; fix opportunistically. |

---

**Phase 1.5 closeout (2026-04-26):**
- 6 tasks complete in 9 commits across `feat/v2-phase-1-5`.
- 7 deviations logged above (all approved by per-task and final phase reviews).
- Tests green: .NET 19 unit + 8 arch + 9 integration (was 5; added 4 in Task 1.5.5) = 36 backend specs. Frontend test counts unchanged (this phase is backend-only).
- New endpoints reachable: `POST /api/v1/internal/trainers/{id}/approve` and `GET /api/v1/internal/trainers/pending`, both gated by `X-Internal-Key` against `Internal:ApiKey` config (env var `Internal__ApiKey` in prod).
- Auto-seed wired: `ApproveTrainerCommand` dispatches `SeedCatalogCommand` on first approval; idempotent on re-call (no double-seed).
- CelvoAdmin-side work (UI + proxy controller) is OUT OF SCOPE for this plan. The CelvoAdmin spec/plan in its own repo must consume `Internal__ApiKey` as `Kondix__InternalApiKey` and resolve emails by joining `celvoguard.users` on the returned `CelvoGuardUserId`.
- Branch ready to merge to main with `--no-ff`.

## Phase 2 — Video demo overlay

_Branch:_ `feat/v2-phase-2`
_Started:_ 2026-04-26

| Tarea | Tipo | Descripción | Resolución |
|---|---|---|---|
| Task 2.1 | decision | Tightened backdrop click handler to compare `event.target === event.currentTarget` so events bubbling from the inner iframe (which can vary across browsers) don't accidentally close the overlay. | Resolved in commit `1c8a6e37`. |
| Task 2.2 | deviation | Plan said gate the "Ver demo" pill on `exercise.videoUrl` only. The overlay only handles YouTube URLs — exposing the pill for `videoSource === 'Upload'` would render "No se pudo cargar el vídeo." Tightened the gate to `videoSource === 'YouTube' && videoUrl` so the surface matches actual capability. Latent regression — Upload not enabled in prod today (MinIO bucket `kondix-videos` not provisioned). | Resolved in commit `5833d38a`. |

---

**Phase 2 closeout (2026-04-26):**
- 2 tasks complete in 5 commits across `feat/v2-phase-2`.
- 2 deviations logged above (both improvements over the plan, approved by per-task and final phase reviews).
- Tests green: .NET 20 unit + 8 arch + 10 integration (unchanged — this phase is frontend-only) + Karma 10 specs (7 youtube + 3 toast, unchanged) = 48 specs.
- New surface: red "Ver demo" pill in the student logging screen → opens `<kx-video-demo-overlay>` (full-screen YouTube iframe with backdrop click-to-close + 🏆-grade celebration ready for Phase 3 PR toast).
- Frontend-only — no backend, no DTOs, no migrations, no new env vars.
- Carryover items to address opportunistically: Esc-key close + focus management on `<kx-video-demo-overlay>` (and `<kx-confirm-dialog>` together) as a Phase 4 / visual-polish sweep; revisit pill placement in Phase 3 once muscle-group/equipment badges land alongside it; if MinIO uploads ever go live, either extend `<kx-video-demo-overlay>` to render `<video>` for `videoSource='Upload'` or relax the pill gate.
- Branch merged to main via `81dc3ab6` and pushed to `origin/main` on 2026-04-26.

## Phase 3 — Bidirectional feedback loop

_Branch:_ `feat/v2-phase-3`
_Started:_ 2026-04-26

| Tarea | Tipo | Descripción | Resolución |
|---|---|---|---|
| Task 3.A.3 | note | Plan referenced `IKondixDbContext.cs` but actual filename is `ICelvoGymDbContext.cs` (legacy from gym→kondix rename). The interface declared inside is correctly named `IKondixDbContext`. Implementer used the right file. | Resolved (commit `8ea75160`). Follow-up: rename file to `IKondixDbContext.cs` opportunistically. |
| Task 3.A.4 | deviation | Plan's verification bullet said `set_logs.notes (text NULL)` but the EF `HasMaxLength(2000)` configured in 3.A.3 generates `varchar(2000) NULL`. Functionally equivalent in PostgreSQL (varchar(N) is constrained text). | Resolved as-is (commit `c7b98eeb`). Plan wording was self-inconsistent; the migration matches the EF config. |
| Task 3.A.7 | note | Plan-vs-actual enum-name verification: `ProgramAssignmentStatus` / `ProgramAssignmentMode` / `pa.EndDate` / `pa.Mode` all matched the actual entity (the generic `.claude/rules/backend-domain.md` lists looser names — informal). No drift to fix. | Resolved (commit `06664c14`). |
| Task 3.A.7 | deviation | The new `WorkoutSessionDto` returned by `CompleteSessionHandler` carries only `(Id, RoutineId, DayId, StartedAt, CompletedAt, Notes)` — no Duración / Sets / Volumen / PRs stats. The pre-existing `workout-complete.ts` displayed stats from this response; with the simplified DTO the stat cards now show `—`. Plan accepted the simplification because mood capture moved the screen from "auto-complete then redirect" to "user-driven submit". | Resolved with downstream impact in 3.C.4 (commit `444382c3`); follow-up: re-add stats via a separate `GET /sessions/{id}/summary` if MVP feedback flags it. |
| Task 3.A.8 | note | Plan referenced `src/Kondix.Application/Commands/Sessions/UpdateSetDataCommand.cs` but actual file lives in `Commands/Progress/`. Implementer used the right path; the response DTO `UpdateSetDataResponse` was added to `Application/DTOs/SessionDtos.cs` per plan. | Resolved (commit `432d2b37`). |
| Task 3.A.8 | deviation | Plan listed only one stub unit test for the PR-inline behavior. Implementer wrote 4 (no-PR path, PR-detected path, exercise-name mismatch, swallowed-failure path) and used NSubstitute to stub `IMediator` — `DetectNewPRsCommand` only fires for `Completed=true` set logs, but `UpdateSetDataCommand` never sets that flag, so a real-DB test could not exercise the PR-found branch. | Resolved (commit `432d2b37`). Coverage tightened beyond plan minimum. |
| Task 3.A.10 | deviation | Plan code shows `RequirePermission("kondix:students:read")` as a bare method call inside the controller; the actual helper is an extension method on `HttpContext` (`HttpContext.RequirePermission(...)`). Implementer used the actual signature. | Resolved (commit `3e028265`). |
| Task 3.A.10 | deviation | Adding `using Kondix.Application.Queries.Analytics;` to `StudentsController.cs` triggered an ambiguity with `Kondix.Application.Queries.Students` (both contain `GetStudentOverviewQuery`). Resolved with a namespace alias `using Analytics = Kondix.Application.Queries.Analytics;` and qualifying the call as `Analytics.GetRecentFeedbackQuery(id)`. | Resolved (commit `3e028265`). |
| Task 3.B.2 | deviation | `[class.bg-primary/10]="..."` does not parse — Angular's class binding key parser rejects forward slashes. Replaced with `[style.backgroundColor]="value() === m.value ? 'rgba(230,38,57,0.10)' : null"`. | Resolved (commit `49c752f8`). Pattern recurred in 3.B.5 / 3.D.* — `[class.X]` accepts simple Tailwind classes only; for opacity-modifier strings (`bg-primary/10`), use `[style.*]` or `[ngClass]` array form. |
| Task 3.B.5 | deviation | Three template adaptations: (a) `[class.shadow-[0_0_16px_rgba(...)]]` → `[style.boxShadow]` (Angular's `[class.X]` rejects square brackets in the key); (b) `[class.bg-primary/15]` + `[class.text-primary]` → `[ngClass]` array form (slash issue); (c) the `formatSpanishDate` import the plan listed was unused, dropped (TS strict `noUnusedLocals`). Imported `NgClass` from `@angular/common`. | Resolved (commit `40e964bf`). |
| Task 3.C.1 | deviation | The plan called for `this.api.patch(...)` but `ApiService` had no `patch<T>` method. Implementer added it (`http.patch` with `withCredentials: true`) rather than degrading to `post`. Also pre-staged the `UpdateSetDataResponse` interface in this commit (used in 3.C.3) since both touched the same `models/index.ts`. | Resolved (commit `be0f4075`). |
| Task 3.C.3 | deviation | Plan's TS `NewPrDto` listed `reps: string \| null`, but the server-side `NewPrDto` in `Kondix.Application/DTOs/PersonalRecordDtos.cs` is `(string ExerciseName, string Weight, string? PreviousWeight)` — no `Reps` field. Implementer kept the TS interface aligned with the server contract; `toast.showPR(name, weight, null)` passes `null` for reps. | Resolved (commit `6ec2d20f`). Future enhancement: extend the server DTO with `Reps` if the toast wants reps detail; until then the toast shows weight only. |
| Task 3.C.4 | deviation | The pre-existing `workout-complete.ts` auto-called `POST /sessions/{id}/complete` (no-mood, no-notes) on `ngOnInit`. Removed that auto-call so the user explicitly commits via "Finalizar". Side effect: stat cards (Duración / Sets / Volumen / PRs) now show `—` until Finalizar lands the response (and per the 3.A.7 note above, that response no longer carries stats anyway — they show `—` permanently). Navigation target also adjusted from `/workout/home` → `/student/home` per plan. | Resolved (commit `444382c3`). UX follow-up: a `GET /sessions/{id}/summary` endpoint would restore the stat cards. |
| Task 3.D.1 / 3.D.2 / 3.D.3 / 3.D.6 | deviation | Plan's `KxSegmentedControl` invocations used `[options]="[{value, label}, ...]"` shape, but the actual component takes `string[]` of labels with a `selected: string` value and emits `selectedChange: string`. Implementer adapted via `LABEL_TO_TAB`/`LABEL_TO_FILTER` reverse-maps and `selectedTabLabel`/`selectedLabel` `computed()` signals. | Resolved (commits `91845f56`, `03384db9`, `bec01c09`). Follow-up: extend `<kx-segmented-control>` to accept `{value, label}[]` natively as a Phase 4/5 visual-polish task. |
| Task 3.D.6 | deviation | Plan said "compare `SetLog.ActualWeight` against `PersonalRecord.Weight` for the matching exercise name and mark the highest as `isPR=true`" — concrete rule chosen: per (session, exercise) group, parse `ActualWeight` strings, find max; if max ≥ existing PR weight, mark **only the first set at that max weight** as PR (avoid spamming PR badges on every set at the same weight). Name match is case-insensitive vs `SnapshotExerciseName`. | Resolved (commit `bec01c09`). |
| Task 3.D.6 | deviation | `Status` field of `TrainerSessionDto` mapped to MVP rule: `"completed"` if `CompletedAt != null`, else `"partial"`. The `"missed"` value is valid in the TS union but unused server-side; defining a time-based threshold (e.g., 24h after StartedAt) was out of scope. | Resolved (commit `bec01c09`). |
| Task 3.D.6 | note | `Exercise` entity has no `MuscleGroup`/`ImageUrl` directly — those live on `Exercise.CatalogExercise`. Query projects via `e.CatalogExercise != null ? e.CatalogExercise.MuscleGroup : null` (left join). Plan was loose on this. | Resolved (commit `bec01c09`). |
| Task 3.D.7 | deviation | Plan said "lift the existing private notes panel" but no frontend panel existed — only the backend (`TrainerNote` domain entity, `Get/Create/Update/DeleteNote` handlers, REST routes `/api/v1/students/{id}/notes`) plus a TS `TrainerNoteDto`. Implementer built the full panel from scratch: list with pinned-first sort, add/edit form with pin toggle, delete with `<kx-confirm-dialog>` confirmation, toasts on mutations. Not a plan defect — the spec/plan implicitly assumed the UI existed. | Resolved (commit `3ba0a906`). The Notas tab is now functional, not just a stub. |

---

**Phase 3 closeout (2026-04-26):**
- 26 tasks complete in 26 commits + 1 closeout-doc commit + 2 post-review fix commits = **29 commits across `feat/v2-phase-3`**. Sub-phase split: 3.A backend (10 commits), 3.B UI (6 commits), 3.C student-side (4 commits), 3.D trainer drawer (6 commits), closeout (1 doc), post-review fixes (2 commits).
- 18 deviations + 2 post-review fixes logged above and below (all approved by per-task and final phase-wide reviews).
- Final phase-wide review (final code-reviewer subagent) flagged 1 critical (missing trainer-student ownership check on `GetRecentFeedbackQuery` + `MarkFeedbackReadCommand`) and 1 important (dead stat-loading code in `workout-complete.ts onFinish()` that the user never saw populate). Both fixed pre-merge:
  - `dd1ee433 fix(security): trainer ownership checks on recent-feedback + mark-read` — added `TrainerId` to both records, ownership guard via `TrainerStudents.AnyAsync(...)` at the top of each `Handle()`, mirroring the existing pattern in `GetStudentSessionsForTrainerQuery`. Updates `StudentsController` to pass `HttpContext.GetTrainerId()`. Added 3 unit tests (1 fact updated to seed link + pass trainer; 2 new — happy-path mark-read + unauthorized throws).
  - `68370981 fix(student): drop dead stat-loading code on workout-complete` — removed 145 lines of stat-card markup, supporting signals (`durationLabel`, `completedSets`, `totalSets`, `totalVolume`, `prs`), and methods (`handleSession`, `loadPrsAndStats`). The screen now only renders celebration + mood picker + notes textarea + Finalizar. Stat-card restoration is a documented carryover for a future `GET /sessions/{id}/summary` endpoint.
- Tests green at branch tip (post-fixes):
  - .NET: **54 specs** (36 unit + 8 arch + 10 integration). Up from 38 pre-phase (+16 unit specs: 3 UpdateSetNote + 3 UpsertExerciseFeedback + 2 CompleteSession + 4 UpdateSetData + 1+1 GetRecentFeedback (happy + unauth) + 2 MarkFeedbackRead (happy + unauth)).
  - Angular Karma: **10 specs** (7 youtube + 3 toast — unchanged; this phase added components but no new specs since plans skip Karma per project memory).
- New surfaces shipped:
  - **Student logging screen**: per-set 💬 note toggle, exercise feedback modal (RPE + notes) on last set, inline 🏆 PR toast from the `sets/update` response.
  - **Workout-complete screen**: mood picker (4 emojis) + notes textarea + explicit "Finalizar" button (replaces auto-complete-on-init).
  - **Trainer student drawer**: 4-tab split (Resumen / Programa / Progreso / Notas) with badge count on Progreso when feedback is unread, banner CTA on Resumen, full session timeline with mood / RPE chips / set chips / PRs / per-exercise notes / session notes, and a complete trainer-private-notes CRUD panel. New backend endpoint `GET /api/v1/students/{id}/sessions` powering the timeline.
- Backend additive migration `20260426234130_AddSessionAndSetFeedbackFields` lands: `set_logs.notes`, `workout_sessions.{mood,feedback_reviewed_at}`, partial index, new `exercise_feedback` table. **Not yet applied to prod** — `dotnet ef database update` against prod must run as part of the next deploy. No backfill required.
- Carryover items to address opportunistically:
  - Rename `src/Kondix.Application/Common/Interfaces/ICelvoGymDbContext.cs` → `IKondixDbContext.cs` (legacy filename; interface inside is already correct).
  - Extend `<kx-segmented-control>` to natively accept `{value, label}[]` and drop the `LABEL_TO_*` reverse-maps in `student-detail.ts` and `student-detail-progress.ts` (Phase 4/5 visual-polish task).
  - Restore stat cards on the workout-complete screen (Duración / Sets / Volumen / PRs) by either (a) re-extending `WorkoutSessionDto` with stats or (b) adding a `GET /sessions/{id}/summary` endpoint.
  - Extend `NewPrDto` server-side with `Reps: string?` if the PR toast should display reps too — TS interface and `toast.showPR(name, weight, reps)` are already wired for it.
  - `<kx-video-demo-overlay>` + `<kx-confirm-dialog>` Esc-key close + focus management (Phase 2 carryover, still pending).
- The Phase 4 (Recovery system) plan starts at line 4078 of `2026-04-26-kondix-v2-implementation.md` and is the next session's target.

## Phase 4 — Recovery system

_Branch:_ `feat/v2-phase-4`
_Started:_ 2026-04-26

| Tarea | Tipo | Descripción | Resolución |
|---|---|---|---|
| Task 4.1 | deviation | Plan said EF config var `b`; existing `WorkoutSessionConfiguration.cs` uses `builder`. Implementer kept `builder` for in-file consistency. | Resolved (commit `95e86847`). |
| Task 4.2 | note | Migration name was `20260427011850_AddSessionRecoveryFields`. Adds `is_recovery boolean NOT NULL DEFAULT false`, `recovers_session_id uuid NULL`, self-FK with `ON DELETE SET NULL`, auto-index on FK. Wrapped in single transaction. **Additive only**, prod-safe with no downtime. | Resolved (commit `aaccad49`). Apply via `dotnet ef database update` on next deploy. |
| Task 4.3 | deviation | Plan's seed had `DurationWeeks = 8` on `ProgramAssignment` — that property does NOT exist on the entity. Removed from the test helper. Plan's "pick the routine" stub also used `OrderBy(pr.SortOrder).FirstOrDefault()` for both modes; actual rotation logic uses `RotationIndex % allDays.Count` flattened over `(ProgramRoutine, Day)` tuples; Fixed mode deserializes `FixedScheduleJson` → `List<FixedScheduleInput>` and matches `entry.Days.Contains(dow)`. Implementer extracted `FindRoutineForDay` to mirror `GetNextWorkoutHandler` exactly. Wrote 6 unit tests (plan listed only 1). | Resolved (commit `93b3971d`). |
| Task 4.4 | deviation (CRITICAL plan defect) | Plan said `StartSessionCommand` should accept `Guid? RecoversSessionId` referencing the missed session — but Task 4.3 returns `PlannedDate: DateOnly`, NOT a session id. There is no real `WorkoutSession` row for a missed-but-never-started day. Implementer changed the parameter to `DateOnly? RecoversPlannedDate`. Validation rules adapted: window check, training-day check, no-completed-session, no-existing-recovery (mirroring `GetMissedSessionQuery`'s "honored" predicate). Wrote 9 new unit tests covering all paths. | Resolved (commit `4abccd31`). The `WorkoutSession.RecoversSessionId` self-FK column is **vestigial in MVP** — kept in schema as a placeholder for future "redo a completed session" flows. XML doc on the entity property added in `f3f6b64a` post-review polish. |
| Task 4.5 | note | Endpoint trivial: `GET /public/my/missed-sessions` returns `204 NoContent` when the query yields null, else `200 OK` with `RecoverableSessionDto`. | Resolved (commit `ac913bc3`). |
| Task 4.6 | note | `<kx-recovery-banner>` static template; the only "tricky" parts are the `dayLabel()` (`weekday: 'long'` from `plannedDate`) and the `deadlineLabel()` computed via millisecond diff. Note: `deadlineLabel()` uses `new Date(iso)` which parses as UTC; `setHours(0,0,0,0)` shifts to local midnight — slightly timezone-fragile near midnight (Carryover note below). | Resolved (commit `2b4821b7`). |
| Task 4.7 | deviation | Plan said "green tint plus rotate-ccw icon overlay" for the `'recovered'` state. Implementer chose **amber/warning** (matching the banner's warning palette and reinforcing the "make-up workout" semantic) rather than green (which would clash with `'completed'`). 4 visual cues stacked: amber-dark bg + amber border + amber number + amber dot + corner rotate-ccw icon. | Resolved (commit `39ebf247`). |
| Task 4.8 | deviation | Plan's frontend code in 4.8 had `recoversSessionId: m.plannedDate` — type-mismatched (string in a Guid slot). Fixed to `recoversPlannedDate: m.plannedDate` per the 4.4 design choice. The plan's calendar wiring also assumed `CalendarDayDto.isRecovery` existed; it didn't. Extended `CalendarDayDto` (server) + `CalendarDayDto` TS interface (frontend) with `IsRecovery: bool` and updated `GetCalendarQuery` projection. | Resolved (commit `d07ca2e8`). |
| Task 4.8 | note | Calendar paints the recovery DAY as `'recovered'` (where the session actually occurred), NOT the originally-missed planned day. Without a `RecoversPlannedDate: DateOnly?` field on `WorkoutSession`, the link from a recovery session back to the missed planned day is not stored. Carryover below. | Resolved as MVP-acceptable (commit `d07ca2e8`). |

---

**Phase 4 closeout (2026-04-27):**
- 8 tasks complete in 8 commits + 2 post-review fix commits = **10 commits across `feat/v2-phase-4`** (no separate closeout-doc commit; the closeout addendum is folded into this log update). Sub-phase split: backend (5 commits 4.1–4.5), UI components (2 commits 4.6/4.7), integration (1 commit 4.8), post-review fixes (2 commits).
- 9 deviations + 2 post-review fixes logged above (all approved by per-task and final phase-wide reviews).
- Final phase-wide review flagged 1 critical (Recuperar button navigated to a non-existent route — feature was end-to-end broken) and 3 polish items. All fixed pre-merge:
  - `1ebbdb50 fix(student): route Recuperar to the new session via query param` — the previous navigation went to `/student/workout/exercise/:id/0` which doesn't exist (route prefix is `/workout/...`, exercise route is `session/exercise/:index`). Fixed: navigate to `/workout/session/overview` with `sessionId` + `routineId` + `dayId` query params. `WorkoutOverview` now branches: when those params are present, skip `GET /next-workout` (which would return today's scheduled workout, not the recovery), call `GET /public/my/routines/{id}` directly, build a synthetic `NextWorkoutDto` with `currentWeek=0`. The user lands on the correct recovery session.
  - `f3f6b64a fix(misc): Phase 4 review polish (predicate consistency, banner gating, RecoversSessionId doc)` — three things: (a) added `&& s.ProgramAssignmentId == assignment.Id` to `GetMissedSessionQuery.Handle()` to align the "honored" predicate with `StartSessionCommand`'s validation; (b) gated the home-screen banner on `!loading()` so it doesn't appear during the loading skeleton; (c) added an XML doc on `WorkoutSession.RecoversSessionId` documenting it as a vestigial field reserved for future flows.
- Tests green at branch tip (post-fixes):
  - .NET: **69 specs** (51 unit + 8 arch + 10 integration). Up from 54 post-Phase-3 (+15 unit specs: 9 StartSession recovery + 6 GetMissedSession; the `AlreadyRecovered_Returns_Null` test was updated to reflect the predicate consistency fix).
  - Angular Karma: **10 specs** (unchanged; no new specs added — see carryover below).
- New surfaces shipped:
  - **Student home**: amber `<kx-recovery-banner>` appears at the top after loading skeleton clears, when there is a recoverable session in the 2-day window. Saltar dismisses, Recuperar starts a new session and routes the user to the workout overview for that session.
  - **Student calendar**: day cells show the new `'recovered'` state for completed recovery sessions; "Recuperado" added to the legend.
  - **Backend API**: `GET /api/v1/public/my/missed-sessions` (204 if none, else `RecoverableSessionDto`); `POST /api/v1/public/my/sessions/start` extended with optional `recoversPlannedDate: DateOnly?`.
- Backend additive migration `20260427011850_AddSessionRecoveryFields` lands: `workout_sessions.{is_recovery, recovers_session_id}` + self-FK + index. **Not yet applied to prod** — combine with the Phase 3 migration `20260426234130_AddSessionAndSetFeedbackFields` on the next `dotnet ef database update`. No backfill required for either.
- Carryover items to address opportunistically:
  - **Calendar's missed-day painting**: to paint the originally-missed planned day as `'recovered'` (linking back), add `RecoversPlannedDate: DateOnly?` field on `WorkoutSession` and bump migration #3. MVP currently paints only the recovery day.
  - **Banner timezone fragility**: `<kx-recovery-banner>.deadlineLabel()` uses `new Date(iso)` which parses as UTC; `setHours(0,0,0,0)` then shifts to local midnight — off-by-one near midnight in westerly timezones. Replace with `parseLocalDate()` from `shared/utils/format-date.ts`.
  - **Rotation mode mislabel for 2-days-ago**: when both yesterday AND 2-days-ago were training days and yesterday was missed, the routine offered for 2-days-ago would use the current `RotationIndex` (correct for yesterday, off-by-one for 2-days-ago). The "most recent missed first" return order de-risks this in practice. A comment or TODO would suffice; current code is silent.
  - **Frontend specs for `<kx-recovery-banner>.deadlineLabel()`** and the day-cell expanded state classifier — modest tests would pin both timezone fragility and the recovered-state visual, per project memory `skip_playwright_e2e_for_now.md` (Playwright paused — Karma still acceptable).
  - **`<kx-day-cell>` recovered state visual heaviness**: 4 stacked amber cues. Acceptable for a low-frequency MVP event; trim to 2-3 for future polish.
  - **Carry-over from Phase 3 still pending**: rename `ICelvoGymDbContext.cs` → `IKondixDbContext.cs`; extend `<kx-segmented-control>` to accept `{value, label}[]`; restore stat cards on workout-complete via `GET /sessions/{id}/summary`; extend server `NewPrDto` with `Reps`; `<kx-video-demo-overlay>` Esc-key close.
- The Phase 5 (Programs editor refresh — CDK D&D + week overrides) plan starts at line 4547 of `2026-04-26-kondix-v2-implementation.md` and is the next session's target.

## Phase 5 — Programs editor refresh (CDK D&D + week overrides)

_Branch:_ `feat/v2-phase-5`
_Started:_ 2026-04-26

| Tarea | Tipo | Descripción | Resolución |
|---|---|---|---|
| Task 5.1 | note | `npm install @angular/cdk@21` resolved to `^21.2.8` (matches `@angular/core ^21.2.6`). Build clean before any code-using-CDK landed. | Resolved (commit `c6bf7bbb`). |
| Task 5.2 | deviation | Plan EF config used `b`; existing codebase uses `builder` (same as Phase 4 Task 4.1). Kept `builder`. Added `gen_random_uuid()` and `NOW()` defaults to mirror `ProgramConfiguration` (plan omitted them). Did NOT add `ToTable(...)` — snake-case + `HasDefaultSchema("kondix")` already produces `kondix.program_week_overrides`. | Resolved (commit `3c322624`). |
| Task 5.2 | decision | Applied the long-standing Phase 3 carryover in the same commit: renamed `src/Kondix.Application/Common/Interfaces/ICelvoGymDbContext.cs` → `IKondixDbContext.cs` via `git mv` (95% similarity rename detected). The interface name was already correct; only the file was stale. Confirmed no remaining string references to `ICelvoGymDbContext` in `**/*.cs` or `**/*.ts`. | Resolved (commit `3c322624`). |
| Task 5.3 | note | Migration name `20260427024952_AddProgramWeekOverrides`. Single `CreateTable` + cascade FK to `programs` + UNIQUE index on `(program_id, week_index)`. Additive only, prod-safe, no backfill. **Migration #3** of the v2 series. | Resolved (commit `d9d94b2d`). |
| Task 5.4 | deviation | Plan listed 2 unit tests; implementer wrote **5** to cover all 5 distinct branches (insert / update / delete-on-empty-with-existing / delete-on-whitespace / no-op-on-empty-with-no-existing). TDD discipline: tests written first (RED with CS0246 missing types), then handler+query implemented (GREEN). | Resolved (commit `9344c7c0`). |
| Task 5.5 | deviation | Plan said `RequirePermission("kondix:programs:read")` / `("kondix:programs:write")` — those constants don't exist in `Permissions` and aren't registered in CelvoGuard. Used `Permissions.GymManage` (`"kondix:manage"`) for both endpoints, matching every other endpoint in `ProgramsController`. Logged inline in commit message. | Resolved (commit `83abed3f`). |
| Task 5.6 | decision (CRITICAL design choice) | Plan was ambiguous on whether the new D&D weekly grid REPLACES the existing rotation-slots editor (Option B) or SUPPLEMENTS it (Option A). Chose Option A: the existing slots editor remains the source of truth for `ProgramRoutine[]` persistence; the grid is a planning visualization; per-week notes ARE persisted via the new endpoint. Rationale: Option B would silently destroy the trainer's grid arrangement on every save/reload (the cell layout isn't part of the persistence shape), and the plan/spec literally say "the grid is purely a UI layer; persisted state stays as the existing program-routine ordered list". Documented in code, in the Spanish "Planificación semanal" section header copy, and in `program-form.ts` inline comments. | Resolved (commit `cb87ccc9`). |
| Task 5.6 | deviation | `durationWeeks` kept as a plain field (not a signal) because `[(ngModel)]` doesn't bind to signals cleanly. Used an explicit `resizeGrid()` method called from `ngOnInit`, `onDurationChange`, and `loadProgram` instead of an `effect()`. Sidebar one-way: `[cdkDropListSortingDisabled]="true"` and cells' `connectedTo` excludes the sidebar id (drag from cell back to sidebar is a no-op). Added a `clearCell` ✕ button as the necessary remove-from-cell affordance Option A's design implies. Added a "Planificación semanal" section header explaining the dual-model (slots = persisted, grid = planning aid). | Resolved (commit `cb87ccc9`). |
| Task 5.6 | incident (per-task review) | Per-task code-quality reviewer (after spec ✅) found 1 important bug + 3 polish: (a) **same-week swap broken** — when both source and target cell were in the same week, the two-branch `weeklyGrid.update(grid.map(...))` caused only one assignment to survive, so dragging from cell (5,1)=A to cell (5,4)=B left cell (5,1) overwritten and cell (5,4) unchanged. Fix: special-case `srcWeek === weekIndex` with a single-pass `days[]` rebuild before the cross-week branch. (b) Three CDK helpers (`moveItemInArray`, `transferArrayItem`, `copyArrayItem`) imported but only `void`-referenced — dead imports defeating tree-shaking. Removed both the imports and the void stubs. (c) `onOverrideBlur` race: out-of-order success/error responses could corrupt local state or show misleading toasts. Added per-week sequence (`overrideSeq: Map<number, number>`); both `next` and `error` early-return with `overrideSeq.get(weekIndex) !== seq` guards. (d) `loadOverrides` had no error handler — added a toast on GET failure. | Resolved (commit `b4076540`). |
| Phase-wide | incident (CRITICAL plan defect — final review) | Final phase-wide code-quality reviewer caught **the same class of regression Phase 3 caught on `GetRecentFeedback`/`MarkFeedbackRead`**: both new program-week-override endpoints (`UpsertProgramWeekOverrideCommand`, `GetProgramWeekOverridesQuery`) lacked trainer-ownership scoping. Trainer A could read or overwrite trainer B's per-week notes by guessing a program GUID — same impact tier as the Phase 3 leak. Fix mirrors the Phase 3 pattern exactly: `TrainerId` added to both records, `db.Programs.AnyAsync(p.Id && p.TrainerId)` ownership check at the top of each handler (throws `"Program not found"`), `ProgramsController` passes `HttpContext.GetTrainerId()`. 5 existing Upsert tests updated to seed `TrainerId` + pass it; 1 new Upsert ownership test; 1 new `GetProgramWeekOverridesQueryHandlerTests.cs` file with 2 tests (happy-path ordering + ownership). | Resolved (commit `301db71d`). **Plan-defect category to elevate for Phase 6:** every new MediatR handler that takes a resource ID belonging to a trainer/student must accept the corresponding `TrainerId`/`StudentId` and verify ownership before any other DB op. Two phases in a row missed this — make it a hard pre-merge checklist item. |

---

**Phase 5 closeout (2026-04-27):**
- 6 tasks complete in 6 task commits + 2 post-review fix commits = **8 commits across `feat/v2-phase-5`**. Sub-phase split: dependency (1 commit 5.1), backend (4 commits 5.2-5.5), UI (1 commit 5.6), per-task review fixes (1 commit), final phase-wide review fix (1 commit). No separate closeout-doc commit — the closeout addendum is folded into this log update.
- 8 deviations + 1 decision + 1 per-task incident + 1 phase-wide CRITICAL incident logged above (all approved by per-task and final phase-wide reviews after fixes).
- Tests green at branch tip (post-fixes):
  - .NET: **77 specs** (59 unit + 8 arch + 10 integration). Up from 69 post-Phase-4 (+8 unit specs: 5 from Task 5.4 covering all 5 handler branches + 1 Upsert ownership test from the security fix + 2 in the new `GetProgramWeekOverridesQueryHandlerTests.cs`).
  - Angular Karma: **10 specs** (unchanged; this phase added behavioral FE code but no specs — consistent with Phases 3/4 posture per project memory `skip_playwright_e2e_for_now.md`).
  - Build: 0 warnings, 0 errors. `program-form` lazy chunk grew from 11.39 kB → 81.08 kB raw / 3.39 kB → 20.08 kB transfer (+16.7 kB transfer for `@angular/cdk/drag-drop` — within the spec's ~30 kB budget).
- New surfaces shipped:
  - **Backend API**: `GET /api/v1/programs/{id}/week-overrides` (returns ordered list of `ProgramWeekOverrideDto`); `PUT /api/v1/programs/{id}/week-overrides/{weekIndex}` (body `{ notes }`; empty/whitespace deletes the row server-side). Both gated by `Permissions.GymManage` + trainer-ownership check on the program.
  - **Programs editor (`program-form.ts`)**: kept the existing rotation-slots editor as `ProgramRoutine[]` source of truth; ADDED a CDK Drag&Drop weekly grid (sidebar of trainer routines + 7-col × N-week grid where N = `durationWeeks`) for visual planning, plus a per-week notes input that PUTs to `/week-overrides/{weekIndex}` on blur with per-week sequence guards against out-of-order responses.
  - **File rename**: `ICelvoGymDbContext.cs` → `IKondixDbContext.cs` (Phase 3 carryover landed).
- Backend additive migration `20260427024952_AddProgramWeekOverrides` lands: `kondix.program_week_overrides` table with `id` (uuid + `gen_random_uuid()` default), `program_id` (uuid + cascade FK to `programs`), `week_index` (int), `notes` (varchar 2000 not null), `created_at` (timestamptz + `NOW()` default), and UNIQUE index on `(program_id, week_index)`. **Not yet applied to prod** — this is **migration #3** of the v2 series; combined with #1 `20260426234130_AddSessionAndSetFeedbackFields` (Phase 3) and #2 `20260427011850_AddSessionRecoveryFields` (Phase 4), all three should be applied together on the next `dotnet ef database update`. No backfill required for any of them.
- **Plan-defect categories that recurred** (forward-looking — log for Phase 6 reviewer attention):
  - **Resource-ownership scoping is the most-frequently-missed Application-layer gate.** Phase 3 caught it on feedback handlers; Phase 5 caught it again on week-override handlers. Make it a pre-implementer-dispatch checklist: for every new MediatR command/query that takes a `Guid` resource id, the implementer prompt must explicitly call out the ownership predicate and require a unit test asserting "foreign caller throws".
  - **Plan code stubs reference handlers/types/files by aspirational names**: `IKondixDbContext.cs` (was `ICelvoGymDbContext.cs`), `kondix:programs:read/write` (don't exist; only `Permissions.GymManage` does), the bare `RequirePermission(...)` form (actual is the `HttpContext`-extension method). Implementer prompts continue to need the "verify file paths and constants by `Grep` before quoting plan code verbatim" reminder.
  - **TDD coverage > plan minimum**: Plan keeps listing 1-2 unit tests per handler; implementers consistently extend to 4-5 to cover all branches. This is good (Phase 3, 4, 5 all did it) — leave it implicit but don't trim.
- Carryover items to address opportunistically (rolling list updated):
  - **Accessibility on the weekly grid**: no keyboard alternative to D&D (mouse-only); drop zones lack `role`/`aria-label`; `<th>` lacks `scope="col"`/`scope="row"`; disabled notes inputs in create mode could use a `title` tooltip ("Disponible después de guardar"). Bundle for the visual-polish phase.
  - **Perf nit**: `allListsExcept(week, day)` is called per-cell per-render and filters `cellLists()` (`computed<string[]>`). At the 52-week ceiling = ~130k string ops per render = ~3 ms in Chrome. Not perceptible today; if it ever feels sluggish, precompute a `Map<string, string[]>` once per `weeklyGrid` change.
  - **Stale-success path doesn't clear `savingNotes` directly** (the LATEST request will clear it when it settles, so no user-visible bug). Asymmetric with the stale-error branch. Tidy on next pass through this file.
  - **`<kx-program-week-grid>` extraction**: don't split `program-form.ts` (now 629 lines) yet. Extract only when (a) cell layout becomes persistent OR (b) a second consumer needs the grid (e.g., read-only on the program detail page).
  - **Carryovers still pending from earlier phases**: extend `<kx-segmented-control>` to natively accept `{value, label}[]` and drop the `LABEL_TO_*` reverse-maps in `student-detail.ts` + `student-detail-progress.ts`; restore stat cards on workout-complete via `GET /sessions/{id}/summary`; extend server `NewPrDto` with `Reps: string?`; `<kx-video-demo-overlay>` + `<kx-confirm-dialog>` Esc-key close + focus management; paint missed planned day as `'recovered'` on the calendar (needs `RecoversPlannedDate: DateOnly?` field on `WorkoutSession` + a 4th migration); fix `<kx-recovery-banner>.deadlineLabel()` timezone fragility via `parseLocalDate()`; rotation-mode mislabel for 2-days-ago.
  - **Three pending migrations not yet applied to prod**: `20260426234130_AddSessionAndSetFeedbackFields` (Phase 3) + `20260427011850_AddSessionRecoveryFields` (Phase 4) + `20260427024952_AddProgramWeekOverrides` (Phase 5). Apply together on the next `dotnet ef database update`. No backfill required for any.
- The Phase 6 (Library polish + docs) plan starts at line 5003 of `2026-04-26-kondix-v2-implementation.md` and is the next session's target.

---

## Phase 6 — Library polish + docs

_Branch:_ `feat/v2-phase-6`
_Started:_ 2026-04-27

| Tarea | Tipo | Descripción | Resolución |
|---|---|---|---|
| Task 6.1 | decision | Plan said "compare catalog editor against `design_handoff_kondix_v2/prototypes/trainer/view-library.jsx` and tweak if needed". Static comparison: handoff prototype assumes a richer `CatalogExercise` model (`equipment`, `category`, `level`, `secondaryMuscles`, `timesUsed`) that the current backend doesn't carry — and the handoff's `MUSCLE_GROUPS` select differs from the current free-text `muscleGroup` input. Adding those fields is a backend-schema change clearly out of scope for a docs-and-polish phase. Within the actual model, `catalog-list.ts` already aligns with v2 patterns (uses `<kx-exercise-thumb>` with muscle-tinted fallback, has YouTube/Upload video toggle, hover-to-delete affordance). | **No-op commit** per plan's "skip if no changes" rule. Field-richer editor is documented as a future v2.1 candidate. |
| Task 6.2 | deviation | Plan listed 4 gotchas (PR detection inline, idempotent CompleteSession, recovery sessions advance rotation, kondix-videos bucket missing). Implementer added 8 more — drawn from the v2 phase logs — covering: the recovery model semantic (`RecoversPlannedDate` not `RecoversSessionId`), the recurring trainer-ownership-scoping pattern (Phase 3 + Phase 5 leak class), the three pending prod migrations, the `Permissions.GymManage` reality (only constant), the per-week notes endpoint + grid-as-planning-visualization design, the `@angular/cdk` lazy-only constraint, and the `ICelvoGymDbContext.cs → IKondixDbContext.cs` rename. Also marked the `<kx-set-row>` note-toggle and `<kx-day-cell>` `'recovered'` modifications inline rather than appending separate "modified" bullets. | Resolved (commit `3e0709ea`). |
| Task 6.3 | deviation | Plan said "append the same component list plus implementation notes (sizes, signal patterns, OnPush behavior). Brief — design reference, not docs." Implementer added a structured table per component (sizes / signal API / animations) plus separate sub-sections for v2-modified components, v2 tokens, v2 utility surfaces, and "not components" notes. Slightly more than "brief" but the table format reads cleanly and surfaces the per-component shape in one glance. | Resolved (commit `ba26b36e`). |
| Task 6.4 | note | Plan referenced `setup/03-deploy-checklist.md`; actual file is `setup/04-deploy-checklist.md` (slot 03 is `minio-bucket.sh`). Same discrepancy noted in Phase 1.5 log. Implementer used the right file and added 3 sanity-check curls (recent feedback / week-overrides / missed-sessions) on top of the migration + dep section the plan asked for. | Resolved (commit `5cc72a69`). |

---

**Phase 6 closeout (2026-04-27):**
- 4 tasks complete in **3 commits across `feat/v2-phase-6`** (Task 6.1 was a no-op per plan; 6.2 / 6.3 / 6.4 each one commit). No code changes — pure documentation phase.
- 4 deviations logged above (all approved inline; no per-task or phase-wide reviewer dispatched — docs phase, all changes verifiable by reading the diff).
- Tests green at branch tip (sanity check; no test changes possible since no code touched):
  - .NET: **77 specs** (59 unit + 8 arch + 10 integration). Unchanged from Phase 5.
  - Angular Karma: **10 specs**. Unchanged.
  - Build: 0 warnings, 0 errors.
- New surfaces shipped: none (docs only).
  - Root `CLAUDE.md` now lists the 8 new v2 components, the 2 modified v2 components, and 12 v2-relevant gotchas.
  - `kondix-web/.impeccable.md` now has a "v2 Component Inventory" section with per-component sizes / signal API / animations table + v2 token + utility notes.
  - `setup/04-deploy-checklist.md` now has a "v2 deploy" section with the three pending migrations, the `@angular/cdk` dep impact, and three sanity-check curls.
- **No backend migrations in this phase.** The three pending prod migrations from Phases 3/4/5 still need `dotnet ef database update` on the next deploy.
- This was the **LAST phase of the v2 plan**. After merge, the v2 implementation effort is complete.

---

## ▶ KONDIX v2 — DONE (2026-04-27)

_Plan:_ `docs/superpowers/plans/2026-04-26-kondix-v2-implementation.md` (6 phases + Phase 1.5 = 7 phase branches across 2026-04-26/27).

**Final state:**
- **8 phase branches** merged to `main` via `--no-ff`: `feat/v2-phase-1`, `feat/v2-phase-1-5`, `feat/v2-phase-2`, `feat/v2-phase-3`, `feat/v2-phase-4`, `feat/v2-phase-5`, `feat/v2-phase-6`. All pushed to `origin/main`.
- **Backend tests at v2 tip:** 77 (59 unit + 8 arch + 10 integration). Up from baseline.
- **Frontend Karma specs:** 10 (unchanged across v2 — see "skip Karma per project memory" stance).
- **Three additive prod migrations pending**: `20260426234130_AddSessionAndSetFeedbackFields` (Phase 3) + `20260427011850_AddSessionRecoveryFields` (Phase 4) + `20260427024952_AddProgramWeekOverrides` (Phase 5). Apply together on next `dotnet ef database update`. No backfill.
- **One frontend dep added**: `@angular/cdk@^21.2.8` (lazy-loaded in `program-form` chunk only).
- **No new env vars** since Phase 1.5's `Internal__ApiKey`.
- **`kondix-videos` MinIO bucket** still NOT provisioned in prod — YouTube embeds remain the only video source.

**v2 product surfaces shipped (high-level):**
- Bidirectional feedback loop (Phase 3): per-set notes, per-exercise RPE+notes modal, mood picker on workout-complete, trainer drawer with 4-tab split (Resumen/Programa/Progreso/Notas), session timeline with mood/RPE chips/set chips/PRs/notes, "unread" badge + CTA banner, full trainer-private-notes CRUD panel, inline 🏆 PR toast on `sets/update`.
- Recovery system (Phase 4): student-side amber banner for missed sessions in a 2-day window, `'recovered'` calendar state, `POST /sessions/start` extended with `RecoversPlannedDate`.
- Programs editor refresh (Phase 5): CDK D&D weekly planning grid + per-week notes editor (`PUT /programs/{id}/week-overrides/{weekIndex}`).
- Foundation (Phase 1) + Trainer approval & auto-seed (Phase 1.5) + Video demo overlay (Phase 2).

**Carryovers / known-deferred items** (the rolling list, frozen here as the v2 closeout snapshot — pick up as v2.1 polish or fold into specific feature work):
- **Accessibility on Phase 5's weekly grid**: no keyboard alternative to D&D; drop zones lack `role`/`aria-label`; `<th>` lacks `scope="col"`/`scope="row"`; tooltip on disabled notes inputs in create mode.
- **`<kx-segmented-control>`** doesn't natively accept `{value, label}[]` — Phase 3 adds reverse-map workarounds in `student-detail.ts` + `student-detail-progress.ts`.
- **Workout-complete stat cards** (Duración / Sets / Volumen / PRs) — currently show `—`; restore via `GET /sessions/{id}/summary` or by re-extending `WorkoutSessionDto`.
- **`NewPrDto.Reps`** missing server-side — TS interface and `toast.showPR(name, weight, reps)` are already wired for it.
- **`<kx-video-demo-overlay>` + `<kx-confirm-dialog>` Esc-key close + focus management** (Phase 2 carryover, never landed).
- **Phase 4 leftovers**: paint missed planned day as `'recovered'` (needs `RecoversPlannedDate: DateOnly?` on `WorkoutSession` + a 4th migration); `<kx-recovery-banner>.deadlineLabel()` timezone fragility (`parseLocalDate()` fix); rotation-mode mislabel for 2-days-ago.
- **Phase 5 leftovers**: precompute `cellListsExceptMap` if perf ever feels sluggish at >40 weeks; clear `savingNotes` symmetrically in the stale-success branch of `onOverrideBlur`; extract `<kx-program-week-grid>` once cell layout becomes persistent or a second consumer needs the grid.
- **Catalog editor field-richness gap**: handoff prototype assumes `equipment`, `category`, `level`, `secondaryMuscles`, `timesUsed`. Not in current model. Future v2.1 candidate.
- **Process improvement (sticky)**: every new MediatR command/query that takes a `Guid` resource id MUST accept the corresponding `TrainerId` / `StudentId` and verify ownership before any other DB op. Encoded in CLAUDE.md gotchas.

**Next session(s)** should default to applying the three pending prod migrations + deploying, then triaging the carryover list above by user-impact rather than by phase order.

