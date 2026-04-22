# Assignment Lifecycle Guards Implementation Plan

> **Status:** Completed — all 9 tasks shipped. This document is committed ex-post as historical record of the design and scope.
>
> **Reference commits:**
> - `603b7971` — Task 1: guard UpdateRoutine against editing routines with existing sessions
> - `6664027e` — Task 3: block program routine changes when active assignments exist
> - `baadaa65` — Task 4: auto-cancel active assignments when deleting a program
> - `204fb4f8` — Task 5: add GetRoutineUsage query and endpoint
> - `665d60bd` — Task 6: extend GetProgramAssignments with studentId filter and history
> - `c7013269` — Task 7: add cancel program button and assignment history to student detail
> - `da99ed30` — Task 8: show warning when editing routine with sessions or active assignments
> - `8a728c8e` — Task 9: show warning when editing program with active assignments

**Goal:** Prevent data corruption when editing routines/programs with active assignments, and give trainers UI to cancel/reassign programs.

**Architecture:** Add validation guards to 4 existing CQRS command handlers (UpdateRoutine, UpdateProgram, DeleteProgram, AssignProgram), create 1 new query (GetRoutineUsage), and add cancel/reassign UI to the student detail frontend component. All backend changes are in the Application layer; no domain changes needed.

**Tech Stack:** .NET 10, MediatR, EF Core, FluentValidation, Angular 21, Signals

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/Kondix.Application/Commands/Routines/UpdateRoutineCommand.cs` | Add session check before deleting days |
| Modify | `src/Kondix.Application/Commands/ProgramAssignments/AssignProgramCommand.cs` | One active program per student |
| Modify | `src/Kondix.Application/Commands/ProgramAssignments/BulkAssignProgramCommand.cs` | Same guard for bulk assign |
| Modify | `src/Kondix.Application/Commands/Programs/UpdateProgramCommand.cs` | Block routine changes with active assignments |
| Modify | `src/Kondix.Application/Commands/Programs/DeleteProgramCommand.cs` | Auto-cancel active assignments |
| Create | `src/Kondix.Application/Queries/Routines/GetRoutineUsageQuery.cs` | Check if routine is used in active programs |
| Modify | `src/Kondix.Application/Queries/ProgramAssignments/GetProgramAssignmentsQuery.cs` | Support filtering by studentId + all statuses |
| Modify | `src/Kondix.Api/Controllers/RoutinesController.cs` | Add usage endpoint |
| Modify | `src/Kondix.Api/Controllers/ProgramAssignmentsController.cs` | Add query params for history |
| Modify | `kondix-web/src/app/features/trainer/students/feature/student-detail.ts` | Cancel button, assignment history, reassign flow |
| Modify | `kondix-web/src/app/features/trainer/programs/feature/program-form.ts` | Warning for active assignments |
| Modify | `kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts` | Warning for routine in use |
| Modify | `kondix-web/src/app/shared/models/index.ts` | Add RoutineUsageDto interface |

---

### Task 1: Guard UpdateRoutineCommand — prevent editing routines with sessions

The current `UpdateRoutineCommand` calls `ExecuteDeleteAsync(Days)` which hits a `RESTRICT` FK constraint on `workout_sessions.day_id` if any session exists. This crashes with a 500 error. We need a clear guard with a helpful message.

**Files:**
- Modify: `src/Kondix.Application/Commands/Routines/UpdateRoutineCommand.cs:20-37`

- [x] **Step 1: Add session check before day deletion**

In `UpdateRoutineCommand.cs`, add a check before the `ExecuteDeleteAsync` call. Replace lines 20-37 with:

```csharp
public async Task<RoutineDetailDto> Handle(UpdateRoutineCommand request, CancellationToken cancellationToken)
{
    var routine = await db.Routines
        .FirstOrDefaultAsync(r => r.Id == request.RoutineId && r.TrainerId == request.TrainerId && r.IsActive, cancellationToken)
        ?? throw new InvalidOperationException("Routine not found");

    // Guard: prevent editing if students have sessions referencing this routine's days
    var hasSessions = await db.WorkoutSessions
        .AnyAsync(ws => ws.RoutineId == routine.Id, cancellationToken);

    if (hasSessions)
        throw new InvalidOperationException(
            "Esta rutina tiene sesiones registradas. Duplicala para crear una versión nueva.");

    await db.Days.Where(d => d.RoutineId == routine.Id).ExecuteDeleteAsync(cancellationToken);

    routine.Name = request.Name;
    routine.Description = request.Description;
    routine.Tags = request.Tags ?? [];
    routine.Category = request.Category;
    routine.UpdatedAt = DateTimeOffset.UtcNow;

    var (days, dayDtos) = RoutineBuilder.BuildDays(request.Days);
    foreach (var day in days) { day.RoutineId = routine.Id; db.Days.Add(day); }

    await db.SaveChangesAsync(cancellationToken);

    return new RoutineDetailDto(routine.Id, routine.Name, routine.Description,
        dayDtos, routine.Tags, routine.Category, routine.CreatedAt, routine.UpdatedAt);
}
```

- [x] **Step 2: Build and verify**

Run: `dotnet build src/Kondix.Application/Kondix.Application.csproj`
Expected: Build succeeded

- [x] **Step 3: Commit**

```bash
git add src/Kondix.Application/Commands/Routines/UpdateRoutineCommand.cs
git commit -m "fix: guard UpdateRoutine against editing routines with existing sessions

