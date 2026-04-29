# Programs v3 (C1) — Design Spec

**Status:** Approved 2026-04-28. Ready for implementation plan.
**Replaces:** Current Programs model (Program + ProgramRoutine + ProgramAssignment with Mode/TrainingDays/FixedScheduleJson/RotationIndex).
**Pre-brainstorm context:** `docs/superpowers/specs/2026-04-27-programs-v3-c1-handoff.md`.
**Visual source of truth:** `design_handoff_kondix_v2/prototypes/trainer/view-programs.jsx`.

## 1. Goal

Replace the current Programs model with a **week × day grid** persisted as the program's truth. The trainer edits a calendar of slots (one slot per day per week); the student executes that calendar. The existing rotation/fixed assignment scheduling logic is removed — scheduling lives entirely in the program.

This is a **destructive refactor**: existing programs, assignments, sessions, set logs, and personal records are wiped on deploy. Prod is currently a testing environment.

## 2. Out of scope (explicitly deferred)

- **Per-slot overrides** (the "Progresión / Ajustes solo para esta semana" toggle in `RoutineSlotInspector` with `weightPct`, `repsDelta`, `setsDelta`, `rpeTarget`, `deload`, `testWeek`). The slot inspector ships without this section.
- **Per-week notes** (the v2 Phase 5 `program_week_overrides` table). Table is dropped; no replacement.
- **Cycle-level overrides** for loop programs (e.g., "cycle 2 has different weights"). No concept of cycles in storage — loop is a 1-week template that just repeats.
- **Backfill of existing data.** Greenfield deploy.

## 3. Domain model

### 3.1 `Program` (reshaped)

```csharp
public class Program : BaseEntity, IAuditableEntity
{
    public Guid TrainerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Notes { get; set; }            // Internal trainer notes (private)
    public ProgramObjective Objective { get; set; }
    public ProgramLevel Level { get; set; }
    public ProgramMode Mode { get; set; }          // Fixed | Loop
    public ProgramScheduleType ScheduleType { get; set; }  // Week | Numbered (immutable)
    public int? DaysPerWeek { get; set; }          // Required when ScheduleType=Numbered, null otherwise
    public bool IsPublished { get; set; }          // Default false; one-way to true
    public DateTimeOffset UpdatedAt { get; set; }

    public Trainer Trainer { get; set; } = null!;
    public ICollection<ProgramWeek> Weeks { get; set; } = [];
    public ICollection<ProgramAssignment> Assignments { get; set; } = [];
}
```

**Dropped fields:** `DurationWeeks` (derived from `Weeks.Count`), `IsActive` (replaced by `IsPublished`), `coverColor` (derived from `Objective`).

**Enums (stored as strings, PascalCase):**
- `ProgramObjective`: `Hipertrofia | Fuerza | Resistencia | Funcional | Rendimiento | Otro`
- `ProgramLevel`: `Principiante | Intermedio | Avanzado | Todos`
- `ProgramMode`: `Fixed | Loop`
- `ProgramScheduleType`: `Week | Numbered`

**Invariants enforced at handler level:**
- `Mode = Loop` ⇒ `Weeks.Count = 1` exactly. Switching to loop in the editor collapses to 1 week (with confirm UI).
- `ScheduleType = Numbered` ⇒ `DaysPerWeek` required (1..7). All slots are `RoutineDay`. No `Empty`/`Rest` slots in numbered programs. `DaysPerWeek` is constant across all weeks of the program.
- `ScheduleType = Week` ⇒ `DaysPerWeek` is null. Each week has exactly 7 slots indexed 0..6 (Lun..Dom).
- `ScheduleType` is immutable after first save. To "change" mode, trainer duplicates the program.
- Once `IsPublished = true`, cannot revert to false.

### 3.2 `ProgramWeek` (new)

```csharp
public class ProgramWeek : BaseEntity
{
    public Guid ProgramId { get; set; }
    public int WeekIndex { get; set; }             // 0-based, dense (no gaps)
    public string Label { get; set; } = string.Empty;  // Auto-generated "Semana N"

    public Program Program { get; set; } = null!;
    public ICollection<ProgramSlot> Slots { get; set; } = [];
}
```

**Indices:** Unique `(ProgramId, WeekIndex)`. FK `ProgramId` → `Program.Id` `ON DELETE CASCADE`.

