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