Prevents FK RESTRICT violation on workout_sessions.day_id when
ExecuteDeleteAsync tries to remove days that have session references.
Shows clear Spanish error message directing trainer to duplicate instead."
```

---

### Task 2: Guard AssignProgramCommand — one active program per student

Currently the check only prevents assigning the SAME program twice. A student can have multiple different active programs, and the system silently picks the newest. We need to enforce one active program per student.

**Files:**
- Modify: `src/Kondix.Application/Commands/ProgramAssignments/AssignProgramCommand.cs:40-46`

- [x] **Step 1: Change duplicate check to any-active check**

In `AssignProgramCommand.cs`, replace lines 40-46:

```csharp
// OLD: only checks same program
// var existingActive = await db.ProgramAssignments
//     .AnyAsync(pa => pa.ProgramId == request.ProgramId
//         && pa.StudentId == request.StudentId
//         && pa.Status == ProgramAssignmentStatus.Active, cancellationToken);
// if (existingActive)
//     throw new InvalidOperationException("This program is already assigned to this student");

// NEW: one active program per student
var existingActive = await db.ProgramAssignments
    .AnyAsync(pa => pa.StudentId == request.StudentId
        && pa.Status == ProgramAssignmentStatus.Active, cancellationToken);

if (existingActive)
    throw new InvalidOperationException(
        "El alumno ya tiene un programa activo. Cancélalo antes de asignar otro.");
```

- [x] **Step 2: Apply same guard to BulkAssignProgramCommand**

In `src/Kondix.Application/Commands/ProgramAssignments/BulkAssignProgramCommand.cs`, replace lines 40-45 (the `alreadyAssigned` check):

```csharp
// OLD: only checks same program
// var alreadyAssigned = await db.ProgramAssignments
//     .Where(pa => pa.ProgramId == request.ProgramId
//         && request.StudentIds.Contains(pa.StudentId)
//         && pa.Status == ProgramAssignmentStatus.Active)
//     .Select(pa => pa.StudentId)
//     .ToHashSetAsync(cancellationToken);

// NEW: skip any student who already has ANY active program
var alreadyAssigned = await db.ProgramAssignments
    .Where(pa => request.StudentIds.Contains(pa.StudentId)
        && pa.Status == ProgramAssignmentStatus.Active)
    .Select(pa => pa.StudentId)
    .ToHashSetAsync(cancellationToken);
```

- [x] **Step 3: Build and verify**

Run: `dotnet build src/Kondix.Application/Kondix.Application.csproj`
Expected: Build succeeded

- [x] **Step 4: Commit**

```bash
git add src/Kondix.Application/Commands/ProgramAssignments/AssignProgramCommand.cs \
        src/Kondix.Application/Commands/ProgramAssignments/BulkAssignProgramCommand.cs
git commit -m "fix: enforce one active program per student