**No notes column.** Per-week notes are out of scope.

### 3.3 `ProgramSlot` (new)

```csharp
public class ProgramSlot : BaseEntity
{
    public Guid WeekId { get; set; }
    public int DayIndex { get; set; }              // 0..6 in Week mode; 0..N-1 in Numbered mode
    public ProgramSlotKind Kind { get; set; }      // Empty | Rest | RoutineDay
    public Guid? RoutineId { get; set; }           // Required when Kind=RoutineDay
    public Guid? DayId { get; set; }               // Routine's Day.Id, required when Kind=RoutineDay
    public Guid? BlockId { get; set; }             // Groups slots from one AssignRoutineModal apply

    public ProgramWeek Week { get; set; } = null!;
    public Routine? Routine { get; set; }
    public Day? Day { get; set; }
}
```

**Enum:** `ProgramSlotKind`: `Empty | Rest | RoutineDay`.

**Indices:** Unique `(WeekId, DayIndex)`. FK `WeekId` → `ProgramWeek.Id` `ON DELETE CASCADE`. FK `RoutineId` → `Routine.Id` `ON DELETE SET NULL` (deleting a routine clears slots that referenced it; the slot becomes Empty + RoutineId/DayId/BlockId nulled at handler level — see "Routine deletion" in §3.6).

**Invariants:**
- `Kind=Empty` ⇒ `RoutineId/DayId/BlockId` all null.
- `Kind=Rest` ⇒ `RoutineId/DayId/BlockId` all null.
- `Kind=RoutineDay` ⇒ `RoutineId` and `DayId` non-null. `BlockId` non-null (assigned at apply time).
- `BlockId` shared across slots produced by one `AssignRoutineModal` apply. "Quitar rutina" deletes all slots with the same `BlockId`.

### 3.4 `ProgramAssignment` (simplified)

```csharp
public class ProgramAssignment : BaseEntity, IAuditableEntity
{
    public Guid TrainerId { get; set; }
    public Guid StudentId { get; set; }
    public Guid ProgramId { get; set; }
    public DateTimeOffset StartDate { get; set; }
    public ProgramAssignmentStatus Status { get; set; }   // Active | Completed | Cancelled
    public DateTimeOffset UpdatedAt { get; set; }

    public Trainer Trainer { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Program Program { get; set; } = null!;
}
```

**Dropped fields:** `Mode`, `TrainingDays`, `FixedScheduleJson`, `RotationIndex`, `DurationWeeks`.

**Computed:**
- `EndDate` for `Mode=Fixed`: `StartDate + (Program.Weeks.Count × 7) days`. Computed at query time, not persisted.
- For `Mode=Loop`: no end date. Status stays `Active` until trainer cancels or reassigns.

**Status transitions:**
- `Active → Completed`: only for fixed programs, when end date is reached AND all sessions completed (or simply when end date is reached — implementation detail).
- `Active → Cancelled`: trainer cancels manually or reassigns student to a different program.
- Loop programs: only `Active → Cancelled` (never auto-Completed).

### 3.5 `WorkoutSession` (reset)

Existing data dropped. New schema:

```csharp
public class WorkoutSession : BaseEntity, IAuditableEntity
{
    public Guid StudentId { get; set; }
    public Guid AssignmentId { get; set; }      // The active ProgramAssignment when session was logged
    public Guid ProgramId { get; set; }         // Denormalized for history queries
    public Guid RoutineId { get; set; }
    public Guid DayId { get; set; }

    public int WeekIndex { get; set; }           // Which Program.Week the session corresponds to
    public int SlotIndex { get; set; }           // Which slot in that week (0..6 in Week mode, 0..N-1 in Numbered)

    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public WorkoutSessionStatus Status { get; set; }   // InProgress | Completed | Abandoned
    public string? Mood { get; set; }
    public int? Rpe { get; set; }
    public string? Notes { get; set; }
    public bool IsRecovery { get; set; }
    public DateOnly? RecoversPlannedDate { get; set; }

    public Student Student { get; set; } = null!;
    public ProgramAssignment Assignment { get; set; } = null!;
    public Program Program { get; set; } = null!;
    public Routine Routine { get; set; } = null!;
    public Day Day { get; set; } = null!;
    public ICollection<SetLog> SetLogs { get; set; } = [];
}
```

