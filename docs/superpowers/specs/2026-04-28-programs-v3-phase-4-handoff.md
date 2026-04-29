# Programs v3 (C1) — Phase 4 Resume Handoff

> Pre-session context for resuming Phase 4 in a fresh session. Phases 1+2+3 are SHIPPED on `feat/programs-v3-c1`. Phase 4 (the editor — biggest piece of the project) is next.

## Resume prompt (paste verbatim into a new session)

```
Continúa Programs v3 con Phase 4. Lee
docs/superpowers/specs/2026-04-28-programs-v3-phase-4-handoff.md para
el estado actual + la lista de tareas. El plan original está en
docs/superpowers/plans/2026-04-28-programs-v3-implementation.md (Tasks
4.1-4.10 son Phase 4). Estoy en branch feat/programs-v3-c1 @
programs-v3-phase-3-done. Subagent-driven-development ya está activo —
seguí dispatcheando subagents fase por tarea como veníamos haciendo.
```

## Where we are

**Branch:** `feat/programs-v3-c1` (pushed to GitHub `origin/feat/programs-v3-c1`).
**Tags shipped:** `programs-v3-phase-1-done`, `programs-v3-phase-2-done`, `programs-v3-phase-3-done`.
**Total commits:** 38 on branch.
**Build:** green. **Tests:** 68 backend unit + 8 arch + 10 integration + 17 frontend = 103 pass + 20 skipped (Phase 5/6 placeholders).

## What's done (Phases 1-3 summary)

### Phase 1 — Foundation (21 tasks, 23 commits)
- 7 enums in `src/Kondix.Domain/Enums/`: `ProgramObjective`, `ProgramLevel`, `ProgramMode`, `ProgramScheduleType`, `ProgramSlotKind`, `ProgramAssignmentStatus` (already existed), `WorkoutSessionStatus` (added inline as a fixup).
- `Program` entity reshaped (drop `DurationWeeks`/`IsActive`/`ProgramRoutines`; add `Notes`/`Objective`/`Level`/`Mode`/`ScheduleType`/`DaysPerWeek`/`IsPublished`/`UpdatedAt` + `Weeks`/`Assignments` navs).
- New entities: `ProgramWeek`, `ProgramSlot`.
- `ProgramAssignment` simplified (`(Id, TrainerId, StudentId, ProgramId, StartDate, Status, UpdatedAt)` only).
- `WorkoutSession` v3 reshape: added `WeekIndex`, `SlotIndex`, `Status`, `Rpe`, `RecoversPlannedDate`; renamed `ProgramAssignmentId`→`AssignmentId` (non-null); added `ProgramId`/`Program` nav.
- Deleted: `ProgramRoutine.cs`, `ProgramWeekOverride.cs` + their handlers + tests.
- New EF configs for all reshaped/new entities. Snake-case naming preserved. Indexes per spec.
- New DbSets `ProgramWeeks` + `ProgramSlots` in `KondixDbContext` + `IKondixDbContext`. Removed the obsolete ones.
- DTOs rewritten: `ProgramSummaryDto`, `ProgramDetailDto`, `ProgramWeekDto`, `ProgramSlotDto`.
- Read queries rewritten: `GetProgramByIdQuery`, `GetProgramsQuery` (with filters: objective, level, isPublished, query).
- Destructive migration `20260428201329_ProgramsV3Refactor.cs` with hand-prepended TRUNCATE chain (`set_logs/personal_records/workout_sessions/program_assignments/programs`).
- Frontend types added in `kondix-web/src/app/shared/models/index.ts`. `programs.service.list/getById` updated.