Previously only prevented duplicate of same program. Now prevents
any second active program. Applies to both single and bulk assign.
Trainer must cancel existing first."
```

---

### Task 3: Guard UpdateProgramCommand — block routine changes with active assignments

The current handler silently replaces all ProgramRoutines without checking for active assignments. This breaks RotationIndex and FixedScheduleJson for students mid-program.

**Files:**
- Modify: `src/Kondix.Application/Commands/Programs/UpdateProgramCommand.cs:20-70`

- [x] **Step 1: Add active assignment guard**

Replace the full handler method in `UpdateProgramCommand.cs`:

```csharp
public async Task<ProgramDetailDto> Handle(UpdateProgramCommand request, CancellationToken cancellationToken)
{
    var program = await db.Programs
        .Include(p => p.ProgramRoutines)
        .FirstOrDefaultAsync(p => p.Id == request.ProgramId
            && p.TrainerId == request.TrainerId
            && p.IsActive, cancellationToken)
        ?? throw new InvalidOperationException("Program not found");

    if (request.Routines.Count == 0)
        throw new InvalidOperationException("A program must have at least one routine");

    var routineIds = request.Routines.Select(r => r.RoutineId).ToList();
    var routines = await db.Routines
        .AsNoTracking()
        .Where(r => routineIds.Contains(r.Id) && r.TrainerId == request.TrainerId && r.IsActive)
        .ToDictionaryAsync(r => r.Id, cancellationToken);

    if (routines.Count != routineIds.Distinct().Count())
        throw new InvalidOperationException("One or more routines not found");

    // Guard: if routines changed, check for active assignments
    var oldRoutineIds = program.ProgramRoutines
        .OrderBy(pr => pr.SortOrder)
        .Select(pr => pr.RoutineId)
        .ToList();
    var newRoutineIds = request.Routines
        .Select(r => r.RoutineId)
        .ToList();

    // SequenceEqual is intentional: reordering routines changes which routine
    // RotationIndex % count resolves to, so order matters — do NOT change to set comparison.
    var routinesChanged = !oldRoutineIds.SequenceEqual(newRoutineIds);

    if (routinesChanged)
    {
        var activeCount = await db.ProgramAssignments
            .CountAsync(pa => pa.ProgramId == request.ProgramId
                && pa.Status == ProgramAssignmentStatus.Active, cancellationToken);

        if (activeCount > 0)
            throw new InvalidOperationException(
                $"No se pueden modificar las rutinas: {activeCount} alumno(s) asignado(s). Cancela las asignaciones primero.");
    }

    program.Name = request.Name;
    program.Description = request.Description;
    program.DurationWeeks = request.DurationWeeks;
    program.UpdatedAt = DateTimeOffset.UtcNow;

    // Only replace routines if they changed
    if (routinesChanged)
    {
        db.ProgramRoutines.RemoveRange(program.ProgramRoutines);

        var routineDtos = new List<ProgramRoutineDto>();
        for (var i = 0; i < request.Routines.Count; i++)
        {
            var input = request.Routines[i];
            var pr = new ProgramRoutine
            {
                ProgramId = program.Id,
                RoutineId = input.RoutineId,
                Label = input.Label,
                SortOrder = i
            };
            db.ProgramRoutines.Add(pr);

            var routine = routines[input.RoutineId];
            routineDtos.Add(new ProgramRoutineDto(pr.Id, pr.RoutineId, routine.Name, pr.Label, pr.SortOrder));
        }

        await db.SaveChangesAsync(cancellationToken);

        return new ProgramDetailDto(program.Id, program.Name, program.Description,
            program.DurationWeeks, routineDtos, program.CreatedAt, program.UpdatedAt);
    }

    await db.SaveChangesAsync(cancellationToken);

    // Return current routines (unchanged)
    var currentDtos = program.ProgramRoutines
        .OrderBy(pr => pr.SortOrder)
        .Select(pr => new ProgramRoutineDto(pr.Id, pr.RoutineId, routines[pr.RoutineId].Name, pr.Label, pr.SortOrder))
        .ToList();

    return new ProgramDetailDto(program.Id, program.Name, program.Description,
        program.DurationWeeks, currentDtos, program.CreatedAt, program.UpdatedAt);
}
```

- [x] **Step 2: Build and verify**

Run: `dotnet build src/Kondix.Application/Kondix.Application.csproj`
Expected: Build succeeded

- [x] **Step 3: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/UpdateProgramCommand.cs
git commit -m "fix: block program routine changes when active assignments exist

Allows name/description/duration changes freely. Only blocks when
the routine list actually changes and there are active assignments.
Prevents RotationIndex desync and FixedScheduleJson orphaning."
```