**Index:** `(AssignmentId, WeekIndex, SlotIndex, Status)` — used by GetNextWorkoutQuery to find unfinished sessions in the current week.

`SetLog` and `PersonalRecord` are recreated with their existing v2 schemas (no logical changes — just dropped + recreated).

### 3.6 Routine deletion

When a trainer deletes a `Routine`, EF cascades `RoutineId → ProgramSlot.RoutineId` to NULL via the FK. Handler post-step: walks `program_slots` where `RoutineId IS NULL AND Kind = 'RoutineDay'`, sets `Kind='Empty'`, nulls `DayId/BlockId`. Single cleanup query, runs in same transaction as the routine delete.

This replaces the current "this routine is in use" warning — deletion now succeeds and silently clears affected slots. Trainer-side UI shows a count: "Esta rutina está en N programas. Borrarla los marcará como vacíos. ¿Continuar?".

## 4. API surface

All trainer endpoints under `/api/v1/programs/*` gate on `Permissions.GymManage`. Inline ownership scoping (`Programs.AnyAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId)`) is mandatory at every handler.

### 4.1 Program CRUD

| Verb | Path | Body / Notes |
|---|---|---|
| `POST` | `/api/v1/programs` | Create. Body matches `CreateProgramModal` output: `{ name, description?, objective, level, mode, scheduleType, daysPerWeek?, durationWeeks }`. For loop, `durationWeeks` ignored (forced to 1). For numbered, `daysPerWeek` required. Server seeds `Weeks` with empty templates. |
| `GET` | `/api/v1/programs` | List. Filters: `?objective=`, `?level=`, `?published=`, `?query=`. Returns `ProgramSummary[]` (id, name, description, objective, level, mode, scheduleType, weeksCount, sessionsCount, assignedCount, isPublished). |
| `GET` | `/api/v1/programs/{id}` | Detail. Returns full program with weeks + slots. |
| `PUT` | `/api/v1/programs/{id}` | Update metadata (name, description, notes, objective, level, mode). `ScheduleType` rejected if changed. Switching `Fixed → Loop` with `Weeks.Count > 1` returns 400 (frontend already collapsed). |
| `DELETE` | `/api/v1/programs/{id}` | Delete. Cascades to weeks/slots. Cancels active assignments. |
| `POST` | `/api/v1/programs/{id}/publish` | Flip `IsPublished` to true. One-way. |
| `POST` | `/api/v1/programs/{id}/duplicate` | Deep clone (program + weeks + slots). New copy is `IsPublished=false`. |

### 4.2 Week mutations

| Verb | Path | Notes |
|---|---|---|
| `POST` | `/api/v1/programs/{id}/weeks` | Append a new empty week. Rejected if `Mode=Loop`. |
| `POST` | `/api/v1/programs/{id}/weeks/{weekIndex}/duplicate` | Insert a copy of week N at position N+1. Re-indexes following weeks. |
| `DELETE` | `/api/v1/programs/{id}/weeks/{weekIndex}` | Remove. Re-indexes following weeks. Rejected if `Weeks.Count = 1`. |

### 4.3 Slot mutations

| Verb | Path | Body | Notes |
|---|---|---|---|
| `PUT` | `/api/v1/programs/{id}/weeks/{weekIndex}/slots/{dayIndex}` | `{ kind: "Empty"\|"Rest" }` | Single-cell mutation for setting empty/rest. RoutineDay slots come via `assign-routine`. |
| `POST` | `/api/v1/programs/{id}/assign-routine` | `{ routineId, weeks: [int...], mapping: { dayId: weekdayIdx } }` (Week mode) OR `{ routineId, weeks: [int...], dayIds: [Guid...] }` (Numbered mode) | Generates one `BlockId`, writes RoutineDay slots in (week, dayIdx). Pisa lo que haya en esos slots. Returns updated weeks. |
| `DELETE` | `/api/v1/programs/{id}/blocks/{blockId}` | — | Remove all slots with this `BlockId`, set them to `Empty`. |
| `POST` | `/api/v1/programs/{id}/fill-rest` | — | All `Empty` slots → `Rest`. Leaves RoutineDay alone. Returns updated program. Rejected if `ScheduleType=Numbered` (no concept of rest in numbered). |

### 4.4 Assignment

