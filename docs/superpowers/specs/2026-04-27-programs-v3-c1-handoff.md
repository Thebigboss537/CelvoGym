# Programs v3 (C1 — full refactor) — Brainstorm Handoff

> Pre-brainstorm context for a fresh session. The decomposition + key open questions are settled below; the next session should brainstorm + spec + plan the WHOLE C1 effort in one consolidated cycle (not phase-by-phase). Output of next session = ONE spec doc + ONE multi-phase implementation plan, similar in structure to `docs/superpowers/plans/2026-04-26-kondix-v2-implementation.md`.

**Status (2026-04-27):** scope decision made, decomposition approved, brainstorm on questions deferred to fresh session.

## What was decided in the previous session

The user wants **C1 — full refactor of Programs to match the React handoff** (not C2 parallel-models, not C3 metadata-only). This is a model rewrite, not a UI tweak.

**Why not C3 (the original recommendation):** the user wants the handoff's editor model — week×day routine slots persisted as the program's truth — not a decorative grid. This means the existing rotation/fixed assignment model becomes obsolete and the scheduling logic moves from `ProgramAssignment` into `Program` itself.

## Decomposition (approved)

7 sub-projects. The previous session laid these out and the user accepted them:

| # | Sub-project | Depends on | Approx sessions |
|---|---|---|---|
| A | Domain refactor (entities + migrations + read endpoints, write endpoints in compat mode) | — | 1-2 |
| B | Write endpoints (POST/PUT new shape) + AssignRoutineModal POST + slot mutation endpoints | A | 1 |
| C | `GetNextWorkoutQuery` rewrite + `ProgramAssignment` cleanup (drop Mode/TrainingDays/FixedScheduleJson/RotationIndex) | A, B | 1-2 |
| D | `<kx-create-program-modal>` frontend | A, B | 1 (small) |
| E | `program-form.ts` full refactor — top bar + weekly grid + cell inspector + AssignRoutineModal frontend + week menu | A, B, D | 2-3 |
| F | `<kx-assign-program-modal>` + assignment flow rewrite | A, C | 1 (small) |
| G | Program list refresh — `<kx-program-card>` + filters | A | 1 (small) |

**Dependency graph:**
```
        A (foundation)
       / | \
      B  D  G
      |  |
      C  |
       \ |
        E (editor)
        |
        F (assignment)
```

**Recommended phasing (the next session should validate this):**
1. Phase 1 — A
2. Phase 2 — B + D in sequence
3. Phase 3 — E
4. Phase 4 — C
5. Phase 5 — F
6. Phase 6 — G

Total: 7-10 sessions of implementation (∼v2 scale). ONE consolidated spec + ONE plan covering all 6 phases — same pattern as v2 (`2026-04-26-kondix-v2-implementation.md` has 7 phases inside).

## Open design questions for the next session's brainstorm

The next session should ask these one at a time (per `superpowers:brainstorming` skill). They're listed in roughly the order each blocks the next.

### Q1 — Storage shape for `weeks×slots`

Two viable approaches:

- **Q1.A — Separate tables.** `program_weeks` (id, program_id, week_index, label, notes) + `program_slots` (id, week_id, day_index, kind, routine_id?, day_id?, block_id?, overrides_json?). Relational, queryable, FK-cascades clean.
- **Q1.B — JSON column.** `program_weeks` (id, program_id, week_index, label, notes, slots_json). All 7 slots packed as a JSON array. Less SQL-queryable but simpler entity model + migrations + payload shape mirrors the handoff 1:1.

Trade-off: Q1.A is the "EF Core proper" pattern (matches existing entities like `Routine → Day → ExerciseBlock → Exercise → ExerciseSet`). Q1.B is faster to implement and easier to reason about. **No clear winner — needs explicit decision.**

### Q2 — `Mode = 'Loop'` semantics (precise)

The handoff says: `mode: 'fixed' | 'loop'`. Loop = "se repite". Concrete questions:

- For a `mode='loop'` program with `durationWeeks=4`, when a student is assigned for 12 actual weeks, do they cycle through weeks 1-4 three times? (Most likely yes.)
- Is the assignment-side "cuántos ciclos" explicit (trainer picks "3 cycles" = 12 weeks) OR implicit (trainer picks an `EndDate` and the system cycles)?
- Per-week notes / overrides on a loop program: do they apply only on the FIRST cycle, every cycle, or are they tied to the cycle iteration (cycle 2 has its own overrides)? The handoff uses `blockId` to group slots; need to clarify if the same blockId persists across cycles.

### Q3 — `ScheduleType = 'Numbered'` semantics

`scheduleType: 'week' | 'numbered'`. The handoff renders day labels as "D1 D2 D3..." in numbered mode vs "LUN MAR MIÉ..." in week mode. But student-side semantics:

- In numbered mode, does the student train ANY day they want and the next-workout query just returns "Día N" sequentially? OR are days still tied to a calendar (Day 1 = Monday Day 2 = Wednesday based on assignment metadata)?
- If sequential: how does `GetNextWorkoutQuery` know which day they're on (counter on `WorkoutSession`)?
- If calendar-based: what's the difference from `scheduleType='week'`? Just visual label?

**This is the most ambiguous question.** The handoff doesn't define student-side behavior, only the trainer-side label. The decision affects `GetNextWorkoutQuery` rewrite (sub-project C).

### Q4 — Existing programs migration

The backend has existing programs with `ProgramRoutine[]` + assignments with `Mode/TrainingDays/FixedScheduleJson`. When the new `weeks×slots` lands:

- Backfill: project each existing program's routines into a derived weekly grid? E.g., "Program X has 3 routines + assignments use Rotation mode + TrainingDays=[Mon,Wed,Fri]" → weeks 1-N have routine[0] on Mon, routine[1] on Wed, routine[2] on Fri, rest elsewhere. This is the EXISTING semantic projected into the new shape.
- What `mode` and `scheduleType` do migrated programs default to? `mode='fixed'` is safe; `scheduleType='week'` is safe.
- What `objective`/`level` get assigned to migrated programs? Probably `null` or a default ("Otro"/"Todos"); trainer can update later.
- What about programs with `ProgramAssignment.Mode='Fixed'` and a custom `FixedScheduleJson`? The projection should honor it (route routine X to weekday Y as configured).
- Active assignments: do they keep their `Mode/TrainingDays/FixedScheduleJson` columns until ALL their parent programs migrate? Or eagerly migrate all in one transaction?

### Q5 — `mode='loop'` + `WorkoutSession` history

Today `WorkoutSession` references `ProgramAssignment` + `RoutineId` + `DayId`. In the new model:

- Should `WorkoutSession` add `WeekIndex` and `DayIndex` columns to remember which slot the session corresponds to? (For history display + handling overrides per-slot.)
- For loop programs: should `WorkoutSession` store `CycleIndex` so cycle-2 sessions are distinguishable from cycle-1 sessions in the history?

### Q6 — Per-slot `overrides`

The handoff slot has `overrides: {}` (per-slot routine overrides — e.g., "this Monday only, do 4 sets of bench instead of 3"). The current Phase 5 has per-week notes via `ProgramWeekOverride`. In the new model:

- Are per-slot overrides in scope for C1, or deferred to C1+? They're powerful but add a lot of UI surface (the handoff's `CellInspector` lets you tweak set count, weight, reps, etc. per slot).
- If in scope: do overrides apply to a single slot, or to a `blockId` (all slots that share a blockId get the same override — mirroring the handoff's `blockId` semantic)?
- If deferred: the `overrides` JSON column stays in the schema (empty object) so we don't need migration #2 later.

### Q7 — Phase 5 `ProgramWeekOverride` table — keep, repurpose, or drop?

Phase 5 (just shipped) added `program_week_overrides` for per-week notes. Options:
- Keep + extend: new schema's `ProgramWeek` has a `Notes` field that supersedes the table; migrate the data + drop the table.
- Keep separate: notes stay in `program_week_overrides`; the new `ProgramWeek` doesn't carry notes.
- Move into `ProgramWeek.Notes` column directly: simplest. Migration script copies.

### Q8 — Frontend: standalone presentational components for the editor

Per Kondix conventions (single-file standalone, signal inputs, OnPush), the editor should split into:
- `<kx-program-editor>` (smart shell)
- `<kx-program-week-row>` (one week with 7 cells)
- `<kx-program-day-cell>` (one cell with 3 visual states: empty/rest/routineDay)
- `<kx-cell-inspector>` (right sidebar with overrides + assign actions)
- `<kx-assign-routine-modal>` (2-step wizard: pick + map days)
- `<kx-create-program-modal>` (sub-project D)
- `<kx-assign-program-modal>` (sub-project F)
- `<kx-program-card>` (sub-project G)

Worth confirming this decomposition matches the handoff's component file split (`days-sidebar.jsx`, `day-panel.jsx`, etc. for routines was 4 React files → 4 Angular components).

### Q9 — Mobile UX for the weekly grid

The handoff's grid is 90px label + 7×min(82px) cells + 40px menu = ~700px wide minimum. On mobile (≤768px), this doesn't fit. Options:
- Horizontal scroll (current week label sticky-left).
- "One week per screen" carousel with swipe between weeks.
- Stack: each week renders as 7 vertical cells (label on top), one week below the next.
- Defer mobile entirely: editor is desktop-only (programs editing is rarely a phone task; trainer creates from desktop and the mobile experience is read-only via student app).

Current routine-editor used a drawer for mobile. That pattern doesn't directly apply here.

### Q10 — `coverColor` and `status` UI surfaces

- `coverColor` per-program: where does the trainer pick it? (CreateProgramModal? Program detail header? Defaults to objective color?)
- `status='Draft'`: can a draft program be assigned? (Probably no.) Where does the "publish" action live? (Program detail top bar? Inline on the card?)

## Files the next session should read for context

**Handoff prototype (the source of truth for visuals):**
- `design_handoff_kondix_v2/prototypes/trainer/view-programs.jsx` (1900+ LOC — read in chunks; the key sections are documented inline as `// ─── ... ───` comment blocks)
- Specific functions worth reading:
  - `newProgram()` line 4 — full Program data shape
  - `makeWeek()` line 24 — week shape + slots
  - `seedProgramsFull()` line 32 — example programs with realistic patterns
  - `OBJECTIVE_COLORS` line 102 — color tokens per objective
  - `ProgramsView` line 112 — list view
  - `ProgramCard` line 243 — card render
  - `CreateProgramModal` line 401 — the modal
  - `ProgramEditor` line 525 — main editor
  - `WeekRow` line 900 — one week
  - `DayCell` line 964 — one cell (3 states)
  - `CellInspector` line 1094 — sidebar
  - `AssignRoutineModal` line 1319 — 2-step wizard for assigning a routine
  - `AssignProgramModal` line 1758 — assigning program to student

**Current Angular code (what gets refactored):**
- `kondix-web/src/app/features/trainer/programs/feature/program-list.ts` (174 LOC) — list view, gets `<kx-program-card>` redesign
- `kondix-web/src/app/features/trainer/programs/feature/program-form.ts` (629 LOC) — current form with Phase 5's decorative CDK grid; gets fully replaced by the new editor
- `kondix-web/src/app/features/trainer/programs/feature/program-detail.ts` (169 LOC) — read-only detail view; assignment flow lives here today
- `kondix-web/src/app/features/trainer/trainer.routes.ts` lines 14-17 — current program routes

**Current backend:**
- `src/Kondix.Domain/Entities/Program.cs` (17 LOC) — current Program entity (Name, Description, DurationWeeks, IsActive)
- `src/Kondix.Domain/Entities/ProgramRoutine.cs` — the M:N junction (gets reworked or deprecated)
- `src/Kondix.Domain/Entities/ProgramAssignment.cs` (22 LOC) — has Mode/TrainingDays/FixedScheduleJson (these get dropped in sub-project C)
- `src/Kondix.Application/Commands/Programs/*` — current Create/Update/Delete handlers
- `src/Kondix.Application/Queries/Programs/*` — current GetById/GetAll
- Whatever file holds `GetNextWorkoutQuery` — the student-side scheduling logic (sub-project C rewrites this; need to grep `class GetNextWorkoutQuery` to find it)
- `src/Kondix.Infrastructure/Migrations/20260427024952_AddProgramWeekOverrides.cs` — Phase 5 migration; `program_week_overrides` table that needs Q7 decision

## Tech-stack reminders (so the next session doesn't re-look them up)

- **.NET 10**, Clean Architecture (Domain → Application → Infrastructure → Api), CQRS via MediatR, EF Core with `UseSnakeCaseNamingConvention()`, `Directory.Build.props` per project.
- **Angular 21** standalone components, signal inputs (`input()`/`input.required<T>()`), `ChangeDetectionStrategy.OnPush`, single-file components (template + class in `.ts`), Tailwind 4, Lucide icons via `LucideAngularModule` + `LUCIDE_ICONS` provider.
- **CDK drag-drop** already installed (`@angular/cdk@^21.2.8` from v2 Phase 5). Use it for the weekly grid drops.
- **Permissions:** trainers gate on `Permissions.GymManage` (which is `"kondix:manage"`). Resource ownership scoping is mandatory at every handler — use `Programs.AnyAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId)` then throw `"Program not found"`. This was the recurring leak class in v2 Phases 3 + 5.
- **Template gotchas:** `[class.bg-primary/10]` and `[class.hover:foo]` DO NOT compile (Angular's class-binding key parser rejects `/` and `:`). Use `[ngClass]` array form OR `[style.*]`. Static `class="bg-primary/10"` strings are fine.
- **Template-globals quirk:** `Number($event)` in a template doesn't work (Angular templates can't reach JS globals). Use a class-member alias like `Number = Number;` if needed.
- **Backend payload parity:** when refactoring write endpoints, the legacy POST/PUT shape must keep working in compat mode during the migration window (sub-project A). Don't break existing assignments mid-transition.
- **Tests posture:** Karma 17/17 + .NET 77/77 at HEAD. Add Karma specs only for load-bearing pure logic (e.g., the `mapping`-day-to-weekday helper in AssignRoutineModal, or whatever scheduling helper sub-project C needs). Manual smoke per phase.

## Suggested resume prompt for the next session

Copy/paste this into a fresh Claude Code session:

```
Lee docs/superpowers/specs/2026-04-27-programs-v3-c1-handoff.md y arrancá
con el brainstorm de Programs v3 (C1). El alcance, descomposición y
preguntas abiertas ya están en ese doc — empezá por la pregunta Q1
(storage shape) directamente, sin volver a discutir si C1 vs C3.

El output esperado: 1 spec consolidado + 1 plan de implementación con
6 fases internas (similar al v2 plan). Después seguimos con
subagent-driven-development para ejecutar fase por fase.
```

That prompt skips the scope debate (already settled) and dives straight into Q1, saving 30+ minutes of re-discovery.

## State of prod / branches

- `main` is at `0ea06028` (the routine-editor day-name validation hotfix).
- `origin/main` is in sync.
- v2 fully shipped (7 phases), routine-editor shipped, deployed at `kondix.celvo.dev`. Permissions migrated to `kondix:*` (the gym → kondix drift was fixed in this session via `celvoguard.permissions` UPDATE).
- No pending migrations; no uncommitted changes.

This handoff doc itself should be committed before ending the session.