---

### Task 4: Guard DeleteProgramCommand — auto-cancel active assignments

Currently soft-deletes the program without touching active assignments, leaving orphaned references.

**Files:**
- Modify: `src/Kondix.Application/Commands/Programs/DeleteProgramCommand.cs:14-27`

- [x] **Step 1: Add auto-cancel before soft delete**

Replace the handler method in `DeleteProgramCommand.cs`:

```csharp
public async Task<Unit> Handle(DeleteProgramCommand request, CancellationToken cancellationToken)
{
    var program = await db.Programs
        .FirstOrDefaultAsync(p => p.Id == request.ProgramId
            && p.TrainerId == request.TrainerId
            && p.IsActive, cancellationToken)
        ?? throw new InvalidOperationException("Program not found");

    // Cancel all active assignments before soft-deleting
    var activeAssignments = await db.ProgramAssignments
        .Where(pa => pa.ProgramId == request.ProgramId
            && pa.Status == ProgramAssignmentStatus.Active)
        .ToListAsync(cancellationToken);

    foreach (var pa in activeAssignments)
    {
        pa.Status = ProgramAssignmentStatus.Cancelled;
        pa.CompletedAt = DateTimeOffset.UtcNow;
    }

    program.IsActive = false;
    program.UpdatedAt = DateTimeOffset.UtcNow;

    await db.SaveChangesAsync(cancellationToken);
    return Unit.Value;
}
```

- [x] **Step 2: Build and verify**

Run: `dotnet build src/Kondix.Application/Kondix.Application.csproj`
Expected: Build succeeded

- [x] **Step 3: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/DeleteProgramCommand.cs
git commit -m "fix: auto-cancel active assignments when deleting a program

Prevents orphaned ProgramAssignment records pointing to inactive programs."
```

---

### Task 5: Add GetRoutineUsageQuery — check if routine is in active programs

New query the frontend needs to show warnings when editing a routine that's part of active programs.

**Files:**
- Create: `src/Kondix.Application/Queries/Routines/GetRoutineUsageQuery.cs`
- Modify: `src/Kondix.Application/DTOs/RoutineDtos.cs` (add RoutineUsageDto)
- Modify: `src/Kondix.Api/Controllers/RoutinesController.cs` (add endpoint)
- Modify: `kondix-web/src/app/shared/models/index.ts` (add TS interface)

- [x] **Step 1: Add RoutineUsageDto**

At the end of `src/Kondix.Application/DTOs/RoutineDtos.cs`, add:

```csharp
public sealed record RoutineUsageDto(
    int ActiveProgramCount,
    int ActiveAssignmentCount,
    bool HasSessions);
```

- [x] **Step 2: Create the query handler**

Create file `src/Kondix.Application/Queries/Routines/GetRoutineUsageQuery.cs`:

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Routines;

public sealed record GetRoutineUsageQuery(Guid RoutineId, Guid TrainerId) : IRequest<RoutineUsageDto>;

public sealed class GetRoutineUsageHandler(IKondixDbContext db)
    : IRequestHandler<GetRoutineUsageQuery, RoutineUsageDto>
{
    public async Task<RoutineUsageDto> Handle(GetRoutineUsageQuery request, CancellationToken cancellationToken)
    {
        var routine = await db.Routines
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId
                && r.TrainerId == request.TrainerId
                && r.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Routine not found");

        var activeProgramIds = await db.ProgramRoutines
            .AsNoTracking()
            .Where(pr => pr.RoutineId == request.RoutineId)
            .Join(db.Programs.Where(p => p.IsActive),
                pr => pr.ProgramId, p => p.Id,
                (pr, p) => p.Id)
            .Distinct()
            .ToListAsync(cancellationToken);

        var activeAssignmentCount = activeProgramIds.Count > 0
            ? await db.ProgramAssignments
                .CountAsync(pa => activeProgramIds.Contains(pa.ProgramId)
                    && pa.Status == ProgramAssignmentStatus.Active, cancellationToken)
            : 0;

        var hasSessions = await db.WorkoutSessions
            .AnyAsync(ws => ws.RoutineId == request.RoutineId, cancellationToken);

        return new RoutineUsageDto(activeProgramIds.Count, activeAssignmentCount, hasSessions);
    }
}
```