### Phase 2 — Backend writes (13 tasks, 12 commits)
- 12 new MediatR handlers, all TDD-discipline with xUnit + FluentAssertions + EF InMemory:
  - `CreateProgramCommand` (5 tests) — seeds empty weeks/slots based on mode + scheduleType.
  - `UpdateProgramCommand` (3 tests) — metadata + invariant Loop≤1 week.
  - `PublishProgramCommand` (3 tests) — one-way idempotent.
  - `DuplicateProgramCommand` (2 tests) — deep clone with BlockId remap.
  - `AddWeekCommand` / `DuplicateWeekCommand` / `DeleteWeekCommand` (5 tests).
  - `SetSlotCommand` (4 tests) — single-cell empty/rest mutation.
  - `AssignRoutineToProgramCommand` (5 tests) — **the central handler**, two branches (Week mapping + Numbered dayIds list).
  - `RemoveBlockCommand` (1 test).
  - `FillRestCommand` (2 tests).
  - `DeleteRoutineCommand` updated (3 tests, including new orphan-slot cleanup).
  - `DeleteProgramCommand` updated (2 tests, cancels active assignments first).
- 9 new endpoints wired in `ProgramsController` with `Permissions.GymManage` gating.

### Phase 3 — CreateProgramModal frontend (4 tasks, 3 commits)
- `programs.service.create()` POSTs the v3 body.
- `<kx-create-program-modal>` standalone component with signals + computed validation.
- Wired into `program-list.ts` via `showCreate` signal.
- 17/17 frontend tests still pass.

## Phase 4 — what to do next

**Goal:** Replace the legacy v2 `program-form.ts` with the new editor (3 columns + drawer mobile + Week vs Numbered branches). After this phase, trainers can edit a program's calendar end-to-end.

**Tasks (from `docs/superpowers/plans/2026-04-28-programs-v3-implementation.md` lines ~3700-4400):**

| # | Task | Approx model | Notes |
|---|---|---|---|
| 4.1 | Extend `programs.service.ts` with all write methods (update/delete/publish/duplicate/addWeek/duplicateWeek/deleteWeek/setSlot/assignRoutine/removeBlock/fillRest) | haiku | Mechanical |
| 4.2 | `weekday-mapping.ts` helper + Vitest spec (auto-suggest pattern `[0,2,4,1,3,5,6]`) | haiku | TDD, small |
| 4.3 | `ProgramEditorStore` (NgRx SignalStore) | sonnet | Local editor state — selected cell, dirty flags, optimistic mutations, reload after each mutation |
| 4.4 | `<kx-program-day-cell>` (3 visual states) | sonnet | OnPush, signal inputs, `[ngStyle]` for routineDay accent color |
| 4.5 | `<kx-program-week-row>` (label + cells + week menu) | sonnet | Hides menu when `hideMenu=true` (loop mode) |
| 4.6 | `<kx-program-meta-panel>` (left column) | sonnet | name/description/objective/level/mode/notes inputs with patch output |
| 4.7 | `<kx-cell-inspector>` — 3 inspectors (empty/rest/routineDay) | sonnet | Drop the "Progresión" overrides section (Q6 closed) |
| 4.8 | `<kx-assign-routine-modal>` 2-step wizard with Week/Numbered branches | sonnet | LARGEST single component — picker + scope + mapping |
| 4.9 | Replace `program-form.ts` with `ProgramEditorPage` shell + route update + mobile responsive CSS | sonnet | Orchestrates everything from 4.3-4.8 |
| 4.10 | Phase 4 verification + manual smoke + tag `programs-v3-phase-4-done` | inline | Smoke checklist in plan |

**Estimated:** 8-10 subagent dispatches. ~v2-Phase-4-scale (the largest of the 6 phases).

## Important deviations from plan to remember

These were discovered during Phase 1-3 execution and impact Phase 4+:

1. **`IAuditableEntity` was added** by the Phase 1 implementer at `src/Kondix.Domain/Common/IAuditableEntity.cs` (didn't exist before; CLAUDE.md mentioned the convention from sibling projects). All v3 entities that need `UpdatedAt` implement it.

2. **`WorkoutSessionStatus` enum was added** at `src/Kondix.Domain/Enums/WorkoutSessionStatus.cs` (`InProgress | Completed | Abandoned`). Used by the v3 session schema. Phase 5 will wire StartSession/CompleteSession to use it.

3. **`WorkoutSession` got more fields than plan Task 1.6 said** (Status, Rpe, RecoversPlannedDate were added; `ProgramAssignmentId` renamed to `AssignmentId` non-null; added `ProgramId`/`Program` nav). Spec §3.5 had this; the plan was incomplete.

4. **~10 handlers + 20 unit tests stubbed/skipped beyond the original Phase 1 scope** because cascading v2 references couldn't compile after the entity reshape. They throw `NotImplementedException("Wired in Phase 5/6")` and tests are `[Fact(Skip="Phase X")]`. List in commit `04b86bb8`. Phase 5 is responsible for: GetNextWorkout, GetMissedSession, StartSession, CompleteSession (rotation logic removed), GetCalendar, GetMyRoutineDetail, GetStudentOverview, GetMyProgram, GetMyRoutines. Phase 6: AssignProgram, BulkAssignProgram, GetProgramAssignments, GetRoutineUsage, GetDashboard ("program ending soon").

5. **`ProgramAssignment` lost more legacy fields than plan Task 1.5 said:** also `EndDate` and `CompletedAt` (in addition to Mode/TrainingDays/FixedScheduleJson/RotationIndex/DurationWeeks). Phase 5 implementations should compute end date from `Program.Weeks.Count × 7` for fixed programs.

6. **`Student.WorkoutSessions` collection nav still exists** but `ProgramAssignment.WorkoutSessions` was dropped. Inverse on session side is `Assignment` (single ref). When Phase 5 starts a session, EF will populate Student.WorkoutSessions automatically; ProgramAssignment.WorkoutSessions doesn't need re-adding.

7. **EF InMemory quirk** for adding child entities through nav-prop on already-tracked parent collections (causes `DbUpdateConcurrencyException`). Workaround used in week mutations: `db.ProgramWeeks.Add(newWeek)` with explicit `ProgramId` assignment instead of `program.Weeks.Add(...)`. SetSlot/RemoveBlock/FillRest don't have this issue since they only mutate (no Add).

8. **EF Shadow property `student_id1` on `program_assignments`** was caught + fixed in `ProgramAssignmentConfiguration.cs` (use `WithMany(s => s.ProgramAssignments)` with explicit inverse instead of `WithMany()`). Migration regenerated cleanly. Don't reintroduce the issue when wiring future assignment-related configs.

9. **Frontend legacy types still in use** in some places. `kondix-web/src/app/shared/models/index.ts` keeps legacy types (`ProgramListDto`, `ProgramDetailDto`, `ProgramRoutineDto`) marked `@deprecated v3`. Phase 6 (Task 6.4) replaces the program list view; Phase 4 (Task 4.9) replaces `program-form.ts`. Until those are done, those types stay so the build is green.

10. **Some Tailwind utility classes don't exist in `styles.css`:** `btn-primary`, `btn-ghost`, `input`, `scroll-thin`, `primary-subtle`. Phase 3 used inline Tailwind utilities + the existing `bg-primary-light` token (`--color-primary-light: #2A0F14`). Phase 4 components should follow the same pattern OR — if you want consistency — add these classes to `kondix-web/src/styles.css` once. Decide based on how many components need them (the editor has ~6 components — adding to styles.css may pay off).

## Phase 4 — open considerations

These are NOT blockers but worth deciding early in Phase 4:

- **Add the missing utility classes to `styles.css`?** (See deviation #10.) Decision to make in Task 4.9 or earlier.
- **`AssignRoutineModal` library load** — the modal needs `GET /api/v1/routines` to populate the picker. Verify the existing endpoint shape matches what the modal expects (`{id, name, category?, days: [{id, name}]}` — array). Adapt if the existing controller wraps it in `{items: [...]}`.
- **Route update** — Task 4.9 changes `kondix-web/src/app/features/trainer/trainer.routes.ts` to load `ProgramEditorPage` (the new component class) instead of legacy `ProgramForm`. Confirm the route still points at `/trainer/programs/:id`.
- **Mobile responsive CSS** — the JSX prototype uses `@media (max-width: 1180px)` and `<= 820px` breakpoints. Replicate as `:host ::ng-deep` styles in the editor's `styles: [...]` array. Phase 4 plan has the exact CSS to copy.

## Tech-stack reminders

- **.NET 10**, Clean Architecture, MediatR, FluentValidation, EF Core 10 with `UseSnakeCaseNamingConvention()`.
- **Angular 21** standalone components, signal inputs (`input()` / `input.required<T>()`), `ChangeDetectionStrategy.OnPush`, single-file components, Tailwind 4, Lucide icons via `LucideAngularModule` + `LUCIDE_ICONS` provider.
- **NgRx SignalStore** (`signalStore`, `withState`, `withMethods`, `patchState`) for editor state.
- **Trainer permissions:** every new MediatR command/query must take `TrainerId` and verify ownership at the top (`Programs.AnyAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId)`). Tests must cover the wrong-trainer case.
- **Template gotcha:** `[class.bg-primary/10]` and `[class.hover:foo]` DO NOT compile. Use `[ngClass]` array form OR static class strings. Phase 3 uses `[ngClass]` arrays — copy that pattern.

## How to verify Phase 4 ship-readiness

End of Phase 4:
- `dotnet build Kondix.slnx` clean.
- `dotnet test Kondix.slnx` green.
- `cd kondix-web && npm run build && npm run test -- --watch=false` green.
- Manual smoke (per plan Task 4.10): create program, open editor, click any cell → inspector switches; click "Asignar rutina" → wizard opens; complete the wizard → grid shows colored cells; click a routine cell → inspector says routine; click "Quitar rutina" → all cells back to empty; click "Rellenar descansos" → empty cells become rest; click "Publicar" → badge changes; switch mode to Loop → confirm dialog → grid collapses to 1 week. Repeat with `scheduleType=Numbered`. Test mobile (375px viewport).
- Tag `programs-v3-phase-4-done`.

## Files to read first in the new session

1. **This handoff** (you're reading it).
2. **The plan** at `docs/superpowers/plans/2026-04-28-programs-v3-implementation.md` — Tasks 4.1-4.10 are lines ~3700-4400.
3. **The spec** at `docs/superpowers/specs/2026-04-28-programs-v3-design.md` — §6 (Frontend) defines the components.
4. **The React handoff prototype** at `design_handoff_kondix_v2/prototypes/trainer/view-programs.jsx` — visual source of truth, key functions:
   - `DayCell` line 964 (3 states)
   - `WeekRow` line 900 (one row)
   - `CellInspector` line 1094 (right inspector)
   - `AssignRoutineModal` line 1319 (wizard 2-step)
   - `ProgramEditor` line 525 (the shell that orchestrates everything)
5. **Memory files** in `~/.claude/projects/.../memory/` — `programs_v3_pending.md` has the latest status.

## Branch / push state

`feat/programs-v3-c1` is pushed to `origin/feat/programs-v3-c1` with all 3 phase tags (`programs-v3-phase-1-done`, `programs-v3-phase-2-done`, `programs-v3-phase-3-done`). Working tree is clean. The next session should pull the branch, NOT start fresh from main.

## When in doubt

- Trust the implementer subagents. Phases 1-3 had several minor deviations from plan that were correct adaptations to reality (existing entity shapes, EF quirks, missing utility classes). The plan is a guide, not gospel.
- Read existing handlers in `src/Kondix.Application/Commands/Programs/` for patterns. They all follow the same TDD + ownership-scoping shape.
- The previous session left ~20 unit tests skipped with `[Fact(Skip="...")]` annotations. Phase 5/6 will un-skip them as the corresponding handlers get implemented. **Do NOT touch them in Phase 4.**