| Verb | Path | Body / Notes |
|---|---|---|
| `POST` | `/api/v1/program-assignments` | `{ studentId, programId, startDate }`. Rejects if program `IsPublished=false`. Cancels any prior `Active` assignment for that student (1:1 active rule). |
| `GET` | `/api/v1/program-assignments` | List trainer's assignments. Filters: `?studentId=`, `?status=`. |
| `POST` | `/api/v1/program-assignments/{id}/cancel` | Status → Cancelled. |

### 4.5 Student-side queries

| Verb | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/public/my/program` | Returns active assignment + full program (weeks + slots). |
| `GET` | `/api/v1/public/my/next-workout` | See §5 below. |
| `GET` | `/api/v1/public/my/this-week` | **New for Numbered mode.** Returns the N pending sessions for the current week (with completed-this-week count). |
| `GET` | `/api/v1/public/my/routines/{id}` | Unchanged — fetches routine detail for execution. |
| `POST` | `/api/v1/public/my/sessions/start` | Body: `{ assignmentId, routineId, dayId, weekIndex, slotIndex, recoversPlannedDate? }`. Server records the slot context. |

## 5. `GetNextWorkoutQuery` rewrite

Two branches based on `Program.ScheduleType`.

### 5.1 Week mode (calendar-locked)

Inputs: `studentId`, `today` (DateOnly).

1. Load student's `Active` assignment + program.
2. For `Mode=Fixed`: `currentWeekIdx = floor((today - startDate).days / 7)`. If `>= weeks.Count`, return "Programa terminado".
3. For `Mode=Loop`: `currentWeekIdx = 0` (always, since loop has 1 week).
4. `currentDayIdx = ((int)today.DayOfWeek + 6) % 7` (Mon=0..Sun=6).
5. Find slot `(currentWeekIdx, currentDayIdx)`:
   - `Kind=RoutineDay` → return `{ kind: "routine", routineId, dayId, weekIndex, slotIndex }`.
   - `Kind=Rest` → return `{ kind: "rest" }`.
   - `Kind=Empty` → return `{ kind: "empty" }` (alumno sees "no planificado, descansa o entrena libre").

### 5.2 Numbered mode (week-bucket)

Inputs: `studentId`, `today` (DateOnly).

1. Load student's `Active` assignment + program.
2. Resolve `currentWeekIdx`:
   - For `Mode=Fixed`: same as Week mode (`floor((today - startDate).days / 7)`).
   - For `Mode=Loop`: `currentWeekIdx = 0`.
3. Compute the calendar week boundary (Mon-Sun of `today`).
4. Load all `RoutineDay` slots for `(programId, currentWeekIdx)`. There are exactly `program.DaysPerWeek` of them.
5. Load `WorkoutSession` rows where `assignmentId = X AND weekIndex = currentWeekIdx AND startedAt >= weekStart AND status = Completed` to know which slots are done **this calendar week**.
6. Return `{ kind: "numbered", pending: [slot...], completed: count, total: daysPerWeek }`.
7. The `/this-week` endpoint surfaces the same payload directly.

### 5.3 Numbered mode — week boundary semantics

- The "week" the alumno trains in is the calendar week (Mon-Sun) **of today**.
- Sessions completed in a calendar week count toward that week's `daysPerWeek` quota.
- When the calendar rolls over (Sunday → Monday), the bucket resets: previous week's incomplete slots are **not** carried over (option C from brainstorm).
- Sessions from a previous calendar week stay in the history (visible to trainer); they do not contribute to next week's pending count.

### 5.4 Recovery (week mode only)

Numbered mode does not support recovery — there is no "missed Wednesday" concept when calendar is irrelevant. The recovery banner / `IsRecovery` flag / `RecoversPlannedDate` only fire for `ScheduleType=Week` programs. Numbered students with skipped weeks see them in their history but no banner.

## 6. Frontend

### 6.1 Component decomposition (Angular standalone)

| Component | File | Role |
|---|---|---|
| `ProgramListPage` (smart) | `feature/program-list.ts` | List + filters + create button |
| `ProgramEditorPage` (smart) | `feature/program-editor.ts` | Editor shell — top bar, 3 columns, drawer mobile |
| `kx-program-card` | `ui/program-card.ts` | List card with timeline preview, badges, stats, menu |
| `kx-program-meta-panel` | `ui/program-meta-panel.ts` | Left column: name, description, objective, level, mode, notes |
| `kx-program-week-row` | `ui/program-week-row.ts` | One week row (label + cells + week menu) |
| `kx-program-day-cell` | `ui/program-day-cell.ts` | One cell — 3 visual states (empty/rest/routineDay) in Week mode, only routineDay in Numbered mode |
| `kx-cell-inspector` | `ui/cell-inspector.ts` | Right-column inspector (no overrides section — Q6 dropped) |
| `kx-assign-routine-modal` | `ui/assign-routine-modal.ts` | 2-step wizard with internal branch by `scheduleType` |
| `kx-create-program-modal` | `ui/create-program-modal.ts` | Creation modal |
| `kx-assign-program-modal` | `ui/assign-program-modal.ts` | Assign program → student (minimal: pick student + start date) |

### 6.2 State

- **`ProgramStore`** (NgRx SignalStore, global): list, filters, CRUD operations.
- **`ProgramEditorStore`** (NgRx SignalStore, scoped to editor route): local editor state — current program draft, selectedCell, dirty flags, optimistic mutations. Distinct from the global list store to avoid bloat.

### 6.3 Mode-specific UI

**Week mode editor:**
- Day headers: `LUN MAR MIÉ JUE VIE SÁB DOM`.
- Each week row has 7 cells.
- Cell can be empty/rest/routineDay; inspector handles all three.
- "Rellenar descansos" action available when there are empty cells AND at least one routineDay.

**Numbered mode editor:**
- Day headers: `D1 D2 D3 ... DN` (where N = `daysPerWeek`).
- Each week row has exactly N cells.
- Cells are always RoutineDay (after assign) or Empty (until assigned).
- No "Rest" state. No "Rellenar descansos" action.
- AssignRoutineModal step 2 uses a different layout: pick which routine.days to add (no weekday mapping).
- Switch from N=3 → N=4 in editor adds an empty cell to every week.

**Student-side:**
- Week mode: home shows today's slot via `<kx-hero-card>` (existing component, unchanged).
- Numbered mode: home shows "Esta semana — X/N completados" with a list of pending session cards. Tapping any card starts that session.

### 6.4 Mobile responsive (handoff CSS replicated)

- `≤1180px`: right inspector becomes drawer (slides from right with backdrop). Already in `ProgramEditor` JSX (lines 868-893).
- `≤820px`: left meta panel collapses or hides, only grid + drawer remain.
- Grid wrapper has `min-width: 720px` with horizontal scroll on narrower viewports.
- No mobile-specific UX redesign. Desktop-first; mobile is "works but not optimal".

## 7. Migration strategy (destructive)

Single migration, runs in one transaction:

```sql
-- Phase 1: drop dependent data first
TRUNCATE TABLE kondix.set_logs CASCADE;
TRUNCATE TABLE kondix.personal_records CASCADE;
TRUNCATE TABLE kondix.workout_sessions CASCADE;
TRUNCATE TABLE kondix.program_assignments CASCADE;
TRUNCATE TABLE kondix.program_week_overrides CASCADE;
TRUNCATE TABLE kondix.program_routines CASCADE;
TRUNCATE TABLE kondix.programs CASCADE;