- [x] **Step 3: Add API endpoint**

In `src/Kondix.Api/Controllers/RoutinesController.cs`, add after the Delete endpoint (after line 54):

```csharp
[HttpGet("{id:guid}/usage")]
public async Task<IActionResult> GetUsage(Guid id, CancellationToken ct)
{
    HttpContext.RequirePermission(Permissions.GymManage);
    var result = await mediator.Send(
        new GetRoutineUsageQuery(id, HttpContext.GetTrainerId()), ct);
    return Ok(result);
}
```

Add the using at the top of the file:

```csharp
using Kondix.Application.Queries.Routines;
```

- [x] **Step 4: Add TypeScript interface**

In `kondix-web/src/app/shared/models/index.ts`, add after the existing routine interfaces:

```typescript
export interface RoutineUsageDto {
  activeProgramCount: number;
  activeAssignmentCount: number;
  hasSessions: boolean;
}
```

- [x] **Step 5: Build both**

Run: `dotnet build Kondix.slnx && cd kondix-web && npx ng build --configuration development 2>&1 | tail -5`
Expected: Both succeed

- [x] **Step 6: Commit**

```bash
git add src/Kondix.Application/Queries/Routines/GetRoutineUsageQuery.cs \
        src/Kondix.Application/DTOs/RoutineDtos.cs \
        src/Kondix.Api/Controllers/RoutinesController.cs \
        kondix-web/src/app/shared/models/index.ts
git commit -m "feat: add GetRoutineUsage query and endpoint

Returns activeProgramCount, activeAssignmentCount, and hasSessions
for a routine. Frontend uses this to show warnings before editing."
```

---

### Task 6: Extend GetProgramAssignmentsQuery — support history + filter by student

Currently only returns Active assignments. We need all statuses for history and filtering by studentId.

**Files:**
- Modify: `src/Kondix.Application/Queries/ProgramAssignments/GetProgramAssignmentsQuery.cs`
- Modify: `src/Kondix.Api/Controllers/ProgramAssignmentsController.cs:15-21`

- [x] **Step 1: Add optional params to query**

Replace the full file `src/Kondix.Application/Queries/ProgramAssignments/GetProgramAssignmentsQuery.cs`:

```csharp
using Kondix.Application.Common.Helpers;
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.ProgramAssignments;

public sealed record GetProgramAssignmentsQuery(
    Guid TrainerId,
    Guid? StudentId = null,
    bool ActiveOnly = true) : IRequest<List<ProgramAssignmentDto>>;

public sealed class GetProgramAssignmentsHandler(IKondixDbContext db)
    : IRequestHandler<GetProgramAssignmentsQuery, List<ProgramAssignmentDto>>
{
    public async Task<List<ProgramAssignmentDto>> Handle(GetProgramAssignmentsQuery request, CancellationToken cancellationToken)
    {
        var query = db.ProgramAssignments
            .AsNoTracking()
            .Include(pa => pa.Program)
            .Include(pa => pa.Student)
            .Where(pa => pa.Program.TrainerId == request.TrainerId);

        if (request.StudentId.HasValue)
            query = query.Where(pa => pa.StudentId == request.StudentId.Value);

        if (request.ActiveOnly)
            query = query.Where(pa => pa.Status == ProgramAssignmentStatus.Active);

        var assignments = await query
            .OrderByDescending(pa => pa.CreatedAt)
            .ToListAsync(cancellationToken);

        return assignments.Select(pa => new ProgramAssignmentDto(
            pa.Id, pa.ProgramId, pa.Program.Name,
            pa.StudentId, pa.Student.DisplayName,
            pa.Mode.ToString(), pa.Status.ToString(),
            pa.TrainingDays,
            pa.StartDate.ToString("yyyy-MM-dd"),
            pa.EndDate.ToString("yyyy-MM-dd"),
            ProgramWeekHelper.CalculateCurrentWeek(pa.StartDate),
            pa.Program.DurationWeeks,
            pa.CreatedAt)).ToList();
    }
}
```

- [x] **Step 2: Update controller to pass query params**

In `src/Kondix.Api/Controllers/ProgramAssignmentsController.cs`, replace the GetAll method (lines 15-21):

```csharp
[HttpGet]
public async Task<IActionResult> GetAll(
    [FromQuery] Guid? studentId,
    [FromQuery] bool activeOnly = true,
    CancellationToken ct = default)
{
    HttpContext.RequirePermission(Permissions.GymManage);
    var result = await mediator.Send(
        new GetProgramAssignmentsQuery(HttpContext.GetTrainerId(), studentId, activeOnly), ct);
    return Ok(result);
}
```

- [x] **Step 3: Build and verify**

Run: `dotnet build Kondix.slnx`
Expected: Build succeeded

- [x] **Step 4: Commit**

```bash
git add src/Kondix.Application/Queries/ProgramAssignments/GetProgramAssignmentsQuery.cs \
        src/Kondix.Api/Controllers/ProgramAssignmentsController.cs
git commit -m "feat: extend GetProgramAssignments with studentId filter and history

Adds optional studentId and activeOnly query params. Defaults to
activeOnly=true for backward compatibility. Frontend uses
activeOnly=false to show assignment history."
```

---

### Task 7: Frontend — cancel assignment button + assignment history

Add a cancel button on the active assignment card in student detail, and show assignment history below.

**Files:**
- Modify: `kondix-web/src/app/features/trainer/students/feature/student-detail.ts`

- [x] **Step 1: Add cancel state and method**

In the class body (after line 239), add:

```typescript
cancelling = signal(false);

cancelAssignment(): void {
  const assignment = this.activeAssignment();
  if (!assignment) return;

  this.cancelling.set(true);
  this.api.delete(`/program-assignments/${assignment.id}`).subscribe({
    next: () => {
      this.assignments.update(list =>
        list.map(a => a.id === assignment.id ? { ...a, status: 'Cancelled' as const } : a)
      );
      this.cancelling.set(false);
      this.toast.show('Programa cancelado');
    },
    error: (err) => {
      this.cancelling.set(false);
      this.toast.show(err.error?.error ?? 'Error al cancelar', 'error');
    },
  });
}
```

- [x] **Step 2: Add pastAssignments computed signal**

After the `activeAssignment` computed (line 231), add:

```typescript
pastAssignments = computed(() =>
  this.assignments().filter(a => a.status !== 'Active')
);
```

- [x] **Step 3: Load full assignment history**

In the `loadAll` method, change the assignments fetch (line 332) from:

```typescript
this.api.get<ProgramAssignmentDto[]>(`/program-assignments?studentId=${id}`).subscribe({
```

to:

```typescript
this.api.get<ProgramAssignmentDto[]>(`/program-assignments?studentId=${id}&activeOnly=false`).subscribe({
```

- [x] **Step 4: Add cancel button to active assignment card template**

In the template, replace the active assignment card (lines 112-130) with:

```html
<div class="rounded-2xl p-4 overflow-hidden"
  style="background: linear-gradient(135deg, #B31D2C 0%, #E62639 60%, #FF4D5E 100%)">
  <p class="text-overline text-white/60 mb-1">PROGRAMA ACTUAL</p>
  <div class="flex items-start justify-between gap-2 mb-3">
    <h3 class="font-display text-base font-bold text-white leading-tight">
      {{ activeAssignment()!.programName }}
    </h3>
    <kx-badge
      [text]="activeAssignment()!.mode === 'Rotation' ? 'Rotación' : 'Fijo'"
      variant="neutral" />
  </div>
  <p class="text-white/70 text-xs mb-2">
    Semana {{ activeAssignment()!.currentWeek }} de {{ activeAssignment()!.totalWeeks }}
  </p>
  <kx-progress-bar
    [percentage]="weekProgress()"
    [showLabel]="false"
    size="md" />
  <button type="button" (click)="confirmCancel.set(true)"
    class="mt-3 w-full py-2 bg-white/10 text-white/80 text-xs rounded-lg border border-white/20
           hover:bg-white/20 transition press">
    @if (cancelling()) { Cancelando... } @else { Cancelar programa }
  </button>
</div>
```