-- Phase 2: drop obsolete tables
DROP TABLE kondix.program_routines;
DROP TABLE kondix.program_week_overrides;

-- Phase 3: drop obsolete columns from program_assignments
ALTER TABLE kondix.program_assignments
    DROP COLUMN mode,
    DROP COLUMN training_days,
    DROP COLUMN fixed_schedule_json,
    DROP COLUMN rotation_index,
    DROP COLUMN duration_weeks;

-- Phase 4: drop obsolete columns from programs
ALTER TABLE kondix.programs
    DROP COLUMN duration_weeks,
    DROP COLUMN is_active;

-- Phase 5: add new columns to programs
ALTER TABLE kondix.programs
    ADD COLUMN notes text NULL,
    ADD COLUMN objective text NOT NULL DEFAULT 'Otro',
    ADD COLUMN level text NOT NULL DEFAULT 'Todos',
    ADD COLUMN mode text NOT NULL DEFAULT 'Fixed',
    ADD COLUMN schedule_type text NOT NULL DEFAULT 'Week',
    ADD COLUMN days_per_week int NULL,
    ADD COLUMN is_published boolean NOT NULL DEFAULT false;

-- Phase 6: create new tables (program_weeks, program_slots)
CREATE TABLE kondix.program_weeks (
    id uuid PRIMARY KEY,
    program_id uuid NOT NULL REFERENCES kondix.programs(id) ON DELETE CASCADE,
    week_index int NOT NULL,
    label text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (program_id, week_index)
);
CREATE INDEX ix_program_weeks_program_id ON kondix.program_weeks (program_id);