- [x] **Step 5: Add confirm dialog state and template**

Add signal in class body:

```typescript
confirmCancel = signal(false);
```

Add at the end of the template (before the closing `</div>` of the component, after the activity timeline):

```html
<kx-confirm-dialog
  [open]="confirmCancel()"
  title="Cancelar programa"
  message="El alumno dejará de ver este programa. El historial de sesiones se conserva. ¿Continuar?"
  confirmLabel="Cancelar programa"
  variant="danger"
  (confirm)="cancelAssignment(); confirmCancel.set(false)"
  (cancel)="confirmCancel.set(false)" />
```

- [x] **Step 6: Add assignment history section to template**

After the current program card section (after line 196 `</div>`), add:

```html
<!-- Assignment history -->
@if (pastAssignments().length > 0) {
  <div class="mb-6">
    <div class="bg-card border border-border rounded-2xl p-4">
      <p class="text-overline text-text-secondary mb-3">HISTORIAL DE PROGRAMAS</p>
      @for (pa of pastAssignments(); track pa.id) {
        <div class="flex items-center justify-between py-2 border-b border-border last:border-0">
          <div>
            <p class="text-sm text-text font-medium">{{ pa.programName }}</p>
            <p class="text-xs text-text-muted">
              {{ pa.startDate | date:'dd MMM yyyy' }} — {{ pa.endDate | date:'dd MMM yyyy' }}
            </p>
          </div>
          <kx-badge
            [text]="pa.status === 'Completed' ? 'Completado' : 'Cancelado'"
            [variant]="pa.status === 'Completed' ? 'success' : 'neutral'" />
        </div>
      }
    </div>
  </div>
}
```

- [x] **Step 7: Add DatePipe import**

In the component imports array, add `DatePipe`:

```typescript
import { DatePipe } from '@angular/common';
// ... in @Component imports:
imports: [..., DatePipe],
```

- [x] **Step 8: Build and verify**

Run: `cd kondix-web && npx ng build --configuration development 2>&1 | tail -10`
Expected: Build succeeded

- [x] **Step 9: Commit**

```bash
git add kondix-web/src/app/features/trainer/students/feature/student-detail.ts
git commit -m "feat: add cancel program button and assignment history to student detail

Trainer can now cancel a student's active program with confirmation dialog.
Past programs (completed/cancelled) shown in history section below."
```

---

### Task 8: Frontend — warning on routine edit

Show a warning banner in the routine wizard when editing a routine that has sessions or is used in active programs.

**Files:**
- Modify: `kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts:553-554,577-581,940-982,77,986`

- [x] **Step 1: Add usage signal**

At line 554 (after `isEdit = signal(false);`), add:

```typescript
usage = signal<RoutineUsageDto | null>(null);
```

Add to the imports at the top of the file:

```typescript
import { RoutineUsageDto } from '../../../../shared/models';
```

- [x] **Step 2: Fetch usage data on edit load**

In `ngOnInit()` at line 577-581, the wizard checks `this.routineId` and calls `this.loadRoutine()`. Add the usage fetch right after `loadRoutine()`:

Replace lines 577-585:
```typescript
ngOnInit() {
  this.routineId = this.route.snapshot.paramMap.get('id') ?? '';
  if (this.routineId) {
    this.isEdit.set(true);
    this.loadRoutine();
    this.api.get<RoutineUsageDto>(`/routines/${this.routineId}/usage`).subscribe({
      next: (u) => this.usage.set(u),
    });
  } else {
    this.days.set([this.newDay()]);
  }
}
```

- [x] **Step 3: Add warning banner in step 1 template**

At line 77, right after `<h2 class="text-h1 text-text">{{ isEdit() ? 'Editar rutina' : 'Nueva rutina' }}</h2>`, add:

```html
@if (usage()?.hasSessions) {
  <div class="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-4">
    <p class="text-warning text-sm font-semibold">Rutina con sesiones registradas</p>
    <p class="text-warning/70 text-xs mt-1">
      No se puede editar porque tiene sesiones. Usa "Duplicar" desde la lista para crear una versión nueva.
    </p>
  </div>
} @else if (usage()?.activeAssignmentCount) {
  <div class="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-4">
    <p class="text-warning text-sm font-semibold">Rutina en uso</p>
    <p class="text-warning/70 text-xs mt-1">
      Esta rutina está en {{ usage()!.activeProgramCount }} programa(s) con
      {{ usage()!.activeAssignmentCount }} alumno(s) activo(s).
      Los cambios se aplicarán en su próxima sesión.
    </p>
  </div>
}
```

- [x] **Step 3: Disable save if hasSessions**

In the `save()` method, add a guard at the top:

```typescript
if (this.usage()?.hasSessions) {
  this.toast.show('Esta rutina tiene sesiones. Duplicala para editarla.', 'error');
  return;
}
```

- [x] **Step 4: Build and verify**

Run: `cd kondix-web && npx ng build --configuration development 2>&1 | tail -10`
Expected: Build succeeded

- [x] **Step 5: Commit**

```bash
git add kondix-web/src/app/features/trainer/routines/feature/routine-wizard.ts
git commit -m "feat: show warning when editing routine with sessions or active assignments

Blocks save if routine has sessions (directs to duplicate).
Shows informational warning if routine is in active programs."
```

---

### Task 9: Frontend — warning on program edit

Show a warning in the program form when editing a program that has active assignments.

**Files:**
- Modify: `kondix-web/src/app/features/trainer/programs/feature/program-form.ts:164,179-193,274-289,29`

- [x] **Step 1: Add active assignment count signal**

At line 164 (after `showDeleteDialog = signal(false);`), add:

```typescript
activeAssignmentCount = signal(0);
```

- [x] **Step 2: Fetch assignment count on edit load**

In `ngOnInit()` (lines 179-193), after `this.isEdit.set(!!this.programId);`, add the fetch inside the `if (this.isEdit())` block. Replace lines 186-188:

```typescript
if (this.isEdit()) {
  this.loadProgram();
  this.api.get<ProgramAssignmentDto[]>('/program-assignments?activeOnly=true').subscribe({
    next: (assignments) => {
      const count = assignments.filter(a => a.programId === this.programId).length;
      this.activeAssignmentCount.set(count);
    },
  });
}
```

Note: `this.programId` is a plain string property (line 173: `private programId = '';`), not a signal.

Add to the imports at the top of the file:

```typescript
import { ProgramAssignmentDto } from '../../../../shared/models';
```

- [x] **Step 3: Add warning banner in template**

At line 29, right after `{{ isEdit() ? 'Editar programa' : 'Nuevo programa' }}`, add the warning block (before the form fields):

```html
@if (activeAssignmentCount() > 0) {
  <div class="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-4">
    <p class="text-warning text-sm font-semibold">Programa con alumnos asignados</p>
    <p class="text-warning/70 text-xs mt-1">
      {{ activeAssignmentCount() }} alumno(s) tienen este programa activo.
      Puedes cambiar nombre y duración, pero para modificar las rutinas
      debes cancelar las asignaciones primero.
    </p>
  </div>
}
```

- [x] **Step 3: Build and verify**

Run: `cd kondix-web && npx ng build --configuration development 2>&1 | tail -10`
Expected: Build succeeded

- [x] **Step 4: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/feature/program-form.ts
git commit -m "feat: show warning when editing program with active assignments

Informs trainer about active students and that routine changes
require cancelling assignments first. Backend enforces the rule."
```

---

## Verification Checklist

After all tasks, verify these scenarios manually in the browser:

- [x] **V1:** Edit a routine that has NO sessions → should work normally
- [x] **V2:** Try to edit a routine that HAS sessions → should show warning and block save
- [x] **V3:** Try to assign a second program to a student with active program → should error
- [x] **V4:** Cancel a student's program from student detail → should work with confirmation
- [x] **V5:** After cancel, assign a new program → should work
- [x] **V6:** Edit program name with active assignments → should work
- [x] **V7:** Try to change program routines with active assignments → should error with count
- [x] **V8:** After cancelling all assignments, change program routines → should work
- [x] **V9:** Delete a program with active assignments → should auto-cancel and succeed
- [x] **V10:** Check student detail shows assignment history (cancelled/completed)