CREATE TABLE kondix.program_slots (
    id uuid PRIMARY KEY,
    week_id uuid NOT NULL REFERENCES kondix.program_weeks(id) ON DELETE CASCADE,
    day_index int NOT NULL,
    kind text NOT NULL,                 -- Empty | Rest | RoutineDay
    routine_id uuid NULL REFERENCES kondix.routines(id) ON DELETE SET NULL,
    day_id uuid NULL REFERENCES kondix.days(id) ON DELETE SET NULL,
    block_id uuid NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (week_id, day_index)
);
CREATE INDEX ix_program_slots_week_id ON kondix.program_slots (week_id);
CREATE INDEX ix_program_slots_routine_id ON kondix.program_slots (routine_id) WHERE routine_id IS NOT NULL;
CREATE INDEX ix_program_slots_block_id ON kondix.program_slots (block_id) WHERE block_id IS NOT NULL;

-- Phase 7: add new columns to workout_sessions
ALTER TABLE kondix.workout_sessions
    ADD COLUMN week_index int NOT NULL DEFAULT 0,
    ADD COLUMN slot_index int NOT NULL DEFAULT 0;
```

EF Core migration generated via `dotnet ef migrations add ProgramsV3Refactor`. Manual review required to confirm the generated SQL matches this strategy.

**Tables preserved unchanged:** `trainers`, `students`, `trainer_students`, `routines`, `days`, `exercise_groups`, `exercises`, `exercise_sets`, `invitations`.

## 8. Test posture

- **.NET unit tests:** every new MediatR handler. Focus on invariant enforcement (mode/scheduleType validations, ownership scoping, slot kind transitions). Architecture tests stay green.
- **Karma specs:** load-bearing pure functions only. Examples: the routine-day → weekday auto-suggestion (`[0,2,4,1,3,5,6]`), the GetNextWorkoutQuery numbered-mode bucket reducer.
- **Manual smoke per phase** (per the v2 plan rhythm). No Playwright E2E (per the project preference noted in memory).

## 9. Phasing

The implementation plan covers 6 phases in dependency order:

1. **Phase 1 — Foundation** (sub-project A): Domain refactor (entities + enums + EF configs), single destructive migration, read endpoints (GET program list, GET program detail).
2. **Phase 2 — Writes** (sub-project B): All write endpoints (POST/PUT/DELETE program, week mutations, slot mutations, assign-routine, fill-rest, publish, duplicate).
3. **Phase 3 — Create modal** (sub-project D): `<kx-create-program-modal>` frontend + integration with new POST endpoint.
4. **Phase 4 — Editor** (sub-project E): `ProgramEditorPage` + meta panel + week row + day cell + cell inspector + assign-routine modal. Largest phase. Includes the Week vs Numbered branches.
5. **Phase 5 — Student-side** (sub-project C): `GetNextWorkoutQuery` rewrite (both branches), `/this-week` endpoint, student home UI for numbered mode, recovery flow gated to Week mode only.
6. **Phase 6 — Assignment + List** (sub-projects F + G): `<kx-assign-program-modal>` rewrite + `<kx-program-card>` redesign + program list filters.

Total estimated: 7-10 implementation sessions. Each phase ends with a manual smoke + test green checkpoint before merging to `main`.

## 10. Open questions / future follow-ups

These are **not** blockers for C1 but worth tracking:

- Per-slot overrides (Q6) — if/when trainers ask for "deload week" / "test week" tooling.
- ScheduleType `Numbered` flexibility: variable N per week, sequential ordering, carry-over of missed sessions. None in scope for v1 of numbered.
- Publish workflow: archived state, version history, draft-vs-published diff view.
- Mobile-optimized editor (currently desktop-first).

These can be additive migrations later without disturbing the C1 schema.
