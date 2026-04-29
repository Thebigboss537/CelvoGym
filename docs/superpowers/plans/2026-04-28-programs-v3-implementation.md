# Programs v3 (C1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Kondix Programs model with a week × day grid persisted as the program's truth, per the spec at `docs/superpowers/specs/2026-04-28-programs-v3-design.md`. Trainers edit a calendar of slots; students execute that calendar.

**Architecture:** Six phases on the existing .NET 10 + Angular 21 stack. ONE destructive EF migration that wipes existing program/assignment/session data and reshapes schemas. Ten new Angular components. New `ProgramEditorStore` (NgRx SignalStore). Two-mode editor (Week vs Numbered) with `scheduleType` immutable after creation.

**Tech Stack:** .NET 10, EF Core 10, MediatR, FluentValidation, PostgreSQL 17, Angular 21 (standalone + signals), Tailwind CSS 4, Lucide icons, NgRx SignalStore, xUnit + FluentAssertions + NSubstitute + EF InMemory for backend tests, Vitest for frontend.

**Shipping order:** Phase 1 → 2 → 3 → 4 → 5 → 6. Each phase ends with a green build and a manual smoke checkpoint. Per the project memory, no Playwright E2E and no subagent dispatch for tests in this repo — execute inline.

---

## File Map

| Action | File | Phase | Responsibility |
|---|---|---|---|
| Create | `src/Kondix.Domain/Enums/ProgramObjective.cs` | 1 | Objective enum |
| Create | `src/Kondix.Domain/Enums/ProgramLevel.cs` | 1 | Level enum |
| Create | `src/Kondix.Domain/Enums/ProgramMode.cs` | 1 | Fixed / Loop |
| Create | `src/Kondix.Domain/Enums/ProgramScheduleType.cs` | 1 | Week / Numbered |
| Create | `src/Kondix.Domain/Enums/ProgramSlotKind.cs` | 1 | Empty / Rest / RoutineDay |
| Create | `src/Kondix.Domain/Enums/ProgramAssignmentStatus.cs` | 1 | Active / Completed / Cancelled |
| Modify | `src/Kondix.Domain/Entities/Program.cs` | 1 | Reshape — drop DurationWeeks/IsActive, add Notes/Objective/Level/Mode/ScheduleType/DaysPerWeek/IsPublished |
| Create | `src/Kondix.Domain/Entities/ProgramWeek.cs` | 1 | New entity |
| Create | `src/Kondix.Domain/Entities/ProgramSlot.cs` | 1 | New entity |
| Modify | `src/Kondix.Domain/Entities/ProgramAssignment.cs` | 1 | Drop Mode/TrainingDays/FixedScheduleJson/RotationIndex/DurationWeeks |
| Modify | `src/Kondix.Domain/Entities/WorkoutSession.cs` | 1 | Add WeekIndex/SlotIndex |
| Delete | `src/Kondix.Domain/Entities/ProgramRoutine.cs` | 1 | Obsolete |
| Delete | `src/Kondix.Domain/Entities/ProgramWeekOverride.cs` | 1 | Obsolete (Phase 5 v2) |
| Create | `src/Kondix.Infrastructure/Persistence/Configurations/ProgramConfiguration.cs` | 1 | EF mapping for reshaped Program |
| Create | `src/Kondix.Infrastructure/Persistence/Configurations/ProgramWeekConfiguration.cs` | 1 | EF mapping |
| Create | `src/Kondix.Infrastructure/Persistence/Configurations/ProgramSlotConfiguration.cs` | 1 | EF mapping |
| Modify | `src/Kondix.Infrastructure/Persistence/Configurations/ProgramAssignmentConfiguration.cs` | 1 | Drop columns |
| Modify | `src/Kondix.Infrastructure/Persistence/Configurations/WorkoutSessionConfiguration.cs` | 1 | Add new columns |
| Modify | `src/Kondix.Infrastructure/Persistence/KondixDbContext.cs` | 1 | Add ProgramWeeks/ProgramSlots; remove ProgramRoutines/ProgramWeekOverrides |
| Modify | `src/Kondix.Application/Common/Interfaces/IKondixDbContext.cs` | 1 | Same updates |
| Create | `src/Kondix.Infrastructure/Migrations/{ts}_ProgramsV3Refactor.cs` | 1 | Single destructive migration |
| Modify | `src/Kondix.Application/DTOs/ProgramDtos.cs` | 1 | New DTO shapes |
| Modify | `src/Kondix.Application/Queries/Programs/GetProgramByIdQuery.cs` | 1 | Project new shape |
| Modify | `src/Kondix.Application/Queries/Programs/GetProgramsQuery.cs` | 1 | Project summary shape |
| Delete | `src/Kondix.Application/Queries/Programs/GetProgramWeekOverridesQuery.cs` | 1 | Obsolete |
| Delete | `src/Kondix.Application/Commands/Programs/UpsertProgramWeekOverrideCommand.cs` | 1 | Obsolete |
| Modify | `src/Kondix.Api/Controllers/ProgramsController.cs` | 1, 2 | Wire all new endpoints |
| Modify | `src/Kondix.Application/Commands/Programs/CreateProgramCommand.cs` | 2 | New shape — seeds empty weeks |
| Modify | `src/Kondix.Application/Commands/Programs/UpdateProgramCommand.cs` | 2 | Update metadata only |
| Create | `src/Kondix.Application/Commands/Programs/PublishProgramCommand.cs` | 2 | Flip IsPublished |
| Create | `src/Kondix.Application/Commands/Programs/DuplicateProgramCommand.cs` | 2 | Deep clone |
| Create | `src/Kondix.Application/Commands/Programs/AddWeekCommand.cs` | 2 | Append week |
| Create | `src/Kondix.Application/Commands/Programs/DuplicateWeekCommand.cs` | 2 | Insert copy at N+1 |
| Create | `src/Kondix.Application/Commands/Programs/DeleteWeekCommand.cs` | 2 | Remove + reindex |
| Create | `src/Kondix.Application/Commands/Programs/SetSlotCommand.cs` | 2 | Set slot to Empty/Rest |
| Create | `src/Kondix.Application/Commands/Programs/AssignRoutineToProgramCommand.cs` | 2 | Apply routine block |
| Create | `src/Kondix.Application/Commands/Programs/RemoveBlockCommand.cs` | 2 | Remove all slots in block |
| Create | `src/Kondix.Application/Commands/Programs/FillRestCommand.cs` | 2 | Empty → Rest mass mutate |
| Modify | `src/Kondix.Application/Validators/CreateProgramValidator.cs` | 2 | New shape rules |
| Modify | `src/Kondix.Application/Commands/Routines/DeleteRoutineCommand.cs` | 2 | Cleanup orphan slots |
| Create | `kondix-web/src/app/features/trainer/programs/data-access/program-editor.store.ts` | 4 | NgRx SignalStore |
| Modify | `kondix-web/src/app/features/trainer/programs/data-access/programs.store.ts` | 6 | Filters + redesigned card data |
| Modify | `kondix-web/src/app/features/trainer/programs/data-access/programs.service.ts` | 1, 2, 6 | Add new endpoints |
| Modify | `kondix-web/src/app/shared/models/index.ts` | 1, 4 | New DTO interfaces |
| Create | `kondix-web/src/app/features/trainer/programs/ui/create-program-modal.ts` | 3 | `<kx-create-program-modal>` |
| Replace | `kondix-web/src/app/features/trainer/programs/feature/program-form.ts` | 4 | Editor shell — replaces existing 629 LOC |
| Create | `kondix-web/src/app/features/trainer/programs/ui/program-meta-panel.ts` | 4 | Left column |
| Create | `kondix-web/src/app/features/trainer/programs/ui/program-week-row.ts` | 4 | One week row |
| Create | `kondix-web/src/app/features/trainer/programs/ui/program-day-cell.ts` | 4 | One cell, 3 visual states |
| Create | `kondix-web/src/app/features/trainer/programs/ui/cell-inspector.ts` | 4 | Right inspector |
| Create | `kondix-web/src/app/features/trainer/programs/ui/assign-routine-modal.ts` | 4 | 2-step wizard |
| Create | `kondix-web/src/app/features/trainer/programs/utils/weekday-mapping.ts` | 4 | Auto-suggest helper |
| Create | `kondix-web/src/app/features/trainer/programs/utils/weekday-mapping.spec.ts` | 4 | Vitest spec |
| Modify | `src/Kondix.Application/Queries/StudentPortal/GetNextWorkoutQuery.cs` | 5 | Two-mode rewrite |
| Create | `src/Kondix.Application/Queries/StudentPortal/GetThisWeekQuery.cs` | 5 | Numbered-mode bucket |
| Modify | `src/Kondix.Application/Commands/Sessions/StartSessionCommand.cs` | 5 | Persist WeekIndex/SlotIndex |
| Modify | `kondix-web/src/app/features/student/feature/home.ts` | 5 | Numbered branch + recovery gating |
| Modify | `kondix-web/src/app/features/student/feature/calendar.ts` | 5 | Numbered hides calendar grid |
| Replace | `kondix-web/src/app/features/trainer/programs/ui/assign-program-modal.ts` | 6 | Minimal modal |
| Replace | `kondix-web/src/app/features/trainer/programs/ui/program-card.ts` | 6 | Card redesign |
| Modify | `kondix-web/src/app/features/trainer/programs/feature/program-list.ts` | 6 | Filters |
| Modify | `kondix-web/src/app/shared/utils/objective-color.ts` | 6 | Helper for derived color |
| Modify | `CLAUDE.md` | 6 | Document new shape |
| Modify | `kondix-web/.impeccable.md` | 6 | Component inventory |

---

## Cross-cutting conventions

Read before starting any phase. Apply to every task.

### Backend
- **Schema:** `kondix`.
- **Migrations:** add with `dotnet ef migrations add <Name> --project src/Kondix.Infrastructure --startup-project src/Kondix.Api --output-dir Migrations`. Inspect generated `Up`/`Down` before committing. Verify with `dotnet ef migrations script <From> <To>`.
- **Enums** stored as PascalCase strings via `JsonStringEnumConverter` + `EnumToStringConverter`. DB column `varchar(32)`.
- **Ownership scoping** at the top of every handler that takes a `Guid` resource id:
  ```csharp
  var owns = await db.Programs.AnyAsync(
      p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId,
      cancellationToken);
  if (!owns) throw new InvalidOperationException("Program not found");
  ```
- **Test coverage:**
  - Unit tests per handler → `tests/Kondix.UnitTests/Commands/<Name>HandlerTests.cs` using xUnit + FluentAssertions + NSubstitute + `UseInMemoryDatabase(Guid.NewGuid().ToString())`.
  - Validators → `tests/Kondix.UnitTests/Validators/<Name>ValidatorTests.cs`.
  - Architecture tests must stay green: `dotnet test tests/Kondix.ArchTests/Kondix.ArchTests.csproj`.
- **Controllers:** primary constructor `(IMediator mediator)`. Request DTOs as `sealed record` at bottom of file. Trainer endpoints use inline `HttpContext.RequirePermission(Permissions.GymManage)` and `HttpContext.GetTrainerId()`.
- **Date types:** `DateTimeOffset` everywhere. `DateOnly` only for pure calendar dates.

### Frontend
- **Standalone components only.** Inline template + styles in `.ts`. Class names without `Component` suffix.
- **Signal inputs:** `input()` / `input.required<T>()`. Outputs: `output<T>()`.
- **Templates:** `@if` / `@for` / `@switch`. Signals called as functions: `{{ count() }}`.
- **OnPush + signals:** use `computed()` for derived state. NOT method calls in templates.
- **Subscriptions in `ngOnInit`:** wrap with `takeUntilDestroyed(inject(DestroyRef))`.
- **Lucide icons:** kebab-case names; register via `LucideAngularModule` in `imports` + `LucideIconProvider` in `providers`.
- **Tailwind 4:** `font-display` class; tokens declared in `@theme` in `styles.css`.
- **Class-binding gotcha:** `[class.bg-primary/10]` and `[class.hover:foo]` DO NOT compile. Use `[ngClass]` array or `[style.*]` or static class strings.
- **Frontend tests:** Vitest only. Spec colocated as `*.spec.ts`. Run: `cd kondix-web && npm run test -- --run`.

### Commit cadence
Commit after every passing test or every working step. Conventional commits: `feat(scope):`, `fix(scope):`, `refactor(scope):`, `chore(scope):`. Always include the trailer:
```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

# Phase 1 — Foundation (domain + migration + read endpoints)

**Goal:** New domain model, single destructive migration, read endpoints (GET list, GET detail) returning the new shape. After this phase, the API responds with the new schema; write endpoints come in Phase 2.

**Verification at end of phase:**
- `dotnet build Kondix.slnx` clean.
- `dotnet test Kondix.slnx` green (architecture + new query tests).
- `dotnet ef migrations script` produces SQL matching the spec §7 strategy.

---

### Task 1.1: Add domain enums

**Files:**
- Create: `src/Kondix.Domain/Enums/ProgramObjective.cs`
- Create: `src/Kondix.Domain/Enums/ProgramLevel.cs`
- Create: `src/Kondix.Domain/Enums/ProgramMode.cs`
- Create: `src/Kondix.Domain/Enums/ProgramScheduleType.cs`
- Create: `src/Kondix.Domain/Enums/ProgramSlotKind.cs`
- Create: `src/Kondix.Domain/Enums/ProgramAssignmentStatus.cs`

- [ ] **Step 1: Create `ProgramObjective.cs`**

```csharp
namespace Kondix.Domain.Enums;

public enum ProgramObjective
{
    Hipertrofia,
    Fuerza,
    Resistencia,
    Funcional,
    Rendimiento,
    Otro
}
```

- [ ] **Step 2: Create `ProgramLevel.cs`**

```csharp
namespace Kondix.Domain.Enums;

public enum ProgramLevel
{
    Principiante,
    Intermedio,
    Avanzado,
    Todos
}
```

- [ ] **Step 3: Create `ProgramMode.cs`**

```csharp
namespace Kondix.Domain.Enums;

public enum ProgramMode
{
    Fixed,
    Loop
}
```

- [ ] **Step 4: Create `ProgramScheduleType.cs`**

```csharp
namespace Kondix.Domain.Enums;

public enum ProgramScheduleType
{
    Week,
    Numbered
}
```

- [ ] **Step 5: Create `ProgramSlotKind.cs`**

```csharp
namespace Kondix.Domain.Enums;

public enum ProgramSlotKind
{
    Empty,
    Rest,
    RoutineDay
}
```

- [ ] **Step 6: Create `ProgramAssignmentStatus.cs`** (replaces existing if it lives elsewhere; check `Domain/Enums` first)

```csharp
namespace Kondix.Domain.Enums;

public enum ProgramAssignmentStatus
{
    Active,
    Completed,
    Cancelled
}
```

If the existing `ProgramStatus` enum already covers this with the same values, delete `ProgramStatus` after Task 1.5 (when assignment entity is reshaped).

- [ ] **Step 7: Build and commit**

```bash
dotnet build Kondix.slnx
git add src/Kondix.Domain/Enums/Program*.cs
git commit -m "feat(domain): add Programs v3 enums"
```

Expected: build success.

---

### Task 1.2: Reshape `Program` entity

**Files:**
- Modify: `src/Kondix.Domain/Entities/Program.cs`

- [ ] **Step 1: Replace contents of `Program.cs`**

```csharp
using Kondix.Domain.Common;
using Kondix.Domain.Enums;

namespace Kondix.Domain.Entities;

public class Program : BaseEntity, IAuditableEntity
{
    public Guid TrainerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public ProgramObjective Objective { get; set; } = ProgramObjective.Otro;
    public ProgramLevel Level { get; set; } = ProgramLevel.Todos;
    public ProgramMode Mode { get; set; } = ProgramMode.Fixed;
    public ProgramScheduleType ScheduleType { get; set; } = ProgramScheduleType.Week;
    public int? DaysPerWeek { get; set; }
    public bool IsPublished { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Trainer Trainer { get; set; } = null!;
    public ICollection<ProgramWeek> Weeks { get; set; } = [];
    public ICollection<ProgramAssignment> Assignments { get; set; } = [];
}
```

This intentionally drops `DurationWeeks`, `IsActive`, and `ProgramRoutines`. The build will break until we delete `ProgramRoutine.cs` in Task 1.7 — that's expected and we'll fix it then.

- [ ] **Step 2: Commit (build will be red — that's OK, gets fixed in 1.3-1.7)**

```bash
git add src/Kondix.Domain/Entities/Program.cs
git commit -m "refactor(domain): reshape Program entity for v3"
```

---

### Task 1.3: Create `ProgramWeek` entity

**Files:**
- Create: `src/Kondix.Domain/Entities/ProgramWeek.cs`

- [ ] **Step 1: Create the file**

```csharp
using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class ProgramWeek : BaseEntity
{
    public Guid ProgramId { get; set; }
    public int WeekIndex { get; set; }
    public string Label { get; set; } = string.Empty;

    public Program Program { get; set; } = null!;
    public ICollection<ProgramSlot> Slots { get; set; } = [];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Kondix.Domain/Entities/ProgramWeek.cs
git commit -m "feat(domain): add ProgramWeek entity"
```

---

### Task 1.4: Create `ProgramSlot` entity

**Files:**
- Create: `src/Kondix.Domain/Entities/ProgramSlot.cs`

- [ ] **Step 1: Create the file**

```csharp
using Kondix.Domain.Common;
using Kondix.Domain.Enums;

namespace Kondix.Domain.Entities;

public class ProgramSlot : BaseEntity
{
    public Guid WeekId { get; set; }
    public int DayIndex { get; set; }
    public ProgramSlotKind Kind { get; set; } = ProgramSlotKind.Empty;
    public Guid? RoutineId { get; set; }
    public Guid? DayId { get; set; }
    public Guid? BlockId { get; set; }

    public ProgramWeek Week { get; set; } = null!;
    public Routine? Routine { get; set; }
    public Day? Day { get; set; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Kondix.Domain/Entities/ProgramSlot.cs
git commit -m "feat(domain): add ProgramSlot entity"
```

---

### Task 1.5: Reshape `ProgramAssignment` entity

**Files:**
- Modify: `src/Kondix.Domain/Entities/ProgramAssignment.cs`

- [ ] **Step 1: Read current state**

Open the file and note any imports / current shape. Replace the whole file with:

```csharp
using Kondix.Domain.Common;
using Kondix.Domain.Enums;

namespace Kondix.Domain.Entities;

public class ProgramAssignment : BaseEntity, IAuditableEntity
{
    public Guid TrainerId { get; set; }
    public Guid StudentId { get; set; }
    public Guid ProgramId { get; set; }
    public DateTimeOffset StartDate { get; set; }
    public ProgramAssignmentStatus Status { get; set; } = ProgramAssignmentStatus.Active;
    public DateTimeOffset UpdatedAt { get; set; }

    public Trainer Trainer { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Program Program { get; set; } = null!;
}
```

This drops `Mode`, `TrainingDays`, `FixedScheduleJson`, `RotationIndex`, `DurationWeeks`. The build still won't compile until Phase 1 is fully done.

- [ ] **Step 2: Commit**

```bash
git add src/Kondix.Domain/Entities/ProgramAssignment.cs
git commit -m "refactor(domain): drop legacy scheduling columns from ProgramAssignment"
```

---

### Task 1.6: Add `WeekIndex`/`SlotIndex` to `WorkoutSession`

**Files:**
- Modify: `src/Kondix.Domain/Entities/WorkoutSession.cs`

- [ ] **Step 1: Add the two int properties**

After `DayId` (or wherever the slot context naturally lives) add:

```csharp
public int WeekIndex { get; set; }
public int SlotIndex { get; set; }
```

Do not remove existing fields. Existing v2 fields (`Mood`, `IsRecovery`, `RecoversPlannedDate`, `FeedbackReviewedAt`) stay — the spec keeps those.

- [ ] **Step 2: Commit**

```bash
git add src/Kondix.Domain/Entities/WorkoutSession.cs
git commit -m "feat(domain): add WeekIndex+SlotIndex to WorkoutSession"
```

---

### Task 1.7: Delete obsolete entities

**Files:**
- Delete: `src/Kondix.Domain/Entities/ProgramRoutine.cs`
- Delete: `src/Kondix.Domain/Entities/ProgramWeekOverride.cs`
- Delete (if present): `src/Kondix.Domain/Enums/AssignmentMode.cs`

- [ ] **Step 1: Delete files**

```bash
git rm src/Kondix.Domain/Entities/ProgramRoutine.cs
git rm src/Kondix.Domain/Entities/ProgramWeekOverride.cs
# Check if AssignmentMode enum exists; if so:
git rm src/Kondix.Domain/Enums/AssignmentMode.cs 2>/dev/null || true
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore(domain): remove obsolete Programs v2 entities"
```

---

### Task 1.8: EF configuration for `Program`

**Files:**
- Create: `src/Kondix.Infrastructure/Persistence/Configurations/ProgramConfiguration.cs` (replace if exists)

- [ ] **Step 1: Write the config**

```csharp
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class ProgramConfiguration : IEntityTypeConfiguration<Program>
{
    public void Configure(EntityTypeBuilder<Program> b)
    {
        b.ToTable("programs");
        b.HasKey(p => p.Id);
        b.Property(p => p.Name).HasMaxLength(120).IsRequired();
        b.Property(p => p.Description).HasMaxLength(2000);
        b.Property(p => p.Notes).HasMaxLength(4000);
        b.Property(p => p.Objective).HasConversion<string>().HasMaxLength(32).IsRequired();
        b.Property(p => p.Level).HasConversion<string>().HasMaxLength(32).IsRequired();
        b.Property(p => p.Mode).HasConversion<string>().HasMaxLength(16).IsRequired();
        b.Property(p => p.ScheduleType).HasConversion<string>().HasMaxLength(16).IsRequired();
        b.Property(p => p.DaysPerWeek);
        b.Property(p => p.IsPublished).IsRequired();
        b.Property(p => p.CreatedAt).IsRequired();
        b.Property(p => p.UpdatedAt).IsRequired();

        b.HasOne(p => p.Trainer)
            .WithMany()
            .HasForeignKey(p => p.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasMany(p => p.Weeks)
            .WithOne(w => w.Program)
            .HasForeignKey(w => w.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(p => p.TrainerId);
        b.HasIndex(p => p.IsPublished);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Kondix.Infrastructure/Persistence/Configurations/ProgramConfiguration.cs
git commit -m "feat(infra): EF config for reshaped Program"
```

---

### Task 1.9: EF configurations for `ProgramWeek` and `ProgramSlot`

**Files:**
- Create: `src/Kondix.Infrastructure/Persistence/Configurations/ProgramWeekConfiguration.cs`
- Create: `src/Kondix.Infrastructure/Persistence/Configurations/ProgramSlotConfiguration.cs`

- [ ] **Step 1: Write `ProgramWeekConfiguration.cs`**

```csharp
using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class ProgramWeekConfiguration : IEntityTypeConfiguration<ProgramWeek>
{
    public void Configure(EntityTypeBuilder<ProgramWeek> b)
    {
        b.ToTable("program_weeks");
        b.HasKey(w => w.Id);
        b.Property(w => w.WeekIndex).IsRequired();
        b.Property(w => w.Label).HasMaxLength(64).IsRequired();
        b.Property(w => w.CreatedAt).IsRequired();

        b.HasMany(w => w.Slots)
            .WithOne(s => s.Week)
            .HasForeignKey(s => s.WeekId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(w => new { w.ProgramId, w.WeekIndex }).IsUnique();
    }
}
```

- [ ] **Step 2: Write `ProgramSlotConfiguration.cs`**

```csharp
using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class ProgramSlotConfiguration : IEntityTypeConfiguration<ProgramSlot>
{
    public void Configure(EntityTypeBuilder<ProgramSlot> b)
    {
        b.ToTable("program_slots");
        b.HasKey(s => s.Id);
        b.Property(s => s.DayIndex).IsRequired();
        b.Property(s => s.Kind).HasConversion<string>().HasMaxLength(16).IsRequired();
        b.Property(s => s.CreatedAt).IsRequired();

        b.HasOne(s => s.Routine)
            .WithMany()
            .HasForeignKey(s => s.RoutineId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasOne(s => s.Day)
            .WithMany()
            .HasForeignKey(s => s.DayId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasIndex(s => new { s.WeekId, s.DayIndex }).IsUnique();
        b.HasIndex(s => s.RoutineId);
        b.HasIndex(s => s.BlockId);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/Kondix.Infrastructure/Persistence/Configurations/ProgramWeekConfiguration.cs \
        src/Kondix.Infrastructure/Persistence/Configurations/ProgramSlotConfiguration.cs
git commit -m "feat(infra): EF configs for ProgramWeek and ProgramSlot"
```

---

### Task 1.10: Update `ProgramAssignment` and `WorkoutSession` configs

**Files:**
- Modify: `src/Kondix.Infrastructure/Persistence/Configurations/ProgramAssignmentConfiguration.cs`
- Modify: `src/Kondix.Infrastructure/Persistence/Configurations/WorkoutSessionConfiguration.cs`

- [ ] **Step 1: Replace `ProgramAssignmentConfiguration.cs`**

```csharp
using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class ProgramAssignmentConfiguration : IEntityTypeConfiguration<ProgramAssignment>
{
    public void Configure(EntityTypeBuilder<ProgramAssignment> b)
    {
        b.ToTable("program_assignments");
        b.HasKey(a => a.Id);
        b.Property(a => a.Status).HasConversion<string>().HasMaxLength(16).IsRequired();
        b.Property(a => a.StartDate).IsRequired();
        b.Property(a => a.CreatedAt).IsRequired();
        b.Property(a => a.UpdatedAt).IsRequired();

        b.HasOne(a => a.Trainer).WithMany().HasForeignKey(a => a.TrainerId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(a => a.Student).WithMany().HasForeignKey(a => a.StudentId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(a => a.Program).WithMany(p => p.Assignments).HasForeignKey(a => a.ProgramId).OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(a => new { a.StudentId, a.Status });
        b.HasIndex(a => a.TrainerId);
    }
}
```

This intentionally drops Mode/TrainingDays/FixedScheduleJson/RotationIndex/DurationWeeks property mappings.

- [ ] **Step 2: Modify `WorkoutSessionConfiguration.cs`**

Add inside the `Configure` method (after existing property mappings, before relationships):

```csharp
b.Property(s => s.WeekIndex).IsRequired();
b.Property(s => s.SlotIndex).IsRequired();
```

Then replace any existing index that references `AssignmentId` alone with this composite index (or add it if none exists):

```csharp
b.HasIndex(s => new { s.AssignmentId, s.WeekIndex, s.SlotIndex, s.Status });
```

- [ ] **Step 3: Build and commit**

```bash
dotnet build Kondix.slnx
git add src/Kondix.Infrastructure/Persistence/Configurations/ProgramAssignmentConfiguration.cs \
        src/Kondix.Infrastructure/Persistence/Configurations/WorkoutSessionConfiguration.cs
git commit -m "refactor(infra): drop legacy assignment columns + add session slot context"
```

Expected: build still red (DbContext not updated yet); fix in next task.

---

### Task 1.11: Update `KondixDbContext` and `IKondixDbContext`

**Files:**
- Modify: `src/Kondix.Infrastructure/Persistence/KondixDbContext.cs`
- Modify: `src/Kondix.Application/Common/Interfaces/IKondixDbContext.cs`

- [ ] **Step 1: In `KondixDbContext.cs` add `DbSet`s**

Add these properties (alongside the existing ones):

```csharp
public DbSet<ProgramWeek> ProgramWeeks => Set<ProgramWeek>();
public DbSet<ProgramSlot> ProgramSlots => Set<ProgramSlot>();
```

And **remove** these:

```csharp
public DbSet<ProgramRoutine> ProgramRoutines => ...           // delete
public DbSet<ProgramWeekOverride> ProgramWeekOverrides => ... // delete
```

- [ ] **Step 2: Mirror in `IKondixDbContext.cs`**

Add:

```csharp
DbSet<ProgramWeek> ProgramWeeks { get; }
DbSet<ProgramSlot> ProgramSlots { get; }
```

Remove the corresponding lines for `ProgramRoutines` and `ProgramWeekOverrides`.

- [ ] **Step 3: Build**

```bash
dotnet build Kondix.slnx
```

Expected: most code under `Application/Commands/Programs/` will fail because `Program.DurationWeeks`, `Program.ProgramRoutines`, `IKondixDbContext.ProgramWeekOverrides` no longer exist. We delete those obsolete handlers next.

- [ ] **Step 4: Commit current state**

```bash
git add src/Kondix.Infrastructure/Persistence/KondixDbContext.cs \
        src/Kondix.Application/Common/Interfaces/IKondixDbContext.cs
git commit -m "refactor(infra): register Programs v3 DbSets"
```

---

### Task 1.12: Delete obsolete Application layer code

**Files:**
- Delete: `src/Kondix.Application/Queries/Programs/GetProgramWeekOverridesQuery.cs`
- Delete: `src/Kondix.Application/Commands/Programs/UpsertProgramWeekOverrideCommand.cs`
- Delete: `tests/Kondix.UnitTests/Commands/UpsertProgramWeekOverrideCommandHandlerTests.cs`

- [ ] **Step 1: Remove files**

```bash
git rm src/Kondix.Application/Queries/Programs/GetProgramWeekOverridesQuery.cs
git rm src/Kondix.Application/Commands/Programs/UpsertProgramWeekOverrideCommand.cs
git rm tests/Kondix.UnitTests/Commands/UpsertProgramWeekOverrideCommandHandlerTests.cs
```

- [ ] **Step 2: Build (still red — fix in 1.13)**

The remaining `CreateProgramCommand` / `UpdateProgramCommand` / `DeleteProgramCommand` / `GetProgramByIdQuery` / `GetProgramsQuery` still reference dropped properties. We rewrite them in this and Phase 2 tasks.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(app): remove obsolete week-overrides handlers"
```

---

### Task 1.13: Rewrite Program DTOs

**Files:**
- Modify: `src/Kondix.Application/DTOs/ProgramDtos.cs`

- [ ] **Step 1: Read current file**

```bash
cat src/Kondix.Application/DTOs/ProgramDtos.cs
```

- [ ] **Step 2: Replace contents**

```csharp
using Kondix.Domain.Enums;

namespace Kondix.Application.DTOs;

public sealed record ProgramSummaryDto(
    Guid Id,
    string Name,
    string? Description,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode,
    ProgramScheduleType ScheduleType,
    int? DaysPerWeek,
    int WeeksCount,
    int SessionsCount,
    int AssignedCount,
    bool IsPublished,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record ProgramDetailDto(
    Guid Id,
    string Name,
    string? Description,
    string? Notes,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode,
    ProgramScheduleType ScheduleType,
    int? DaysPerWeek,
    bool IsPublished,
    int AssignedCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    List<ProgramWeekDto> Weeks);

public sealed record ProgramWeekDto(
    Guid Id,
    int WeekIndex,
    string Label,
    List<ProgramSlotDto> Slots);

public sealed record ProgramSlotDto(
    Guid Id,
    int DayIndex,
    ProgramSlotKind Kind,
    Guid? RoutineId,
    string? RoutineName,
    Guid? DayId,
    string? DayName,
    Guid? BlockId);
```

- [ ] **Step 3: Commit**

```bash
git add src/Kondix.Application/DTOs/ProgramDtos.cs
git commit -m "refactor(app): rewrite Program DTOs for v3 shape"
```

---

### Task 1.14: Rewrite `GetProgramByIdQuery`

**Files:**
- Modify: `src/Kondix.Application/Queries/Programs/GetProgramByIdQuery.cs`

- [ ] **Step 1: Replace contents**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Programs;

public sealed record GetProgramByIdQuery(Guid ProgramId, Guid TrainerId) : IRequest<ProgramDetailDto>;

public sealed class GetProgramByIdHandler(IKondixDbContext db)
    : IRequestHandler<GetProgramByIdQuery, ProgramDetailDto>
{
    public async Task<ProgramDetailDto> Handle(GetProgramByIdQuery request, CancellationToken ct)
    {
        var program = await db.Programs
            .AsNoTracking()
            .Where(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId)
            .Select(p => new
            {
                p.Id, p.Name, p.Description, p.Notes,
                p.Objective, p.Level, p.Mode, p.ScheduleType, p.DaysPerWeek,
                p.IsPublished, p.CreatedAt, p.UpdatedAt,
                AssignedCount = p.Assignments.Count(a => a.Status == Domain.Enums.ProgramAssignmentStatus.Active),
                Weeks = p.Weeks
                    .OrderBy(w => w.WeekIndex)
                    .Select(w => new ProgramWeekDto(
                        w.Id,
                        w.WeekIndex,
                        w.Label,
                        w.Slots
                            .OrderBy(s => s.DayIndex)
                            .Select(s => new ProgramSlotDto(
                                s.Id,
                                s.DayIndex,
                                s.Kind,
                                s.RoutineId,
                                s.Routine == null ? null : s.Routine.Name,
                                s.DayId,
                                s.Day == null ? null : s.Day.Name,
                                s.BlockId))
                            .ToList()))
                    .ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (program is null)
            throw new InvalidOperationException("Program not found");

        return new ProgramDetailDto(
            program.Id, program.Name, program.Description, program.Notes,
            program.Objective, program.Level, program.Mode, program.ScheduleType, program.DaysPerWeek,
            program.IsPublished, program.AssignedCount,
            program.CreatedAt, program.UpdatedAt,
            program.Weeks);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Kondix.Application/Queries/Programs/GetProgramByIdQuery.cs
git commit -m "refactor(app): rewrite GetProgramByIdQuery for v3 shape"
```

---

### Task 1.15: Rewrite `GetProgramsQuery`

**Files:**
- Modify: `src/Kondix.Application/Queries/Programs/GetProgramsQuery.cs`

- [ ] **Step 1: Replace contents**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Programs;

public sealed record GetProgramsQuery(
    Guid TrainerId,
    ProgramObjective? Objective = null,
    ProgramLevel? Level = null,
    bool? IsPublished = null,
    string? Query = null) : IRequest<List<ProgramSummaryDto>>;

public sealed class GetProgramsHandler(IKondixDbContext db)
    : IRequestHandler<GetProgramsQuery, List<ProgramSummaryDto>>
{
    public async Task<List<ProgramSummaryDto>> Handle(GetProgramsQuery request, CancellationToken ct)
    {
        var q = db.Programs.AsNoTracking().Where(p => p.TrainerId == request.TrainerId);

        if (request.Objective.HasValue) q = q.Where(p => p.Objective == request.Objective.Value);
        if (request.Level.HasValue)     q = q.Where(p => p.Level == request.Level.Value);
        if (request.IsPublished.HasValue) q = q.Where(p => p.IsPublished == request.IsPublished.Value);
        if (!string.IsNullOrWhiteSpace(request.Query))
        {
            var like = $"%{request.Query.Trim()}%";
            q = q.Where(p => EF.Functions.ILike(p.Name, like));
        }

        return await q
            .OrderByDescending(p => p.UpdatedAt)
            .Select(p => new ProgramSummaryDto(
                p.Id, p.Name, p.Description,
                p.Objective, p.Level, p.Mode, p.ScheduleType, p.DaysPerWeek,
                p.Weeks.Count,
                p.Weeks.SelectMany(w => w.Slots).Count(s => s.Kind == ProgramSlotKind.RoutineDay),
                p.Assignments.Count(a => a.Status == ProgramAssignmentStatus.Active),
                p.IsPublished,
                p.CreatedAt, p.UpdatedAt))
            .ToListAsync(ct);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Kondix.Application/Queries/Programs/GetProgramsQuery.cs
git commit -m "refactor(app): rewrite GetProgramsQuery with v3 filters"
```

---

### Task 1.16: Stub the existing CreateProgramCommand to compile

The current `CreateProgramCommand` and `UpdateProgramCommand` reference dropped fields. We rewrite them properly in Phase 2, but Phase 1 needs to compile. Stub them with the new shape (no logic) so the build is green at end of Phase 1.

**Files:**
- Modify: `src/Kondix.Application/Commands/Programs/CreateProgramCommand.cs`
- Modify: `src/Kondix.Application/Commands/Programs/UpdateProgramCommand.cs`
- Modify: `src/Kondix.Application/Commands/Programs/DeleteProgramCommand.cs` (likely compiles already; review)
- Modify: `src/Kondix.Application/Validators/CreateProgramValidator.cs` (and any related validator)

- [ ] **Step 1: Replace `CreateProgramCommand.cs` with a minimal stub**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;

namespace Kondix.Application.Commands.Programs;

public sealed record CreateProgramCommand(
    Guid TrainerId,
    string Name,
    string? Description,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode,
    ProgramScheduleType ScheduleType,
    int? DaysPerWeek,
    int DurationWeeks) : IRequest<Guid>;

public sealed class CreateProgramHandler(IKondixDbContext db) : IRequestHandler<CreateProgramCommand, Guid>
{
    public Task<Guid> Handle(CreateProgramCommand request, CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 2");
}
```

- [ ] **Step 2: Replace `UpdateProgramCommand.cs` with a stub**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;

namespace Kondix.Application.Commands.Programs;

public sealed record UpdateProgramCommand(
    Guid ProgramId,
    Guid TrainerId,
    string Name,
    string? Description,
    string? Notes,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode) : IRequest;

public sealed class UpdateProgramHandler(IKondixDbContext db) : IRequestHandler<UpdateProgramCommand>
{
    public Task Handle(UpdateProgramCommand request, CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 2");
}
```

- [ ] **Step 3: Update `CreateProgramValidator.cs`** to match the new command shape

```csharp
using FluentValidation;
using Kondix.Application.Commands.Programs;

namespace Kondix.Application.Validators;

public sealed class CreateProgramValidator : AbstractValidator<CreateProgramCommand>
{
    public CreateProgramValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.DurationWeeks).GreaterThan(0).LessThanOrEqualTo(52);
        RuleFor(x => x.DaysPerWeek)
            .NotNull().When(x => x.ScheduleType == Domain.Enums.ProgramScheduleType.Numbered)
            .WithMessage("DaysPerWeek required for Numbered scheduleType");
        RuleFor(x => x.DaysPerWeek)
            .InclusiveBetween(1, 7).When(x => x.DaysPerWeek.HasValue);
        RuleFor(x => x.DurationWeeks)
            .Equal(1).When(x => x.Mode == Domain.Enums.ProgramMode.Loop)
            .WithMessage("Loop programs must have DurationWeeks=1");
    }
}
```

- [ ] **Step 4: Build**

```bash
dotnet build Kondix.slnx
```

Expected: green. Any controller code in `ProgramsController` that referenced old fields will need a touch-up in the next task.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/ src/Kondix.Application/Validators/CreateProgramValidator.cs
git commit -m "refactor(app): stub Program command handlers for v3 (Phase 2 fills logic)"
```

---

### Task 1.17: Update `ProgramsController` for new read shape

**Files:**
- Modify: `src/Kondix.Api/Controllers/ProgramsController.cs`

- [ ] **Step 1: Replace contents** (write endpoints stay as stubs that map to the new commands; we'll wire them properly in Phase 2)

```csharp
using Kondix.Api.Extensions;
using Kondix.Application.Commands.Programs;
using Kondix.Application.DTOs;
using Kondix.Application.Queries.Programs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/programs")]
public class ProgramsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] ProgramObjective? objective,
        [FromQuery] ProgramLevel? level,
        [FromQuery] bool? published,
        [FromQuery] string? query,
        CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetProgramsQuery(
            HttpContext.GetTrainerId(), objective, level, published, query), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetProgramByIdQuery(id, HttpContext.GetTrainerId()), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProgramRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var id = await mediator.Send(new CreateProgramCommand(
            HttpContext.GetTrainerId(),
            request.Name, request.Description,
            request.Objective, request.Level, request.Mode, request.ScheduleType,
            request.DaysPerWeek, request.DurationWeeks), ct);
        return Created($"/api/v1/programs/{id}", new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProgramRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new UpdateProgramCommand(
            id, HttpContext.GetTrainerId(),
            request.Name, request.Description, request.Notes,
            request.Objective, request.Level, request.Mode), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeleteProgramCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }
}

public sealed record CreateProgramRequest(
    string Name,
    string? Description,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode,
    ProgramScheduleType ScheduleType,
    int? DaysPerWeek,
    int DurationWeeks);

public sealed record UpdateProgramRequest(
    string Name,
    string? Description,
    string? Notes,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode);
```

- [ ] **Step 2: Build**

```bash
dotnet build Kondix.slnx
```

Expected: green.

- [ ] **Step 3: Commit**

```bash
git add src/Kondix.Api/Controllers/ProgramsController.cs
git commit -m "refactor(api): rewire ProgramsController for v3 read endpoints"
```

---

### Task 1.18: Generate the destructive migration

**Files:**
- Create: `src/Kondix.Infrastructure/Migrations/{ts}_ProgramsV3Refactor.cs`
- Modify: `src/Kondix.Infrastructure/Migrations/KondixDbContextModelSnapshot.cs` (auto-generated)

- [ ] **Step 1: Generate**

```bash
dotnet ef migrations add ProgramsV3Refactor \
  --project src/Kondix.Infrastructure \
  --startup-project src/Kondix.Api \
  --output-dir Migrations
```

- [ ] **Step 2: Inspect the generated `Up()` method**

EF Core generates ALTER/DROP/ADD column statements automatically. Open the generated file and verify it includes:
- `DropTable("program_routines")` and `DropTable("program_week_overrides")`
- `DropColumn("mode", "program_assignments")`, `DropColumn("training_days", "program_assignments")`, `DropColumn("fixed_schedule_json", "program_assignments")`, `DropColumn("rotation_index", "program_assignments")`, `DropColumn("duration_weeks", "program_assignments")`
- `DropColumn("duration_weeks", "programs")`, `DropColumn("is_active", "programs")`
- `AddColumn("notes", ..., "programs")` and the other new program columns
- `CreateTable("program_weeks", ...)` and `CreateTable("program_slots", ...)`
- `AddColumn("week_index", "workout_sessions")` and `AddColumn("slot_index", "workout_sessions")`

- [ ] **Step 3: Prepend the destructive `TRUNCATE` block**

EF won't generate truncates. Add this as the FIRST line(s) of the `Up()` method body, before any DropColumn:

```csharp
migrationBuilder.Sql(@"
    TRUNCATE TABLE kondix.set_logs CASCADE;
    TRUNCATE TABLE kondix.personal_records CASCADE;
    TRUNCATE TABLE kondix.workout_sessions CASCADE;
    TRUNCATE TABLE kondix.program_assignments CASCADE;
    TRUNCATE TABLE kondix.programs CASCADE;
");
```

If the existing `set_logs`/`workout_sessions`/`personal_records` tables don't have CASCADE FKs that allow truncate without naming, switch to `DELETE FROM` in dependency order. Verify on your dev DB if available; otherwise, generate the SQL script in step 4 and adjust.

- [ ] **Step 4: Verify SQL**

```bash
dotnet ef migrations script {previous_migration_name} ProgramsV3Refactor \
  --project src/Kondix.Infrastructure \
  --startup-project src/Kondix.Api \
  --output /tmp/v3-migration.sql
```

Open `/tmp/v3-migration.sql` and confirm the order is:
1. TRUNCATE chain (your prepended SQL).
2. DROP TABLE for program_routines / program_week_overrides.
3. ALTER TABLE program_assignments DROP COLUMN ... × 5.
4. ALTER TABLE programs DROP COLUMN ... × 2 + ADD COLUMN ... × 7.
5. CREATE TABLE program_weeks / program_slots.
6. ALTER TABLE workout_sessions ADD COLUMN week_index / slot_index.

- [ ] **Step 5: Build and commit**

```bash
dotnet build Kondix.slnx
git add src/Kondix.Infrastructure/Migrations/
git commit -m "feat(infra): destructive migration for Programs v3 refactor"
```

---

### Task 1.19: Make architecture tests green

**Files:**
- Possibly: `tests/Kondix.ArchTests/*.cs` (only if existing tests reference dropped types)

- [ ] **Step 1: Run arch tests**

```bash
dotnet test tests/Kondix.ArchTests/Kondix.ArchTests.csproj
```

If green: skip to step 3.

- [ ] **Step 2: Fix any references to deleted types**

Common case: a test enumerates "all entities under Kondix.Domain.Entities" and asserts mapping coverage. If `ProgramRoutine` or `ProgramWeekOverride` was hard-coded, remove that reference. If new entities `ProgramWeek`/`ProgramSlot` need to be added to an inclusion list, add them.

- [ ] **Step 3: Build + run all tests**

```bash
dotnet test Kondix.slnx
```

Expected: green (architecture + remaining unit tests). The unit tests directory may be near-empty after the deletion in Task 1.12 — that's fine.

- [ ] **Step 4: Commit if any fix**

```bash
git add tests/Kondix.ArchTests/
git commit -m "test(arch): refresh entity inclusion list for v3"
```

---

### Task 1.20: Frontend — update DTO interfaces

**Files:**
- Modify: `kondix-web/src/app/shared/models/index.ts`
- Modify: `kondix-web/src/app/features/trainer/programs/data-access/programs.service.ts`

- [ ] **Step 1: Add new TypeScript types**

In `shared/models/index.ts` append (or replace existing `Program*` types with):

```typescript
export type ProgramObjective = 'Hipertrofia' | 'Fuerza' | 'Resistencia' | 'Funcional' | 'Rendimiento' | 'Otro';
export type ProgramLevel = 'Principiante' | 'Intermedio' | 'Avanzado' | 'Todos';
export type ProgramMode = 'Fixed' | 'Loop';
export type ProgramScheduleType = 'Week' | 'Numbered';
export type ProgramSlotKind = 'Empty' | 'Rest' | 'RoutineDay';

export interface ProgramSummary {
  id: string;
  name: string;
  description: string | null;
  objective: ProgramObjective;
  level: ProgramLevel;
  mode: ProgramMode;
  scheduleType: ProgramScheduleType;
  daysPerWeek: number | null;
  weeksCount: number;
  sessionsCount: number;
  assignedCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramSlot {
  id: string;
  dayIndex: number;
  kind: ProgramSlotKind;
  routineId: string | null;
  routineName: string | null;
  dayId: string | null;
  dayName: string | null;
  blockId: string | null;
}

export interface ProgramWeek {
  id: string;
  weekIndex: number;
  label: string;
  slots: ProgramSlot[];
}

export interface ProgramDetail {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  objective: ProgramObjective;
  level: ProgramLevel;
  mode: ProgramMode;
  scheduleType: ProgramScheduleType;
  daysPerWeek: number | null;
  isPublished: boolean;
  assignedCount: number;
  createdAt: string;
  updatedAt: string;
  weeks: ProgramWeek[];
}
```

If `Program` (legacy) is still exported and used by existing components, leave it but mark `// @deprecated v3` until all consumers migrate (Phase 6).

- [ ] **Step 2: Update `programs.service.ts` GET methods**

Open `kondix-web/src/app/features/trainer/programs/data-access/programs.service.ts`. Replace methods that reference legacy types with:

```typescript
list(filters?: { objective?: ProgramObjective; level?: ProgramLevel; published?: boolean; query?: string; }) {
  let params = new HttpParams();
  if (filters?.objective) params = params.set('objective', filters.objective);
  if (filters?.level) params = params.set('level', filters.level);
  if (filters?.published !== undefined) params = params.set('published', String(filters.published));
  if (filters?.query) params = params.set('query', filters.query);
  return this.http.get<ProgramSummary[]>('/api/v1/programs', { params, withCredentials: true });
}

getById(id: string) {
  return this.http.get<ProgramDetail>(`/api/v1/programs/${id}`, { withCredentials: true });
}
```

Leave write methods (`create`, `update`, `delete`) alone for now — Phase 2 wires them.

- [ ] **Step 3: Run frontend build**

```bash
cd kondix-web && npm run build
```

Expected: build success or only "deprecated" warnings on legacy components. If hard errors appear in components that consume `ProgramDetail.routines` (legacy), comment out that view-model temporarily; Phase 4 replaces those components entirely.

- [ ] **Step 4: Commit**

```bash
git add kondix-web/src/app/shared/models/index.ts \
        kondix-web/src/app/features/trainer/programs/data-access/programs.service.ts
git commit -m "refactor(web): Programs v3 DTO types + GET methods"
```

---

### Task 1.21: Phase 1 verification + checkpoint

- [ ] **Step 1: Run all backend tests**

```bash
dotnet test Kondix.slnx
```

Expected: all green.

- [ ] **Step 2: Run frontend build + tests**

```bash
cd kondix-web && npm run build && npm run test -- --run
```

Expected: green.

- [ ] **Step 3: Manual smoke (if a dev DB is reachable)**

If you have a local Postgres + Kondix dev environment:
```bash
dotnet ef database update --project src/Kondix.Infrastructure --startup-project src/Kondix.Api
dotnet run --project src/Kondix.Api
# In another terminal:
curl -i http://localhost:5000/api/v1/programs -b "cg-access-kondix=<your-jwt>"
```
Expected: `200 OK` with `[]` (empty list — programs were truncated). If you have no dev DB, skip this and rely on integration tests in later phases.

- [ ] **Step 4: Tag the checkpoint**

```bash
git tag programs-v3-phase-1-done
```

Phase 1 complete. The schema is reshaped, read endpoints return the new shape, write endpoints are stubs that throw. Phase 2 fills in the writes.

---

# Phase 2 — Write endpoints (commands + slot mutations + assign-routine)

**Goal:** All trainer-side write endpoints live and tested. After this phase, the editor (Phase 4) can drive the full CRUD loop via the backend.

**Verification at end of phase:**
- All new commands have unit tests (xUnit + InMemory DB).
- `dotnet test Kondix.slnx` green.
- Manual: `POST /api/v1/programs` → `POST /api/v1/programs/{id}/assign-routine` → `GET /api/v1/programs/{id}` round-trip works via curl.

---

### Task 2.1: Implement `CreateProgramCommand`

**Files:**
- Modify: `src/Kondix.Application/Commands/Programs/CreateProgramCommand.cs`
- Create: `tests/Kondix.UnitTests/Commands/CreateProgramCommandHandlerTests.cs`

- [ ] **Step 1: Write the failing test**

```csharp
using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class CreateProgramCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Creates_Program_With_Empty_Weeks_For_Fixed_Mode()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        db.Trainers.Add(new Trainer { Id = trainerId, UserId = Guid.NewGuid(), Name = "T", Email = "t@x.com" });
        await db.SaveChangesAsync();

        var handler = new CreateProgramHandler(db);
        var id = await handler.Handle(new CreateProgramCommand(
            trainerId, "Hypertrophy", null,
            ProgramObjective.Hipertrofia, ProgramLevel.Intermedio,
            ProgramMode.Fixed, ProgramScheduleType.Week,
            null, 4), default);

        var program = await db.Programs.Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstAsync(p => p.Id == id);
        program.Weeks.Should().HaveCount(4);
        program.Weeks.OrderBy(w => w.WeekIndex).Select(w => w.Label)
            .Should().Equal("Semana 1", "Semana 2", "Semana 3", "Semana 4");
        program.Weeks.First().Slots.Should().HaveCount(7);
        program.Weeks.First().Slots.Should().OnlyContain(s => s.Kind == ProgramSlotKind.Empty);
        program.IsPublished.Should().BeFalse();
    }

    [Fact]
    public async Task Loop_Mode_Forces_Single_Week()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        db.Trainers.Add(new Trainer { Id = trainerId, UserId = Guid.NewGuid(), Name = "T", Email = "t@x.com" });
        await db.SaveChangesAsync();

        var handler = new CreateProgramHandler(db);
        var id = await handler.Handle(new CreateProgramCommand(
            trainerId, "Loop", null,
            ProgramObjective.Hipertrofia, ProgramLevel.Avanzado,
            ProgramMode.Loop, ProgramScheduleType.Week,
            null, 99), default);

        var program = await db.Programs.Include(p => p.Weeks).FirstAsync(p => p.Id == id);
        program.Weeks.Should().HaveCount(1);
        program.Weeks.First().Label.Should().Be("Semana base");
    }

    [Fact]
    public async Task Numbered_Mode_Has_DaysPerWeek_Slots_Per_Week()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        db.Trainers.Add(new Trainer { Id = trainerId, UserId = Guid.NewGuid(), Name = "T", Email = "t@x.com" });
        await db.SaveChangesAsync();

        var handler = new CreateProgramHandler(db);
        var id = await handler.Handle(new CreateProgramCommand(
            trainerId, "Numbered", null,
            ProgramObjective.Fuerza, ProgramLevel.Principiante,
            ProgramMode.Fixed, ProgramScheduleType.Numbered,
            3, 6), default);

        var program = await db.Programs.Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstAsync(p => p.Id == id);
        program.Weeks.Should().HaveCount(6);
        program.Weeks.First().Slots.Should().HaveCount(3);
        program.DaysPerWeek.Should().Be(3);
    }
}
```

- [ ] **Step 2: Run the test — expect `NotImplementedException`**

```bash
dotnet test --filter "FullyQualifiedName~CreateProgramCommandHandlerTests"
```

Expected: 3 failures, all with `NotImplementedException` from the Phase 1 stub.

- [ ] **Step 3: Replace the stub with real impl in `CreateProgramCommand.cs`**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record CreateProgramCommand(
    Guid TrainerId,
    string Name,
    string? Description,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode,
    ProgramScheduleType ScheduleType,
    int? DaysPerWeek,
    int DurationWeeks) : IRequest<Guid>;

public sealed class CreateProgramHandler(IKondixDbContext db) : IRequestHandler<CreateProgramCommand, Guid>
{
    public async Task<Guid> Handle(CreateProgramCommand request, CancellationToken ct)
    {
        // Validate trainer exists (cheap defensive check).
        var trainerExists = await db.Trainers.AnyAsync(t => t.Id == request.TrainerId, ct);
        if (!trainerExists) throw new InvalidOperationException("Trainer not found");

        // Resolve effective dimensions.
        var effectiveWeeks = request.Mode == ProgramMode.Loop ? 1 : request.DurationWeeks;
        var slotsPerWeek = request.ScheduleType == ProgramScheduleType.Numbered
            ? (request.DaysPerWeek ?? throw new InvalidOperationException("DaysPerWeek required for Numbered"))
            : 7;

        var now = DateTimeOffset.UtcNow;
        var program = new Program
        {
            TrainerId = request.TrainerId,
            Name = request.Name,
            Description = request.Description,
            Objective = request.Objective,
            Level = request.Level,
            Mode = request.Mode,
            ScheduleType = request.ScheduleType,
            DaysPerWeek = request.ScheduleType == ProgramScheduleType.Numbered ? request.DaysPerWeek : null,
            IsPublished = false,
            UpdatedAt = now
        };

        for (var wi = 0; wi < effectiveWeeks; wi++)
        {
            var week = new ProgramWeek
            {
                WeekIndex = wi,
                Label = request.Mode == ProgramMode.Loop ? "Semana base" : $"Semana {wi + 1}"
            };
            for (var di = 0; di < slotsPerWeek; di++)
            {
                week.Slots.Add(new ProgramSlot { DayIndex = di, Kind = ProgramSlotKind.Empty });
            }
            program.Weeks.Add(week);
        }

        db.Programs.Add(program);
        await db.SaveChangesAsync(ct);
        return program.Id;
    }
}
```

- [ ] **Step 4: Run the tests**

```bash
dotnet test --filter "FullyQualifiedName~CreateProgramCommandHandlerTests"
```

Expected: 3 PASSED.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/CreateProgramCommand.cs \
        tests/Kondix.UnitTests/Commands/CreateProgramCommandHandlerTests.cs
git commit -m "feat(programs): CreateProgramCommand with seeded weeks"
```

---

### Task 2.2: Implement `UpdateProgramCommand`

**Files:**
- Modify: `src/Kondix.Application/Commands/Programs/UpdateProgramCommand.cs`
- Create: `tests/Kondix.UnitTests/Commands/UpdateProgramCommandHandlerTests.cs`

- [ ] **Step 1: Write the failing tests**

```csharp
using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class UpdateProgramCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Updates_Metadata()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program
        {
            Id = programId, TrainerId = trainerId, Name = "Old", Mode = ProgramMode.Fixed,
            ScheduleType = ProgramScheduleType.Week
        });
        db.Programs.First().Weeks.Add(new ProgramWeek { WeekIndex = 0, Label = "Semana 1" });
        await db.SaveChangesAsync();

        var handler = new UpdateProgramHandler(db);
        await handler.Handle(new UpdateProgramCommand(programId, trainerId,
            "New Name", "Desc", "Internal", ProgramObjective.Fuerza, ProgramLevel.Avanzado, ProgramMode.Fixed), default);

        var p = await db.Programs.FirstAsync(x => x.Id == programId);
        p.Name.Should().Be("New Name");
        p.Description.Should().Be("Desc");
        p.Notes.Should().Be("Internal");
        p.Objective.Should().Be(ProgramObjective.Fuerza);
        p.Level.Should().Be(ProgramLevel.Avanzado);
    }

    [Fact]
    public async Task Switching_To_Loop_With_Multiple_Weeks_Throws()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        var p = new Program { Id = programId, TrainerId = trainerId, Name = "P", Mode = ProgramMode.Fixed };
        p.Weeks.Add(new ProgramWeek { WeekIndex = 0, Label = "S1" });
        p.Weeks.Add(new ProgramWeek { WeekIndex = 1, Label = "S2" });
        db.Programs.Add(p);
        await db.SaveChangesAsync();

        var handler = new UpdateProgramHandler(db);
        await FluentActions.Invoking(() => handler.Handle(new UpdateProgramCommand(
            programId, trainerId, "P", null, null,
            ProgramObjective.Otro, ProgramLevel.Todos, ProgramMode.Loop), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Loop*");
    }

    [Fact]
    public async Task Wrong_Trainer_Throws_NotFound()
    {
        await using var db = NewDb();
        var ownerTrainerId = Guid.NewGuid();
        var attackerTrainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = ownerTrainerId, Name = "P" });
        await db.SaveChangesAsync();

        var handler = new UpdateProgramHandler(db);
        await FluentActions.Invoking(() => handler.Handle(new UpdateProgramCommand(
            programId, attackerTrainerId, "Hacked", null, null,
            ProgramObjective.Otro, ProgramLevel.Todos, ProgramMode.Fixed), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }
}
```

- [ ] **Step 2: Run — expect failures**

```bash
dotnet test --filter "FullyQualifiedName~UpdateProgramCommandHandlerTests"
```

- [ ] **Step 3: Replace the stub with real impl**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record UpdateProgramCommand(
    Guid ProgramId,
    Guid TrainerId,
    string Name,
    string? Description,
    string? Notes,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode) : IRequest;

public sealed class UpdateProgramHandler(IKondixDbContext db) : IRequestHandler<UpdateProgramCommand>
{
    public async Task Handle(UpdateProgramCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        if (request.Mode == ProgramMode.Loop && program.Weeks.Count > 1)
            throw new InvalidOperationException("Cannot switch to Loop with multiple weeks; collapse first");

        program.Name = request.Name;
        program.Description = request.Description;
        program.Notes = request.Notes;
        program.Objective = request.Objective;
        program.Level = request.Level;
        program.Mode = request.Mode;
        program.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 4: Run tests** → 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/UpdateProgramCommand.cs \
        tests/Kondix.UnitTests/Commands/UpdateProgramCommandHandlerTests.cs
git commit -m "feat(programs): UpdateProgramCommand metadata-only with mode invariant"
```

---

### Task 2.3: Implement `PublishProgramCommand`

**Files:**
- Create: `src/Kondix.Application/Commands/Programs/PublishProgramCommand.cs`
- Create: `tests/Kondix.UnitTests/Commands/PublishProgramCommandHandlerTests.cs`

- [ ] **Step 1: Write tests**

```csharp
using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class PublishProgramCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Sets_IsPublished_True()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = trainerId, Name = "P", IsPublished = false });
        await db.SaveChangesAsync();

        await new PublishProgramHandler(db).Handle(new PublishProgramCommand(programId, trainerId), default);

        (await db.Programs.FirstAsync()).IsPublished.Should().BeTrue();
    }

    [Fact]
    public async Task Idempotent_When_Already_Published()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = trainerId, Name = "P", IsPublished = true });
        await db.SaveChangesAsync();

        await new PublishProgramHandler(db).Handle(new PublishProgramCommand(programId, trainerId), default);
        // No exception, still published.
        (await db.Programs.FirstAsync()).IsPublished.Should().BeTrue();
    }

    [Fact]
    public async Task Wrong_Trainer_Throws()
    {
        await using var db = NewDb();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = Guid.NewGuid(), Name = "P" });
        await db.SaveChangesAsync();

        await FluentActions.Invoking(() => new PublishProgramHandler(db)
            .Handle(new PublishProgramCommand(programId, Guid.NewGuid()), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }
}
```

- [ ] **Step 2: Run — fail (handler missing)**

- [ ] **Step 3: Implement**

```csharp
using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record PublishProgramCommand(Guid ProgramId, Guid TrainerId) : IRequest;

public sealed class PublishProgramHandler(IKondixDbContext db) : IRequestHandler<PublishProgramCommand>
{
    public async Task Handle(PublishProgramCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        if (program.IsPublished) return;
        program.IsPublished = true;
        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 4: Run tests** → 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/PublishProgramCommand.cs \
        tests/Kondix.UnitTests/Commands/PublishProgramCommandHandlerTests.cs
git commit -m "feat(programs): PublishProgramCommand"
```

---

### Task 2.4: Implement `DuplicateProgramCommand`

**Files:**
- Create: `src/Kondix.Application/Commands/Programs/DuplicateProgramCommand.cs`
- Create: `tests/Kondix.UnitTests/Commands/DuplicateProgramCommandHandlerTests.cs`

- [ ] **Step 1: Write the failing test**

```csharp
using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class DuplicateProgramCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Deep_Clones_Weeks_And_Slots_With_New_Block_Ids()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var routineId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var blockId = Guid.NewGuid();

        var src = new Program
        {
            Id = Guid.NewGuid(), TrainerId = trainerId, Name = "Source", IsPublished = true,
            Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Week
        };
        var w = new ProgramWeek { WeekIndex = 0, Label = "Semana 1" };
        w.Slots.Add(new ProgramSlot
        {
            DayIndex = 0, Kind = ProgramSlotKind.RoutineDay,
            RoutineId = routineId, DayId = dayId, BlockId = blockId
        });
        w.Slots.Add(new ProgramSlot { DayIndex = 1, Kind = ProgramSlotKind.Rest });
        src.Weeks.Add(w);
        db.Programs.Add(src);
        await db.SaveChangesAsync();

        var newId = await new DuplicateProgramHandler(db)
            .Handle(new DuplicateProgramCommand(src.Id, trainerId), default);

        var copy = await db.Programs.Include(p => p.Weeks).ThenInclude(x => x.Slots)
            .FirstAsync(p => p.Id == newId);

        copy.Should().NotBeSameAs(src);
        copy.Name.Should().Be("Source (copia)");
        copy.IsPublished.Should().BeFalse();
        copy.Weeks.Should().HaveCount(1);
        copy.Weeks.First().Slots.Should().HaveCount(2);
        var copiedRoutineSlot = copy.Weeks.First().Slots.First(s => s.Kind == ProgramSlotKind.RoutineDay);
        copiedRoutineSlot.RoutineId.Should().Be(routineId);
        copiedRoutineSlot.BlockId.Should().NotBe(blockId, "BlockIds must be regenerated to avoid cross-program collisions");
    }
}
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record DuplicateProgramCommand(Guid ProgramId, Guid TrainerId) : IRequest<Guid>;

public sealed class DuplicateProgramHandler(IKondixDbContext db) : IRequestHandler<DuplicateProgramCommand, Guid>
{
    public async Task<Guid> Handle(DuplicateProgramCommand request, CancellationToken ct)
    {
        var src = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (src is null) throw new InvalidOperationException("Program not found");

        var now = DateTimeOffset.UtcNow;
        var blockIdMap = new Dictionary<Guid, Guid>();

        var copy = new Program
        {
            TrainerId = src.TrainerId,
            Name = $"{src.Name} (copia)",
            Description = src.Description,
            Notes = src.Notes,
            Objective = src.Objective,
            Level = src.Level,
            Mode = src.Mode,
            ScheduleType = src.ScheduleType,
            DaysPerWeek = src.DaysPerWeek,
            IsPublished = false,
            UpdatedAt = now
        };

        foreach (var w in src.Weeks.OrderBy(x => x.WeekIndex))
        {
            var newWeek = new ProgramWeek { WeekIndex = w.WeekIndex, Label = w.Label };
            foreach (var s in w.Slots.OrderBy(x => x.DayIndex))
            {
                Guid? newBlockId = null;
                if (s.BlockId.HasValue)
                {
                    if (!blockIdMap.TryGetValue(s.BlockId.Value, out var mapped))
                    {
                        mapped = Guid.NewGuid();
                        blockIdMap[s.BlockId.Value] = mapped;
                    }
                    newBlockId = mapped;
                }
                newWeek.Slots.Add(new ProgramSlot
                {
                    DayIndex = s.DayIndex,
                    Kind = s.Kind,
                    RoutineId = s.RoutineId,
                    DayId = s.DayId,
                    BlockId = newBlockId
                });
            }
            copy.Weeks.Add(newWeek);
        }

        db.Programs.Add(copy);
        await db.SaveChangesAsync(ct);
        return copy.Id;
    }
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/DuplicateProgramCommand.cs \
        tests/Kondix.UnitTests/Commands/DuplicateProgramCommandHandlerTests.cs
git commit -m "feat(programs): DuplicateProgramCommand with block-id remap"
```

---

### Task 2.5: Implement week mutation commands (Add / Duplicate / Delete)

**Files:**
- Create: `src/Kondix.Application/Commands/Programs/AddWeekCommand.cs`
- Create: `src/Kondix.Application/Commands/Programs/DuplicateWeekCommand.cs`
- Create: `src/Kondix.Application/Commands/Programs/DeleteWeekCommand.cs`
- Create: `tests/Kondix.UnitTests/Commands/WeekMutationCommandsTests.cs`

- [ ] **Step 1: Write tests for all three**

```csharp
using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class WeekMutationCommandsTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static Program SeedFixedProgram(KondixDbContext db, Guid trainerId, int weeksCount)
    {
        var p = new Program
        {
            Id = Guid.NewGuid(), TrainerId = trainerId, Name = "P",
            Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Week
        };
        for (var i = 0; i < weeksCount; i++)
        {
            var w = new ProgramWeek { WeekIndex = i, Label = $"Semana {i + 1}" };
            for (var d = 0; d < 7; d++) w.Slots.Add(new ProgramSlot { DayIndex = d, Kind = ProgramSlotKind.Empty });
            p.Weeks.Add(w);
        }
        db.Programs.Add(p);
        db.SaveChanges();
        return p;
    }

    [Fact]
    public async Task AddWeek_Appends_Empty_Week()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = SeedFixedProgram(db, t, 2);

        await new AddWeekHandler(db).Handle(new AddWeekCommand(p.Id, t), default);

        var refreshed = await db.Programs.Include(x => x.Weeks).ThenInclude(w => w.Slots).FirstAsync();
        refreshed.Weeks.Should().HaveCount(3);
        var lastWeek = refreshed.Weeks.OrderBy(w => w.WeekIndex).Last();
        lastWeek.WeekIndex.Should().Be(2);
        lastWeek.Label.Should().Be("Semana 3");
        lastWeek.Slots.Should().OnlyContain(s => s.Kind == ProgramSlotKind.Empty);
    }

    [Fact]
    public async Task AddWeek_Rejects_Loop_Mode()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = SeedFixedProgram(db, t, 1);
        var loaded = await db.Programs.FirstAsync();
        loaded.Mode = ProgramMode.Loop;
        await db.SaveChangesAsync();

        await FluentActions.Invoking(() => new AddWeekHandler(db).Handle(new AddWeekCommand(p.Id, t), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Loop*");
    }

    [Fact]
    public async Task DuplicateWeek_Inserts_Copy_At_Next_Position_And_Reindexes()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = SeedFixedProgram(db, t, 3);
        // Mark week 1 (index 1) with a routineDay slot to confirm it's copied.
        var loaded = await db.Programs.Include(x => x.Weeks).ThenInclude(w => w.Slots).FirstAsync();
        var w1 = loaded.Weeks.First(w => w.WeekIndex == 1);
        var slot = w1.Slots.First();
        slot.Kind = ProgramSlotKind.RoutineDay;
        slot.RoutineId = Guid.NewGuid();
        slot.DayId = Guid.NewGuid();
        slot.BlockId = Guid.NewGuid();
        await db.SaveChangesAsync();

        await new DuplicateWeekHandler(db).Handle(new DuplicateWeekCommand(p.Id, t, 1), default);

        var refreshed = await db.Programs.Include(x => x.Weeks).ThenInclude(w => w.Slots).FirstAsync();
        refreshed.Weeks.Should().HaveCount(4);
        var ordered = refreshed.Weeks.OrderBy(w => w.WeekIndex).ToList();
        ordered.Select(w => w.WeekIndex).Should().Equal(0, 1, 2, 3);
        ordered.Select(w => w.Label).Should().Equal("Semana 1", "Semana 2", "Semana 3", "Semana 4");
        ordered[2].Slots.Should().Contain(s => s.Kind == ProgramSlotKind.RoutineDay,
            "the copy of week 1 should preserve its routineDay slots at the new index 2");
    }

    [Fact]
    public async Task DeleteWeek_Reindexes_Following_Weeks()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = SeedFixedProgram(db, t, 4);

        await new DeleteWeekHandler(db).Handle(new DeleteWeekCommand(p.Id, t, 1), default);

        var refreshed = await db.Programs.Include(x => x.Weeks).FirstAsync();
        refreshed.Weeks.Should().HaveCount(3);
        refreshed.Weeks.OrderBy(w => w.WeekIndex).Select(w => w.WeekIndex).Should().Equal(0, 1, 2);
        refreshed.Weeks.OrderBy(w => w.WeekIndex).Select(w => w.Label)
            .Should().Equal("Semana 1", "Semana 2", "Semana 3");
    }

    [Fact]
    public async Task DeleteWeek_Refuses_Last_Week()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = SeedFixedProgram(db, t, 1);

        await FluentActions.Invoking(() => new DeleteWeekHandler(db).Handle(new DeleteWeekCommand(p.Id, t, 0), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*at least one week*");
    }
}
```

- [ ] **Step 2: Run — fail (handlers missing)**

- [ ] **Step 3: Implement `AddWeekCommand.cs`**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record AddWeekCommand(Guid ProgramId, Guid TrainerId) : IRequest;

public sealed class AddWeekHandler(IKondixDbContext db) : IRequestHandler<AddWeekCommand>
{
    public async Task Handle(AddWeekCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");
        if (program.Mode == ProgramMode.Loop)
            throw new InvalidOperationException("Loop programs cannot have additional weeks");

        var slotsPerWeek = program.ScheduleType == ProgramScheduleType.Numbered
            ? program.DaysPerWeek!.Value : 7;
        var newIdx = program.Weeks.Count;
        var newWeek = new ProgramWeek { WeekIndex = newIdx, Label = $"Semana {newIdx + 1}" };
        for (var d = 0; d < slotsPerWeek; d++)
            newWeek.Slots.Add(new ProgramSlot { DayIndex = d, Kind = ProgramSlotKind.Empty });
        program.Weeks.Add(newWeek);
        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 4: Implement `DuplicateWeekCommand.cs`**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record DuplicateWeekCommand(Guid ProgramId, Guid TrainerId, int WeekIndex) : IRequest;

public sealed class DuplicateWeekHandler(IKondixDbContext db) : IRequestHandler<DuplicateWeekCommand>
{
    public async Task Handle(DuplicateWeekCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");
        if (program.Mode == ProgramMode.Loop)
            throw new InvalidOperationException("Loop programs cannot duplicate weeks");

        var src = program.Weeks.FirstOrDefault(w => w.WeekIndex == request.WeekIndex)
            ?? throw new InvalidOperationException("Week not found");

        // Shift WeekIndex of all weeks > source by +1.
        foreach (var w in program.Weeks.Where(w => w.WeekIndex > src.WeekIndex))
            w.WeekIndex += 1;

        var copy = new ProgramWeek { WeekIndex = src.WeekIndex + 1, Label = "" };
        foreach (var s in src.Slots.OrderBy(x => x.DayIndex))
        {
            copy.Slots.Add(new ProgramSlot
            {
                DayIndex = s.DayIndex,
                Kind = s.Kind,
                RoutineId = s.RoutineId,
                DayId = s.DayId,
                BlockId = s.BlockId   // Same blockId — slot is conceptually part of same routine block
            });
        }
        program.Weeks.Add(copy);

        // Renumber labels to "Semana N" sequentially.
        foreach (var w in program.Weeks.OrderBy(w => w.WeekIndex))
            w.Label = $"Semana {w.WeekIndex + 1}";

        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 5: Implement `DeleteWeekCommand.cs`**

```csharp
using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record DeleteWeekCommand(Guid ProgramId, Guid TrainerId, int WeekIndex) : IRequest;

public sealed class DeleteWeekHandler(IKondixDbContext db) : IRequestHandler<DeleteWeekCommand>
{
    public async Task Handle(DeleteWeekCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");
        if (program.Weeks.Count <= 1)
            throw new InvalidOperationException("Program must have at least one week");

        var target = program.Weeks.FirstOrDefault(w => w.WeekIndex == request.WeekIndex)
            ?? throw new InvalidOperationException("Week not found");

        program.Weeks.Remove(target);
        db.ProgramWeeks.Remove(target);

        var idx = 0;
        foreach (var w in program.Weeks.OrderBy(w => w.WeekIndex))
        {
            w.WeekIndex = idx++;
            w.Label = $"Semana {w.WeekIndex + 1}";
        }
        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 6: Run all tests** → 5 PASS.

- [ ] **Step 7: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/AddWeekCommand.cs \
        src/Kondix.Application/Commands/Programs/DuplicateWeekCommand.cs \
        src/Kondix.Application/Commands/Programs/DeleteWeekCommand.cs \
        tests/Kondix.UnitTests/Commands/WeekMutationCommandsTests.cs
git commit -m "feat(programs): week add/duplicate/delete commands"
```

---

### Task 2.6: Implement `SetSlotCommand` (single-cell empty/rest mutation)

**Files:**
- Create: `src/Kondix.Application/Commands/Programs/SetSlotCommand.cs`
- Create: `tests/Kondix.UnitTests/Commands/SetSlotCommandHandlerTests.cs`

- [ ] **Step 1: Write tests**

```csharp
using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class SetSlotCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static (Program p, ProgramWeek w) Seed(KondixDbContext db, Guid trainerId, ProgramScheduleType st)
    {
        var p = new Program { Id = Guid.NewGuid(), TrainerId = trainerId, Name = "P", ScheduleType = st, Mode = ProgramMode.Fixed };
        if (st == ProgramScheduleType.Numbered) p.DaysPerWeek = 3;
        var w = new ProgramWeek { WeekIndex = 0, Label = "Semana 1" };
        var count = st == ProgramScheduleType.Numbered ? 3 : 7;
        for (var d = 0; d < count; d++) w.Slots.Add(new ProgramSlot { DayIndex = d, Kind = ProgramSlotKind.Empty });
        p.Weeks.Add(w);
        db.Programs.Add(p);
        db.SaveChanges();
        return (p, w);
    }

    [Fact]
    public async Task Set_To_Rest_Updates_Kind()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, _) = Seed(db, t, ProgramScheduleType.Week);

        await new SetSlotHandler(db).Handle(new SetSlotCommand(p.Id, t, 0, 2, ProgramSlotKind.Rest), default);

        var slot = await db.ProgramSlots.FirstAsync(s => s.DayIndex == 2);
        slot.Kind.Should().Be(ProgramSlotKind.Rest);
    }

    [Fact]
    public async Task Set_To_Empty_Clears_Routine_Refs()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, w) = Seed(db, t, ProgramScheduleType.Week);
        var slot = await db.ProgramSlots.FirstAsync(s => s.DayIndex == 0);
        slot.Kind = ProgramSlotKind.RoutineDay;
        slot.RoutineId = Guid.NewGuid();
        slot.DayId = Guid.NewGuid();
        slot.BlockId = Guid.NewGuid();
        await db.SaveChangesAsync();

        await new SetSlotHandler(db).Handle(new SetSlotCommand(p.Id, t, 0, 0, ProgramSlotKind.Empty), default);

        var refreshed = await db.ProgramSlots.FirstAsync(s => s.Id == slot.Id);
        refreshed.Kind.Should().Be(ProgramSlotKind.Empty);
        refreshed.RoutineId.Should().BeNull();
        refreshed.DayId.Should().BeNull();
        refreshed.BlockId.Should().BeNull();
    }

    [Fact]
    public async Task Rejects_RoutineDay_Kind()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, _) = Seed(db, t, ProgramScheduleType.Week);

        await FluentActions.Invoking(() => new SetSlotHandler(db)
            .Handle(new SetSlotCommand(p.Id, t, 0, 0, ProgramSlotKind.RoutineDay), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*assign-routine*");
    }

    [Fact]
    public async Task Rejects_Rest_In_Numbered_Mode()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, _) = Seed(db, t, ProgramScheduleType.Numbered);

        await FluentActions.Invoking(() => new SetSlotHandler(db)
            .Handle(new SetSlotCommand(p.Id, t, 0, 0, ProgramSlotKind.Rest), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Numbered*");
    }
}
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record SetSlotCommand(
    Guid ProgramId,
    Guid TrainerId,
    int WeekIndex,
    int DayIndex,
    ProgramSlotKind Kind) : IRequest;

public sealed class SetSlotHandler(IKondixDbContext db) : IRequestHandler<SetSlotCommand>
{
    public async Task Handle(SetSlotCommand request, CancellationToken ct)
    {
        if (request.Kind == ProgramSlotKind.RoutineDay)
            throw new InvalidOperationException("Use the assign-routine endpoint to place RoutineDay slots");

        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        if (request.Kind == ProgramSlotKind.Rest && program.ScheduleType == ProgramScheduleType.Numbered)
            throw new InvalidOperationException("Rest slots are not allowed in Numbered programs");

        var week = program.Weeks.FirstOrDefault(w => w.WeekIndex == request.WeekIndex)
            ?? throw new InvalidOperationException("Week not found");
        var slot = week.Slots.FirstOrDefault(s => s.DayIndex == request.DayIndex)
            ?? throw new InvalidOperationException("Slot not found");

        slot.Kind = request.Kind;
        slot.RoutineId = null;
        slot.DayId = null;
        slot.BlockId = null;
        program.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/SetSlotCommand.cs \
        tests/Kondix.UnitTests/Commands/SetSlotCommandHandlerTests.cs
git commit -m "feat(programs): SetSlotCommand for empty/rest mutations"
```

---

### Task 2.7: Implement `AssignRoutineToProgramCommand`

**Files:**
- Create: `src/Kondix.Application/Commands/Programs/AssignRoutineToProgramCommand.cs`
- Create: `tests/Kondix.UnitTests/Commands/AssignRoutineToProgramCommandHandlerTests.cs`

- [ ] **Step 1: Write the failing test**

```csharp
using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class AssignRoutineToProgramCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static (Program p, Routine r, Day d1, Day d2) Seed(KondixDbContext db, Guid trainerId, ProgramScheduleType st)
    {
        var routine = new Routine { Id = Guid.NewGuid(), TrainerId = trainerId, Name = "Push/Pull", IsActive = true };
        var day1 = new Day { Id = Guid.NewGuid(), Routine = routine, Name = "Push", SortOrder = 0 };
        var day2 = new Day { Id = Guid.NewGuid(), Routine = routine, Name = "Pull", SortOrder = 1 };
        routine.Days.Add(day1); routine.Days.Add(day2);

        var p = new Program
        {
            Id = Guid.NewGuid(), TrainerId = trainerId, Name = "P",
            Mode = ProgramMode.Fixed, ScheduleType = st,
            DaysPerWeek = st == ProgramScheduleType.Numbered ? 2 : null
        };
        for (var wi = 0; wi < 2; wi++)
        {
            var w = new ProgramWeek { WeekIndex = wi, Label = $"Semana {wi + 1}" };
            var slotCount = st == ProgramScheduleType.Numbered ? 2 : 7;
            for (var di = 0; di < slotCount; di++)
                w.Slots.Add(new ProgramSlot { DayIndex = di, Kind = ProgramSlotKind.Empty });
            p.Weeks.Add(w);
        }

        db.Routines.Add(routine);
        db.Programs.Add(p);
        db.SaveChanges();
        return (p, routine, day1, day2);
    }

    [Fact]
    public async Task Week_Mode_Maps_Days_To_Weekdays_Across_Selected_Weeks()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, r, d1, d2) = Seed(db, t, ProgramScheduleType.Week);

        var mapping = new Dictionary<Guid, int> { { d1.Id, 0 }, { d2.Id, 2 } }; // Mon, Wed
        await new AssignRoutineToProgramHandler(db).Handle(new AssignRoutineToProgramCommand(
            p.Id, t, r.Id, new[] { 0, 1 }, mapping, null), default);

        var refreshed = await db.Programs.Include(x => x.Weeks).ThenInclude(w => w.Slots).FirstAsync();
        var routineSlots = refreshed.Weeks.SelectMany(w => w.Slots)
            .Where(s => s.Kind == ProgramSlotKind.RoutineDay).ToList();
        routineSlots.Should().HaveCount(4); // 2 weeks × 2 days
        routineSlots.Should().OnlyContain(s => s.RoutineId == r.Id);
        routineSlots.Select(s => s.BlockId).Distinct().Should().HaveCount(1);

        foreach (var w in refreshed.Weeks)
        {
            w.Slots.First(s => s.DayIndex == 0).DayId.Should().Be(d1.Id);
            w.Slots.First(s => s.DayIndex == 2).DayId.Should().Be(d2.Id);
            w.Slots.First(s => s.DayIndex == 1).Kind.Should().Be(ProgramSlotKind.Empty);
        }
    }

    [Fact]
    public async Task Numbered_Mode_Uses_DayIds_List_Sequentially()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, r, d1, d2) = Seed(db, t, ProgramScheduleType.Numbered);

        await new AssignRoutineToProgramHandler(db).Handle(new AssignRoutineToProgramCommand(
            p.Id, t, r.Id, new[] { 0 }, null, new[] { d1.Id, d2.Id }), default);

        var refreshed = await db.Programs.Include(x => x.Weeks).ThenInclude(w => w.Slots).FirstAsync();
        var firstWeek = refreshed.Weeks.First(w => w.WeekIndex == 0);
        firstWeek.Slots.Should().HaveCount(2);
        firstWeek.Slots.OrderBy(s => s.DayIndex).Select(s => s.DayId).Should().Equal(d1.Id, d2.Id);
        firstWeek.Slots.Should().OnlyContain(s => s.Kind == ProgramSlotKind.RoutineDay);

        var secondWeek = refreshed.Weeks.First(w => w.WeekIndex == 1);
        secondWeek.Slots.Should().OnlyContain(s => s.Kind == ProgramSlotKind.Empty);
    }

    [Fact]
    public async Task Week_Mode_Without_Mapping_Throws()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, r, _, _) = Seed(db, t, ProgramScheduleType.Week);

        await FluentActions.Invoking(() => new AssignRoutineToProgramHandler(db)
            .Handle(new AssignRoutineToProgramCommand(p.Id, t, r.Id, new[] { 0 }, null, null), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*mapping*");
    }
}
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

/// <summary>
/// Mapping (Week mode): Dictionary&lt;DayId, WeekdayIdx 0..6&gt;.
/// DayIds (Numbered mode): ordered list of routine day IDs to place in slots 0..N-1.
/// Exactly one of Mapping or DayIds is required, depending on program.ScheduleType.
/// </summary>
public sealed record AssignRoutineToProgramCommand(
    Guid ProgramId,
    Guid TrainerId,
    Guid RoutineId,
    IReadOnlyList<int> Weeks,
    IReadOnlyDictionary<Guid, int>? Mapping,
    IReadOnlyList<Guid>? DayIds) : IRequest<Guid>;

public sealed class AssignRoutineToProgramHandler(IKondixDbContext db)
    : IRequestHandler<AssignRoutineToProgramCommand, Guid>
{
    public async Task<Guid> Handle(AssignRoutineToProgramCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        var routine = await db.Routines
            .Include(r => r.Days)
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId && r.TrainerId == request.TrainerId, ct);
        if (routine is null) throw new InvalidOperationException("Routine not found");

        if (request.Weeks.Count == 0)
            throw new InvalidOperationException("At least one target week is required");
        var validWeeks = program.Weeks.Select(w => w.WeekIndex).ToHashSet();
        if (request.Weeks.Any(w => !validWeeks.Contains(w)))
            throw new InvalidOperationException("One or more target weeks are out of range");

        var blockId = Guid.NewGuid();

        if (program.ScheduleType == ProgramScheduleType.Week)
        {
            if (request.Mapping is null || request.Mapping.Count == 0)
                throw new InvalidOperationException("mapping required for Week mode");
            // Validate every dayId belongs to the routine.
            var routineDayIds = routine.Days.Select(d => d.Id).ToHashSet();
            if (request.Mapping.Keys.Any(id => !routineDayIds.Contains(id)))
                throw new InvalidOperationException("mapping references unknown routine day");
            // No collisions on weekday.
            if (request.Mapping.Values.Distinct().Count() != request.Mapping.Count)
                throw new InvalidOperationException("Two routine days mapped to the same weekday");
            // weekday range 0..6.
            if (request.Mapping.Values.Any(v => v < 0 || v > 6))
                throw new InvalidOperationException("weekday out of range");

            var routineDayById = routine.Days.ToDictionary(d => d.Id);

            foreach (var weekIdx in request.Weeks)
            {
                var week = program.Weeks.First(w => w.WeekIndex == weekIdx);
                foreach (var (dayId, weekdayIdx) in request.Mapping)
                {
                    var slot = week.Slots.First(s => s.DayIndex == weekdayIdx);
                    var rd = routineDayById[dayId];
                    slot.Kind = ProgramSlotKind.RoutineDay;
                    slot.RoutineId = routine.Id;
                    slot.DayId = rd.Id;
                    slot.BlockId = blockId;
                }
            }
        }
        else // Numbered
        {
            if (request.DayIds is null || request.DayIds.Count == 0)
                throw new InvalidOperationException("dayIds required for Numbered mode");
            if (request.DayIds.Count > program.DaysPerWeek)
                throw new InvalidOperationException(
                    $"dayIds length ({request.DayIds.Count}) exceeds program.DaysPerWeek ({program.DaysPerWeek})");
            var routineDayIds = routine.Days.Select(d => d.Id).ToHashSet();
            if (request.DayIds.Any(id => !routineDayIds.Contains(id)))
                throw new InvalidOperationException("dayIds reference unknown routine day");

            foreach (var weekIdx in request.Weeks)
            {
                var week = program.Weeks.First(w => w.WeekIndex == weekIdx);
                for (var i = 0; i < request.DayIds.Count; i++)
                {
                    var slot = week.Slots.First(s => s.DayIndex == i);
                    slot.Kind = ProgramSlotKind.RoutineDay;
                    slot.RoutineId = routine.Id;
                    slot.DayId = request.DayIds[i];
                    slot.BlockId = blockId;
                }
            }
        }

        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return blockId;
    }
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/AssignRoutineToProgramCommand.cs \
        tests/Kondix.UnitTests/Commands/AssignRoutineToProgramCommandHandlerTests.cs
git commit -m "feat(programs): AssignRoutineToProgramCommand with Week/Numbered branches"
```

---

### Task 2.8: Implement `RemoveBlockCommand`

**Files:**
- Create: `src/Kondix.Application/Commands/Programs/RemoveBlockCommand.cs`
- Create: `tests/Kondix.UnitTests/Commands/RemoveBlockCommandHandlerTests.cs`

- [ ] **Step 1: Write test**

```csharp
using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class RemoveBlockCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Removes_All_Slots_With_BlockId_And_Sets_Them_Empty()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var blockId = Guid.NewGuid();
        var p = new Program { Id = Guid.NewGuid(), TrainerId = t, Name = "P", Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Week };
        for (var wi = 0; wi < 2; wi++)
        {
            var w = new ProgramWeek { WeekIndex = wi, Label = "S" };
            for (var di = 0; di < 7; di++)
            {
                var slot = new ProgramSlot { DayIndex = di, Kind = ProgramSlotKind.Empty };
                if (di == 0 || di == 2)
                {
                    slot.Kind = ProgramSlotKind.RoutineDay;
                    slot.RoutineId = Guid.NewGuid();
                    slot.DayId = Guid.NewGuid();
                    slot.BlockId = blockId;
                }
                w.Slots.Add(slot);
            }
            p.Weeks.Add(w);
        }
        db.Programs.Add(p);
        await db.SaveChangesAsync();

        await new RemoveBlockHandler(db).Handle(new RemoveBlockCommand(p.Id, t, blockId), default);

        var refreshed = await db.Programs.Include(x => x.Weeks).ThenInclude(w => w.Slots).FirstAsync();
        var slotsWithBlock = refreshed.Weeks.SelectMany(w => w.Slots).Where(s => s.BlockId == blockId).ToList();
        slotsWithBlock.Should().BeEmpty();
        refreshed.Weeks.SelectMany(w => w.Slots).Should().OnlyContain(s => s.Kind == ProgramSlotKind.Empty);
    }
}
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record RemoveBlockCommand(Guid ProgramId, Guid TrainerId, Guid BlockId) : IRequest;

public sealed class RemoveBlockHandler(IKondixDbContext db) : IRequestHandler<RemoveBlockCommand>
{
    public async Task Handle(RemoveBlockCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        foreach (var slot in program.Weeks.SelectMany(w => w.Slots).Where(s => s.BlockId == request.BlockId))
        {
            slot.Kind = ProgramSlotKind.Empty;
            slot.RoutineId = null;
            slot.DayId = null;
            slot.BlockId = null;
        }
        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/RemoveBlockCommand.cs \
        tests/Kondix.UnitTests/Commands/RemoveBlockCommandHandlerTests.cs
git commit -m "feat(programs): RemoveBlockCommand"
```

---

### Task 2.9: Implement `FillRestCommand`

**Files:**
- Create: `src/Kondix.Application/Commands/Programs/FillRestCommand.cs`
- Create: `tests/Kondix.UnitTests/Commands/FillRestCommandHandlerTests.cs`

- [ ] **Step 1: Write test**

```csharp
using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class FillRestCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Converts_All_Empty_Slots_To_Rest_Leaves_RoutineDay_And_Existing_Rest_Alone()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = new Program { Id = Guid.NewGuid(), TrainerId = t, Name = "P", Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Week };
        var w = new ProgramWeek { WeekIndex = 0, Label = "S1" };
        w.Slots.Add(new ProgramSlot { DayIndex = 0, Kind = ProgramSlotKind.RoutineDay, RoutineId = Guid.NewGuid(), DayId = Guid.NewGuid(), BlockId = Guid.NewGuid() });
        w.Slots.Add(new ProgramSlot { DayIndex = 1, Kind = ProgramSlotKind.Empty });
        w.Slots.Add(new ProgramSlot { DayIndex = 2, Kind = ProgramSlotKind.Rest });
        w.Slots.Add(new ProgramSlot { DayIndex = 3, Kind = ProgramSlotKind.Empty });
        p.Weeks.Add(w);
        db.Programs.Add(p);
        await db.SaveChangesAsync();

        await new FillRestHandler(db).Handle(new FillRestCommand(p.Id, t), default);

        var refreshed = await db.ProgramSlots.OrderBy(s => s.DayIndex).ToListAsync();
        refreshed.Select(s => s.Kind).Should().Equal(
            ProgramSlotKind.RoutineDay,
            ProgramSlotKind.Rest,
            ProgramSlotKind.Rest,
            ProgramSlotKind.Rest);
    }

    [Fact]
    public async Task Rejects_In_Numbered_Mode()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = new Program { Id = Guid.NewGuid(), TrainerId = t, Name = "P", Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Numbered, DaysPerWeek = 3 };
        db.Programs.Add(p);
        await db.SaveChangesAsync();

        await FluentActions.Invoking(() => new FillRestHandler(db).Handle(new FillRestCommand(p.Id, t), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Numbered*");
    }
}
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record FillRestCommand(Guid ProgramId, Guid TrainerId) : IRequest;

public sealed class FillRestHandler(IKondixDbContext db) : IRequestHandler<FillRestCommand>
{
    public async Task Handle(FillRestCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        if (program.ScheduleType == ProgramScheduleType.Numbered)
            throw new InvalidOperationException("Fill-rest is not supported in Numbered mode");

        foreach (var slot in program.Weeks.SelectMany(w => w.Slots).Where(s => s.Kind == ProgramSlotKind.Empty))
            slot.Kind = ProgramSlotKind.Rest;

        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/FillRestCommand.cs \
        tests/Kondix.UnitTests/Commands/FillRestCommandHandlerTests.cs
git commit -m "feat(programs): FillRestCommand"
```

---

### Task 2.10: Cleanup orphan slots on routine deletion

**Files:**
- Modify: `src/Kondix.Application/Commands/Routines/DeleteRoutineCommand.cs`
- Create or modify: `tests/Kondix.UnitTests/Commands/DeleteRoutineCommandHandlerTests.cs`

- [ ] **Step 1: Read existing handler to know what fields/imports it has**

```bash
cat src/Kondix.Application/Commands/Routines/DeleteRoutineCommand.cs
```

- [ ] **Step 2: Add the orphan-slot cleanup step**

After the `db.Routines.Remove(routine);` (or equivalent) call but BEFORE `await db.SaveChangesAsync(ct);` add:

```csharp
// Clean up orphaned program slots that referenced this routine.
// FK ON DELETE SET NULL takes care of nulling RoutineId/DayId at DB level,
// but the entity-level Kind must be reset to Empty.
var affectedSlots = await db.ProgramSlots
    .Where(s => s.RoutineId == request.RoutineId && s.Kind == Domain.Enums.ProgramSlotKind.RoutineDay)
    .ToListAsync(ct);
foreach (var slot in affectedSlots)
{
    slot.Kind = Domain.Enums.ProgramSlotKind.Empty;
    slot.RoutineId = null;
    slot.DayId = null;
    slot.BlockId = null;
}
```

- [ ] **Step 3: Add test verifying the cleanup**

```csharp
[Fact]
public async Task Deleting_Routine_Empties_Affected_Program_Slots()
{
    await using var db = NewDb();
    var t = Guid.NewGuid();
    var routine = new Routine { Id = Guid.NewGuid(), TrainerId = t, Name = "R", IsActive = true };
    var day = new Day { Id = Guid.NewGuid(), Routine = routine, Name = "Day", SortOrder = 0 };
    routine.Days.Add(day);

    var program = new Program { Id = Guid.NewGuid(), TrainerId = t, Name = "P", Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Week };
    var w = new ProgramWeek { WeekIndex = 0, Label = "S1" };
    w.Slots.Add(new ProgramSlot
    {
        DayIndex = 0, Kind = ProgramSlotKind.RoutineDay,
        RoutineId = routine.Id, DayId = day.Id, BlockId = Guid.NewGuid()
    });
    program.Weeks.Add(w);

    db.Routines.Add(routine);
    db.Programs.Add(program);
    await db.SaveChangesAsync();

    var handler = new DeleteRoutineHandler(db);
    await handler.Handle(new DeleteRoutineCommand(routine.Id, t), default);

    var slot = await db.ProgramSlots.FirstAsync();
    slot.Kind.Should().Be(ProgramSlotKind.Empty);
    slot.RoutineId.Should().BeNull();
    slot.BlockId.Should().BeNull();
}
```

(Adjust the test class location/structure to match the existing `DeleteRoutineCommandHandlerTests.cs` file if it exists. If not, create one.)

- [ ] **Step 4: Run all tests**

```bash
dotnet test --filter "FullyQualifiedName~DeleteRoutine"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Routines/DeleteRoutineCommand.cs \
        tests/Kondix.UnitTests/Commands/DeleteRoutineCommandHandlerTests.cs
git commit -m "feat(routines): cleanup orphan program slots on routine delete"
```

---

### Task 2.11: Update `DeleteProgramCommand` to cancel active assignments

**Files:**
- Modify: `src/Kondix.Application/Commands/Programs/DeleteProgramCommand.cs`
- Create or modify: `tests/Kondix.UnitTests/Commands/DeleteProgramCommandHandlerTests.cs`

- [ ] **Step 1: Read current handler**

```bash
cat src/Kondix.Application/Commands/Programs/DeleteProgramCommand.cs
```

- [ ] **Step 2: Replace contents**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record DeleteProgramCommand(Guid ProgramId, Guid TrainerId) : IRequest;

public sealed class DeleteProgramHandler(IKondixDbContext db) : IRequestHandler<DeleteProgramCommand>
{
    public async Task Handle(DeleteProgramCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Assignments)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        foreach (var a in program.Assignments.Where(a => a.Status == ProgramAssignmentStatus.Active))
        {
            a.Status = ProgramAssignmentStatus.Cancelled;
            a.UpdatedAt = DateTimeOffset.UtcNow;
        }

        db.Programs.Remove(program);
        await db.SaveChangesAsync(ct);
    }
}
```

- [ ] **Step 3: Add test**

```csharp
[Fact]
public async Task Cancels_Active_Assignments_Before_Removing_Program()
{
    await using var db = NewDb();
    var t = Guid.NewGuid();
    var s = Guid.NewGuid();
    var program = new Program { Id = Guid.NewGuid(), TrainerId = t, Name = "P" };
    var assignment = new ProgramAssignment
    {
        Id = Guid.NewGuid(), TrainerId = t, StudentId = s, ProgramId = program.Id,
        Status = ProgramAssignmentStatus.Active, StartDate = DateTimeOffset.UtcNow
    };
    program.Assignments.Add(assignment);
    db.Programs.Add(program);
    db.Trainers.Add(new Trainer { Id = t, UserId = Guid.NewGuid(), Name = "T", Email = "t@x.com" });
    db.Students.Add(new Student { Id = s, UserId = Guid.NewGuid(), TrainerId = t, Name = "S", Email = "s@x.com" });
    await db.SaveChangesAsync();

    await new DeleteProgramHandler(db).Handle(new DeleteProgramCommand(program.Id, t), default);

    (await db.Programs.AnyAsync(p => p.Id == program.Id)).Should().BeFalse();
    var refreshed = await db.ProgramAssignments.FirstAsync();
    refreshed.Status.Should().Be(ProgramAssignmentStatus.Cancelled);
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Commands/Programs/DeleteProgramCommand.cs \
        tests/Kondix.UnitTests/Commands/DeleteProgramCommandHandlerTests.cs
git commit -m "feat(programs): cancel active assignments on delete"
```

---

### Task 2.12: Wire all new endpoints in `ProgramsController`

**Files:**
- Modify: `src/Kondix.Api/Controllers/ProgramsController.cs`

- [ ] **Step 1: Append new actions after the existing CRUD**

Append inside the `ProgramsController` class:

```csharp
[HttpPost("{id:guid}/publish")]
public async Task<IActionResult> Publish(Guid id, CancellationToken ct)
{
    HttpContext.RequirePermission(Permissions.GymManage);
    await mediator.Send(new PublishProgramCommand(id, HttpContext.GetTrainerId()), ct);
    return NoContent();
}

[HttpPost("{id:guid}/duplicate")]
public async Task<IActionResult> Duplicate(Guid id, CancellationToken ct)
{
    HttpContext.RequirePermission(Permissions.GymManage);
    var newId = await mediator.Send(new DuplicateProgramCommand(id, HttpContext.GetTrainerId()), ct);
    return Created($"/api/v1/programs/{newId}", new { id = newId });
}

[HttpPost("{id:guid}/weeks")]
public async Task<IActionResult> AddWeek(Guid id, CancellationToken ct)
{
    HttpContext.RequirePermission(Permissions.GymManage);
    await mediator.Send(new AddWeekCommand(id, HttpContext.GetTrainerId()), ct);
    return NoContent();
}

[HttpPost("{id:guid}/weeks/{weekIndex:int}/duplicate")]
public async Task<IActionResult> DuplicateWeek(Guid id, int weekIndex, CancellationToken ct)
{
    HttpContext.RequirePermission(Permissions.GymManage);
    await mediator.Send(new DuplicateWeekCommand(id, HttpContext.GetTrainerId(), weekIndex), ct);
    return NoContent();
}

[HttpDelete("{id:guid}/weeks/{weekIndex:int}")]
public async Task<IActionResult> DeleteWeek(Guid id, int weekIndex, CancellationToken ct)
{
    HttpContext.RequirePermission(Permissions.GymManage);
    await mediator.Send(new DeleteWeekCommand(id, HttpContext.GetTrainerId(), weekIndex), ct);
    return NoContent();
}

[HttpPut("{id:guid}/weeks/{weekIndex:int}/slots/{dayIndex:int}")]
public async Task<IActionResult> SetSlot(Guid id, int weekIndex, int dayIndex,
    [FromBody] SetSlotRequest request, CancellationToken ct)
{
    HttpContext.RequirePermission(Permissions.GymManage);
    await mediator.Send(new SetSlotCommand(id, HttpContext.GetTrainerId(), weekIndex, dayIndex, request.Kind), ct);
    return NoContent();
}

[HttpPost("{id:guid}/assign-routine")]
public async Task<IActionResult> AssignRoutine(Guid id,
    [FromBody] AssignRoutineRequest request, CancellationToken ct)
{
    HttpContext.RequirePermission(Permissions.GymManage);
    var blockId = await mediator.Send(new AssignRoutineToProgramCommand(
        id, HttpContext.GetTrainerId(),
        request.RoutineId, request.Weeks, request.Mapping, request.DayIds), ct);
    return Ok(new { blockId });
}

[HttpDelete("{id:guid}/blocks/{blockId:guid}")]
public async Task<IActionResult> RemoveBlock(Guid id, Guid blockId, CancellationToken ct)
{
    HttpContext.RequirePermission(Permissions.GymManage);
    await mediator.Send(new RemoveBlockCommand(id, HttpContext.GetTrainerId(), blockId), ct);
    return NoContent();
}

[HttpPost("{id:guid}/fill-rest")]
public async Task<IActionResult> FillRest(Guid id, CancellationToken ct)
{
    HttpContext.RequirePermission(Permissions.GymManage);
    await mediator.Send(new FillRestCommand(id, HttpContext.GetTrainerId()), ct);
    return NoContent();
}
```

And append at the bottom of the file (alongside the existing request DTOs):

```csharp
public sealed record SetSlotRequest(ProgramSlotKind Kind);

public sealed record AssignRoutineRequest(
    Guid RoutineId,
    IReadOnlyList<int> Weeks,
    IReadOnlyDictionary<Guid, int>? Mapping,
    IReadOnlyList<Guid>? DayIds);
```

Add the necessary `using Kondix.Domain.Enums;` at the top if not present.

- [ ] **Step 2: Build**

```bash
dotnet build Kondix.slnx
```

- [ ] **Step 3: Commit**

```bash
git add src/Kondix.Api/Controllers/ProgramsController.cs
git commit -m "feat(api): wire Programs v3 write endpoints"
```

---

### Task 2.13: Phase 2 verification

- [ ] **Step 1: Run all tests**

```bash
dotnet test Kondix.slnx
```

Expected: green. Phase 2 added ~25-30 unit tests.

- [ ] **Step 2: Manual smoke (optional, requires dev DB)**

```bash
dotnet run --project src/Kondix.Api &
# Replace JWT_COOKIE with a real cg-access-kondix cookie value:
JWT="cg-access-kondix=..."

# 1. Create program
PROG_ID=$(curl -s -X POST http://localhost:5000/api/v1/programs \
  -H "Content-Type: application/json" \
  -b "$JWT" \
  -d '{"name":"Smoke","description":null,"objective":"Hipertrofia","level":"Intermedio","mode":"Fixed","scheduleType":"Week","daysPerWeek":null,"durationWeeks":2}' \
  | jq -r .id)

# 2. Get detail
curl -s http://localhost:5000/api/v1/programs/$PROG_ID -b "$JWT" | jq '.weeks | length'
# Expected: 2

# 3. Add week
curl -s -X POST http://localhost:5000/api/v1/programs/$PROG_ID/weeks -b "$JWT" -i

# 4. Set slot to rest
curl -s -X PUT http://localhost:5000/api/v1/programs/$PROG_ID/weeks/0/slots/2 \
  -H "Content-Type: application/json" -b "$JWT" \
  -d '{"kind":"Rest"}' -i

# 5. Publish
curl -s -X POST http://localhost:5000/api/v1/programs/$PROG_ID/publish -b "$JWT" -i

# 6. Re-fetch and confirm IsPublished=true
curl -s http://localhost:5000/api/v1/programs/$PROG_ID -b "$JWT" | jq .isPublished
# Expected: true
```

- [ ] **Step 3: Tag**

```bash
git tag programs-v3-phase-2-done
```

Phase 2 complete.

---

# Phase 3 — Create program modal (frontend)

**Goal:** Trainer can create a new program from the list page via a modal that posts to the new `POST /api/v1/programs`. After creation, navigates to the editor (Phase 4 placeholder route — works even before the editor is built).

**Verification at end of phase:**
- `<kx-create-program-modal>` opens from the list, validates inputs, posts to API.
- `cd kondix-web && npm run build` clean.
- `cd kondix-web && npm run test -- --run` green.

---

### Task 3.1: Add `create` method to `programs.service.ts`

**Files:**
- Modify: `kondix-web/src/app/features/trainer/programs/data-access/programs.service.ts`

- [ ] **Step 1: Add method**

Append (or replace any legacy `create` method):

```typescript
create(payload: {
  name: string;
  description?: string | null;
  objective: ProgramObjective;
  level: ProgramLevel;
  mode: ProgramMode;
  scheduleType: ProgramScheduleType;
  daysPerWeek?: number | null;
  durationWeeks: number;
}) {
  return this.http.post<{ id: string }>('/api/v1/programs', payload, { withCredentials: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/data-access/programs.service.ts
git commit -m "feat(web): programs.service.create v3 shape"
```

---

### Task 3.2: Build `<kx-create-program-modal>`

**Files:**
- Create: `kondix-web/src/app/features/trainer/programs/ui/create-program-modal.ts`

- [ ] **Step 1: Write the component**

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, X, Check } from 'lucide-angular';
import { ProgramsService } from '../data-access/programs.service';
import { ProgramLevel, ProgramMode, ProgramObjective, ProgramScheduleType } from '../../../../shared/models';

const OBJECTIVES: ProgramObjective[] = ['Hipertrofia', 'Fuerza', 'Resistencia', 'Funcional', 'Rendimiento', 'Otro'];
const LEVELS: ProgramLevel[] = ['Principiante', 'Intermedio', 'Avanzado', 'Todos'];

@Component({
  selector: 'kx-create-program-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ X, Check }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[200] bg-black/70" (click)="close.emit()"></div>
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201]
                w-[min(560px,calc(100vw-32px))] max-h-[calc(100vh-40px)]
                bg-bg border border-border rounded-2xl shadow-lg
                flex flex-col">
      <header class="flex items-center justify-between px-6 py-4 border-b border-border-light">
        <div>
          <div class="text-overline">Nuevo</div>
          <h2 class="text-h2 font-display">Crear programa</h2>
        </div>
        <button (click)="close.emit()" aria-label="Cerrar"
                class="p-2 rounded-md hover:bg-card-hover">
          <lucide-icon name="x" [size]="16"></lucide-icon>
        </button>
      </header>

      <div class="flex-1 overflow-auto p-6 flex flex-col gap-4 scroll-thin">
        <label class="flex flex-col gap-1">
          <span class="text-overline">Nombre del programa</span>
          <input class="input" [(ngModel)]="name" placeholder="Ej: Hipertrofia 8 semanas" autofocus />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-overline">Objetivo</span>
            <select class="select-styled" [(ngModel)]="objective">
              @for (o of objectives; track o) { <option [value]="o">{{ o }}</option> }
            </select>
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-overline">Nivel</span>
            <select class="select-styled" [(ngModel)]="level">
              @for (l of levels; track l) { <option [value]="l">{{ l }}</option> }
            </select>
          </label>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-overline">Duración</span>
          <div class="flex gap-2">
            <button type="button"
                    [class.bg-primary-subtle]="mode() === 'Fixed'"
                    [class.text-primary]="mode() === 'Fixed'"
                    [class.border-primary]="mode() === 'Fixed'"
                    class="flex-1 px-3 py-2.5 rounded-md border border-border text-left"
                    (click)="mode.set('Fixed')">
              <div class="text-sm font-semibold">Fija</div>
              <div class="text-[10px] font-mono text-text-muted">N semanas</div>
            </button>
            <button type="button"
                    [class.bg-primary-subtle]="mode() === 'Loop'"
                    [class.text-primary]="mode() === 'Loop'"
                    [class.border-primary]="mode() === 'Loop'"
                    class="flex-1 px-3 py-2.5 rounded-md border border-border text-left"
                    (click)="mode.set('Loop')">
              <div class="text-sm font-semibold">En bucle</div>
              <div class="text-[10px] font-mono text-text-muted">Se repite</div>
            </button>
          </div>
        </div>

        @if (mode() === 'Fixed') {
          <label class="flex flex-col gap-1">
            <span class="text-overline">Duración del programa</span>
            <div class="flex items-center gap-3">
              <input type="number" min="1" max="52" [(ngModel)]="durationWeeks"
                class="w-20 input text-center font-mono" />
              <span class="text-sm text-text-muted">semanas</span>
            </div>
          </label>
        }

        <div class="flex flex-col gap-1">
          <span class="text-overline">Días de la semana</span>
          <div class="flex gap-2">
            <button type="button"
                    [class.bg-primary-subtle]="scheduleType() === 'Week'"
                    [class.text-primary]="scheduleType() === 'Week'"
                    [class.border-primary]="scheduleType() === 'Week'"
                    class="flex-1 px-3 py-2.5 rounded-md border border-border text-left"
                    (click)="scheduleType.set('Week')">
              <div class="text-sm font-semibold">L–D</div>
              <div class="text-[10px] font-mono text-text-muted">Días reales</div>
            </button>
            <button type="button"
                    [class.bg-primary-subtle]="scheduleType() === 'Numbered'"
                    [class.text-primary]="scheduleType() === 'Numbered'"
                    [class.border-primary]="scheduleType() === 'Numbered'"
                    class="flex-1 px-3 py-2.5 rounded-md border border-border text-left"
                    (click)="scheduleType.set('Numbered')">
              <div class="text-sm font-semibold">Día 1–N</div>
              <div class="text-[10px] font-mono text-text-muted">Sin calendario</div>
            </button>
          </div>
        </div>

        @if (scheduleType() === 'Numbered') {
          <label class="flex flex-col gap-1">
            <span class="text-overline">Días por semana</span>
            <input type="number" min="1" max="7" [(ngModel)]="daysPerWeek"
                   class="w-20 input text-center font-mono" />
          </label>
        }
      </div>

      <footer class="px-6 py-3 border-t border-border-light flex justify-end gap-2">
        <button class="btn-ghost" (click)="close.emit()">Cancelar</button>
        <button class="btn-primary" [disabled]="!isValid() || saving()" (click)="submit()">
          <lucide-icon name="check" [size]="14"></lucide-icon>
          Crear y editar
        </button>
      </footer>
    </div>
  `,
})
export class CreateProgramModal {
  private programs = inject(ProgramsService);
  private router = inject(Router);

  readonly close = output<void>();
  readonly created = output<string>();

  protected readonly objectives = OBJECTIVES;
  protected readonly levels = LEVELS;
  protected readonly name = signal('');
  protected readonly objective = signal<ProgramObjective>('Hipertrofia');
  protected readonly level = signal<ProgramLevel>('Intermedio');
  protected readonly mode = signal<ProgramMode>('Fixed');
  protected readonly scheduleType = signal<ProgramScheduleType>('Week');
  protected readonly durationWeeks = signal(8);
  protected readonly daysPerWeek = signal(3);
  protected readonly saving = signal(false);

  protected readonly isValid = computed(() => {
    if (this.name().trim().length === 0) return false;
    if (this.mode() === 'Fixed' && (this.durationWeeks() < 1 || this.durationWeeks() > 52)) return false;
    if (this.scheduleType() === 'Numbered' && (this.daysPerWeek() < 1 || this.daysPerWeek() > 7)) return false;
    return true;
  });

  submit() {
    if (!this.isValid() || this.saving()) return;
    this.saving.set(true);
    const payload = {
      name: this.name().trim(),
      description: null,
      objective: this.objective(),
      level: this.level(),
      mode: this.mode(),
      scheduleType: this.scheduleType(),
      daysPerWeek: this.scheduleType() === 'Numbered' ? this.daysPerWeek() : null,
      durationWeeks: this.mode() === 'Loop' ? 1 : this.durationWeeks(),
    };
    this.programs.create(payload).subscribe({
      next: (resp) => {
        this.saving.set(false);
        this.created.emit(resp.id);
        this.close.emit();
        this.router.navigate(['/trainer/programs', resp.id]);
      },
      error: () => this.saving.set(false),
    });
  }
}
```

The `.input`, `.btn-ghost`, `.btn-primary`, `.select-styled` classes are existing utilities in `styles.css`.

- [ ] **Step 2: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/ui/create-program-modal.ts
git commit -m "feat(web): kx-create-program-modal"
```

---

### Task 3.3: Wire the modal into the program list

**Files:**
- Modify: `kondix-web/src/app/features/trainer/programs/feature/program-list.ts`

- [ ] **Step 1: Read current file**

```bash
cat kondix-web/src/app/features/trainer/programs/feature/program-list.ts
```

- [ ] **Step 2: Add the modal trigger**

Inside the component class add a signal for modal visibility and import the modal component:

```typescript
import { CreateProgramModal } from '../ui/create-program-modal';
// ...
imports: [/* existing */, CreateProgramModal],
// ...
protected readonly showCreate = signal(false);
```

In the template, where the existing "Nuevo programa" button or empty-state CTA is, set `(click)="showCreate.set(true)"`. Append at the bottom of the template (still inside the root element, but outside other content):

```html
@if (showCreate()) {
  <kx-create-program-modal
    (close)="showCreate.set(false)"
    (created)="onProgramCreated($event)" />
}
```

And in the class:

```typescript
onProgramCreated(_id: string) {
  // The modal handles navigation. Nothing else to do here today.
}
```

- [ ] **Step 3: Build + run frontend**

```bash
cd kondix-web && npm run build
```

If anything breaks because of legacy `Program` type usage, comment out the offending render block — Phase 6 redoes the list view.

- [ ] **Step 4: Manual smoke**

Run `npx ng serve`, log in as trainer, navigate to `/trainer/programs`, click "Nuevo programa" (or the empty-state CTA). Modal opens. Fill name, click "Crear y editar". Network tab shows `POST /api/v1/programs` 201; navigates to `/trainer/programs/<id>` (which Phase 4 wires to the editor — for now you may see an error or placeholder route, that's expected).

- [ ] **Step 5: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/feature/program-list.ts
git commit -m "feat(web): wire kx-create-program-modal into program list"
```

---

### Task 3.4: Phase 3 verification

- [ ] **Step 1: Build + tests**

```bash
cd kondix-web && npm run build && npm run test -- --run
cd .. && dotnet test Kondix.slnx
```

- [ ] **Step 2: Tag**

```bash
git tag programs-v3-phase-3-done
```

---

# Phase 4 — Editor (program-form.ts full refactor)

**Goal:** The trainer can edit a program's calendar via the new editor. All slot/week mutations work end-to-end. Both Week and Numbered modes render correctly. Mobile drawer responsive works.

This is the largest phase. Visual source of truth: `design_handoff_kondix_v2/prototypes/trainer/view-programs.jsx`. Match the prototype's spacing, colors, and copy.

**Verification at end of phase:**
- Manual smoke: trainer can create program → assign routine → toggle slots → publish.
- `cd kondix-web && npm run build` green.
- Mobile viewport (Chrome devtools, 375px) — inspector becomes drawer, grid scrolls horizontally.

---

### Task 4.1: Extend `programs.service.ts` with all write methods

**Files:**
- Modify: `kondix-web/src/app/features/trainer/programs/data-access/programs.service.ts`

- [ ] **Step 1: Append methods**

```typescript
update(id: string, payload: {
  name: string;
  description: string | null;
  notes: string | null;
  objective: ProgramObjective;
  level: ProgramLevel;
  mode: ProgramMode;
}) {
  return this.http.put<void>(`/api/v1/programs/${id}`, payload, { withCredentials: true });
}

delete(id: string) {
  return this.http.delete<void>(`/api/v1/programs/${id}`, { withCredentials: true });
}

publish(id: string) {
  return this.http.post<void>(`/api/v1/programs/${id}/publish`, {}, { withCredentials: true });
}

duplicate(id: string) {
  return this.http.post<{ id: string }>(`/api/v1/programs/${id}/duplicate`, {}, { withCredentials: true });
}

addWeek(id: string) {
  return this.http.post<void>(`/api/v1/programs/${id}/weeks`, {}, { withCredentials: true });
}

duplicateWeek(id: string, weekIndex: number) {
  return this.http.post<void>(`/api/v1/programs/${id}/weeks/${weekIndex}/duplicate`, {}, { withCredentials: true });
}

deleteWeek(id: string, weekIndex: number) {
  return this.http.delete<void>(`/api/v1/programs/${id}/weeks/${weekIndex}`, { withCredentials: true });
}

setSlot(id: string, weekIndex: number, dayIndex: number, kind: 'Empty' | 'Rest') {
  return this.http.put<void>(
    `/api/v1/programs/${id}/weeks/${weekIndex}/slots/${dayIndex}`,
    { kind }, { withCredentials: true });
}

assignRoutine(id: string, payload: {
  routineId: string;
  weeks: number[];
  mapping?: Record<string, number>;
  dayIds?: string[];
}) {
  return this.http.post<{ blockId: string }>(
    `/api/v1/programs/${id}/assign-routine`, payload, { withCredentials: true });
}

removeBlock(id: string, blockId: string) {
  return this.http.delete<void>(`/api/v1/programs/${id}/blocks/${blockId}`, { withCredentials: true });
}

fillRest(id: string) {
  return this.http.post<void>(`/api/v1/programs/${id}/fill-rest`, {}, { withCredentials: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/data-access/programs.service.ts
git commit -m "feat(web): programs.service all v3 write methods"
```

---

### Task 4.2: Build the weekday auto-suggest helper + Vitest spec

**Files:**
- Create: `kondix-web/src/app/features/trainer/programs/utils/weekday-mapping.ts`
- Create: `kondix-web/src/app/features/trainer/programs/utils/weekday-mapping.spec.ts`

- [ ] **Step 1: Write the spec first**

```typescript
import { describe, expect, it } from 'vitest';
import { suggestWeekdayMapping } from './weekday-mapping';

describe('suggestWeekdayMapping', () => {
  it('returns Mon/Wed/Fri for 3 days', () => {
    const result = suggestWeekdayMapping(['a', 'b', 'c']);
    expect(result).toEqual({ a: 0, b: 2, c: 4 });
  });

  it('extends to Tue/Thu for 5 days', () => {
    const result = suggestWeekdayMapping(['a', 'b', 'c', 'd', 'e']);
    expect(result).toEqual({ a: 0, b: 2, c: 4, d: 1, e: 3 });
  });

  it('caps at 7 days', () => {
    const result = suggestWeekdayMapping(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    // Pattern is [0, 2, 4, 1, 3, 5, 6]
    expect(Object.values(result).sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('returns null for days beyond index 6', () => {
    const result = suggestWeekdayMapping(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    expect(result['h']).toBeNull();
  });
});
```

- [ ] **Step 2: Run — fails (helper missing)**

```bash
cd kondix-web && npx vitest run src/app/features/trainer/programs/utils/weekday-mapping.spec.ts
```

- [ ] **Step 3: Implement**

```typescript
const PATTERN = [0, 2, 4, 1, 3, 5, 6] as const;

/**
 * Maps a list of routine-day IDs to weekday indices (0=Mon..6=Sun)
 * using the L-V spread pattern from the React prototype: Mon, Wed, Fri,
 * then Tue, Thu, Sat, Sun. Returns null for days beyond index 6.
 */
export function suggestWeekdayMapping(dayIds: readonly string[]): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  dayIds.forEach((id, i) => {
    result[id] = i < PATTERN.length ? PATTERN[i] : null;
  });
  return result;
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/utils/
git commit -m "feat(web): weekday auto-suggest helper + spec"
```

---

### Task 4.3: Build `ProgramEditorStore`

**Files:**
- Create: `kondix-web/src/app/features/trainer/programs/data-access/program-editor.store.ts`

- [ ] **Step 1: Write the store**

```typescript
import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ProgramsService } from './programs.service';
import { ProgramDetail, ProgramSlot, ProgramSlotKind, ProgramWeek } from '../../../../shared/models';

interface SelectedCell { weekIndex: number; dayIndex: number; }

interface State {
  program: ProgramDetail | null;
  loading: boolean;
  error: string | null;
  selected: SelectedCell | null;
}

const initial: State = { program: null, loading: false, error: null, selected: null };

export const ProgramEditorStore = signalStore(
  { providedIn: null },
  withState<State>(initial),
  withMethods((store, programs = inject(ProgramsService)) => {
    const reload = async (id: string) => {
      patchState(store, { loading: true, error: null });
      try {
        const program = await firstValueFrom(programs.getById(id));
        patchState(store, { program, loading: false });
      } catch (e: any) {
        patchState(store, { error: e?.message ?? 'Error', loading: false });
      }
    };

    return {
      reload,
      selectCell(weekIndex: number, dayIndex: number) {
        patchState(store, { selected: { weekIndex, dayIndex } });
      },
      clearSelection() {
        patchState(store, { selected: null });
      },
      async updateMeta(id: string, payload: Parameters<ProgramsService['update']>[1]) {
        await firstValueFrom(programs.update(id, payload));
        await reload(id);
      },
      async publish(id: string) {
        await firstValueFrom(programs.publish(id));
        await reload(id);
      },
      async addWeek(id: string) {
        await firstValueFrom(programs.addWeek(id));
        await reload(id);
      },
      async duplicateWeek(id: string, weekIndex: number) {
        await firstValueFrom(programs.duplicateWeek(id, weekIndex));
        await reload(id);
      },
      async deleteWeek(id: string, weekIndex: number) {
        await firstValueFrom(programs.deleteWeek(id, weekIndex));
        await reload(id);
      },
      async setSlot(id: string, weekIndex: number, dayIndex: number, kind: 'Empty' | 'Rest') {
        await firstValueFrom(programs.setSlot(id, weekIndex, dayIndex, kind));
        await reload(id);
      },
      async assignRoutine(id: string, payload: Parameters<ProgramsService['assignRoutine']>[1]) {
        await firstValueFrom(programs.assignRoutine(id, payload));
        await reload(id);
      },
      async removeBlock(id: string, blockId: string) {
        await firstValueFrom(programs.removeBlock(id, blockId));
        await reload(id);
      },
      async fillRest(id: string) {
        await firstValueFrom(programs.fillRest(id));
        await reload(id);
      },
    };
  })
);

export type ProgramEditorStoreType = InstanceType<typeof ProgramEditorStore>;
```

- [ ] **Step 2: Build to confirm types**

```bash
cd kondix-web && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/data-access/program-editor.store.ts
git commit -m "feat(web): ProgramEditorStore (NgRx SignalStore)"
```

---

### Task 4.4: Build `<kx-program-day-cell>`

**Files:**
- Create: `kondix-web/src/app/features/trainer/programs/ui/program-day-cell.ts`

Reference: `view-programs.jsx` `DayCell` line 964-1090. Three states: empty / rest / routineDay.

- [ ] **Step 1: Write the component**

```typescript
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Plus, Moon } from 'lucide-angular';
import { ProgramSlot } from '../../../../shared/models';

const OBJECTIVE_COLORS: Record<string, string> = {
  'Hipertrofia': '#E62639',
  'Fuerza': '#f59e0b',
  'Resistencia': '#22c55e',
  'Funcional': '#60a5fa',
  'Rendimiento': '#a78bfa',
  'Otro': '#78787f',
};

@Component({
  selector: 'kx-program-day-cell',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Plus, Moon }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button"
            (click)="select.emit()"
            [attr.aria-pressed]="isSelected()"
            class="relative w-full min-h-[64px] rounded-md text-left p-2 transition-colors"
            [class.ring-2]="isSelected()"
            [class.ring-primary]="isSelected()"
            [ngStyle]="cellStyle()">
      @switch (slot().kind) {
        @case ('Empty') {
          <div class="flex flex-col items-center justify-center h-full text-text-muted">
            <lucide-icon name="plus" [size]="14"></lucide-icon>
            <span class="text-[9px] font-mono mt-1">VACÍO</span>
          </div>
        }
        @case ('Rest') {
          <div class="flex flex-col items-center justify-center h-full text-text-muted">
            <lucide-icon name="moon" [size]="14"></lucide-icon>
            <span class="text-[9px] font-mono mt-1">DESCANSO</span>
          </div>
        }
        @case ('RoutineDay') {
          <div class="flex flex-col gap-1">
            <div class="text-[9px] font-mono uppercase tracking-wider truncate"
                 [style.color]="accentColor()">
              {{ slot().routineName }}
            </div>
            <div class="text-xs font-semibold leading-tight line-clamp-2">
              {{ slot().dayName }}
            </div>
          </div>
        }
      }
    </button>
  `,
})
export class ProgramDayCell {
  readonly slot = input.required<ProgramSlot>();
  readonly category = input<string | null>(null);
  readonly isSelected = input(false);

  readonly select = output<void>();

  protected readonly accentColor = computed(() =>
    OBJECTIVE_COLORS[this.category() ?? 'Otro'] ?? OBJECTIVE_COLORS['Otro']);

  protected readonly cellStyle = computed(() => {
    const slot = this.slot();
    if (slot.kind === 'RoutineDay') {
      const c = this.accentColor();
      return {
        background: `${c}10`,
        border: `1px solid ${c}55`,
        borderLeft: `3px solid ${c}`,
      };
    }
    return {
      background: 'var(--color-card)',
      border: '1px solid var(--color-border-light)',
    };
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/ui/program-day-cell.ts
git commit -m "feat(web): kx-program-day-cell (3 states)"
```

---

### Task 4.5: Build `<kx-program-week-row>`

**Files:**
- Create: `kondix-web/src/app/features/trainer/programs/ui/program-week-row.ts`

Reference: `view-programs.jsx` `WeekRow` line 900-960.

- [ ] **Step 1: Write**

```typescript
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, MoreVertical, Copy, Trash } from 'lucide-angular';
import { ProgramDayCell } from './program-day-cell';
import { ProgramWeek } from '../../../../shared/models';

@Component({
  selector: 'kx-program-week-row',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ProgramDayCell],
  providers: [{ provide: LUCIDE_ICONS, multi: true,
                useValue: new LucideIconProvider({ MoreVertical, Copy, Trash }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-1.5 items-stretch" [style.grid-template-columns]="gridTemplate()">
      <!-- Week label -->
      <div class="bg-card border border-border-light rounded-md p-2 flex flex-col justify-center">
        <div class="font-display text-sm font-bold tracking-tight">Sem {{ week().weekIndex + 1 }}</div>
        <div class="text-[9px] text-text-muted font-mono mt-0.5">
          {{ filledCount() }}/{{ slotCount() }} SESIONES
        </div>
      </div>

      <!-- Day cells -->
      @for (slot of week().slots; track slot.id) {
        <kx-program-day-cell
          [slot]="slot"
          [category]="categoryFor(slot)"
          [isSelected]="selectedDayIndex() === slot.dayIndex"
          (select)="selectCell.emit(slot.dayIndex)" />
      }

      <!-- Week menu (hidden when hideMenu=true, e.g. loop mode) -->
      @if (!hideMenu()) {
        <div class="relative flex items-center justify-center">
          <button type="button"
                  (click)="menuOpen.set(!menuOpen())"
                  class="p-1.5 rounded-md hover:bg-card-hover">
            <lucide-icon name="more-vertical" [size]="14"></lucide-icon>
          </button>
          @if (menuOpen()) {
            <div class="absolute right-0 top-full mt-1 z-10 bg-bg border border-border rounded-md shadow-lg py-1 min-w-[160px]">
              <button class="w-full text-left px-3 py-2 text-sm hover:bg-card-hover flex items-center gap-2"
                      (click)="duplicate.emit(); menuOpen.set(false)">
                <lucide-icon name="copy" [size]="13"></lucide-icon> Duplicar
              </button>
              @if (canDelete()) {
                <button class="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 flex items-center gap-2"
                        (click)="delete.emit(); menuOpen.set(false)">
                  <lucide-icon name="trash" [size]="13"></lucide-icon> Eliminar
                </button>
              }
            </div>
          }
        </div>
      } @else {
        <div></div>
      }
    </div>
  `,
})
export class ProgramWeekRow {
  readonly week = input.required<ProgramWeek>();
  readonly selectedDayIndex = input<number | null>(null);
  readonly hideMenu = input(false);
  readonly canDelete = input(true);
  readonly programObjective = input<string | null>(null);

  readonly selectCell = output<number>();
  readonly duplicate = output<void>();
  readonly delete = output<void>();

  protected readonly menuOpen = signal(false);
  protected readonly slotCount = computed(() => this.week().slots.length);
  protected readonly filledCount = computed(() =>
    this.week().slots.filter(s => s.kind === 'RoutineDay').length);
  protected readonly gridTemplate = computed(() => {
    const cells = this.slotCount();
    return `90px repeat(${cells}, minmax(82px, 1fr)) 40px`;
  });

  categoryFor(_slot: any): string | null { return this.programObjective(); }
}
```

- [ ] **Step 2: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/ui/program-week-row.ts
git commit -m "feat(web): kx-program-week-row"
```

---

### Task 4.6: Build `<kx-program-meta-panel>`

**Files:**
- Create: `kondix-web/src/app/features/trainer/programs/ui/program-meta-panel.ts`

Reference: `view-programs.jsx` left panel inside `ProgramEditor` line 651-732.

- [ ] **Step 1: Write**

```typescript
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramDetail, ProgramLevel, ProgramMode, ProgramObjective } from '../../../../shared/models';

interface MetaPatch {
  name?: string;
  description?: string | null;
  notes?: string | null;
  objective?: ProgramObjective;
  level?: ProgramLevel;
  mode?: ProgramMode;
}

const OBJECTIVES: ProgramObjective[] = ['Hipertrofia', 'Fuerza', 'Resistencia', 'Funcional', 'Rendimiento', 'Otro'];
const LEVELS: ProgramLevel[] = ['Principiante', 'Intermedio', 'Avanzado', 'Todos'];

@Component({
  selector: 'kx-program-meta-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="border-r border-border-light bg-bg p-5 overflow-auto scroll-thin">
      <div class="text-overline mb-2">Programa</div>
      <input class="w-full bg-transparent border-none outline-none font-display text-2xl font-bold tracking-tight text-text mb-1.5"
             [ngModel]="program().name" (ngModelChange)="patch.emit({ name: $event })" />
      <textarea class="w-full bg-transparent border-none outline-none resize-none text-text-secondary text-sm leading-relaxed font-sans min-h-[48px]"
                placeholder="Describe el objetivo del programa…"
                [ngModel]="program().description ?? ''"
                (ngModelChange)="patch.emit({ description: $event || null })"></textarea>

      <div class="h-px bg-border-light my-4"></div>

      <label class="block mb-3">
        <span class="text-overline">Objetivo</span>
        <select class="select-styled w-full mt-1"
                [ngModel]="program().objective"
                (ngModelChange)="patch.emit({ objective: $event })">
          @for (o of objectives; track o) { <option [value]="o">{{ o }}</option> }
        </select>
      </label>

      <label class="block mb-3">
        <span class="text-overline">Nivel</span>
        <select class="select-styled w-full mt-1"
                [ngModel]="program().level"
                (ngModelChange)="patch.emit({ level: $event })">
          @for (l of levels; track l) { <option [value]="l">{{ l }}</option> }
        </select>
      </label>

      <div class="mb-3">
        <span class="text-overline">Duración</span>
        <div class="flex gap-1.5 mt-1">
          <button type="button"
                  class="flex-1 px-3 py-2 rounded-md border text-left"
                  [class.border-primary]="program().mode === 'Fixed'"
                  [class.bg-primary-subtle]="program().mode === 'Fixed'"
                  [class.text-primary]="program().mode === 'Fixed'"
                  [class.border-border]="program().mode !== 'Fixed'"
                  (click)="onModeChange('Fixed')">
            <div class="text-sm font-semibold">Fija</div>
            <div class="text-[10px] font-mono text-text-muted">{{ program().weeks.length }} sem</div>
          </button>
          <button type="button"
                  class="flex-1 px-3 py-2 rounded-md border text-left"
                  [class.border-primary]="program().mode === 'Loop'"
                  [class.bg-primary-subtle]="program().mode === 'Loop'"
                  [class.text-primary]="program().mode === 'Loop'"
                  [class.border-border]="program().mode !== 'Loop'"
                  (click)="onModeChange('Loop')">
            <div class="text-sm font-semibold">En bucle</div>
            <div class="text-[10px] font-mono text-text-muted">∞</div>
          </button>
        </div>
      </div>

      <div class="h-px bg-border-light my-4"></div>

      <div class="text-overline mb-2">Notas internas</div>
      <textarea class="w-full bg-bg-raised border border-border rounded-md outline-none p-2.5 text-text text-xs font-sans resize-y min-h-[72px] leading-relaxed"
                placeholder="Notas privadas para ti, no visibles al estudiante."
                [ngModel]="program().notes ?? ''"
                (ngModelChange)="patch.emit({ notes: $event || null })"></textarea>

      <div class="h-px bg-border-light my-4"></div>
      <div class="text-[11px] text-text-muted font-mono leading-relaxed">
        <div>{{ program().weeks.length }} semanas · {{ totalSessions() }} sesiones</div>
        <div>{{ program().assignedCount }} estudiantes asignados</div>
      </div>
    </aside>
  `,
})
export class ProgramMetaPanel {
  readonly program = input.required<ProgramDetail>();
  readonly patch = output<MetaPatch>();
  readonly modeChange = output<ProgramMode>();

  protected readonly objectives = OBJECTIVES;
  protected readonly levels = LEVELS;

  protected readonly totalSessions = computed(() =>
    this.program().weeks.reduce((a, w) => a + w.slots.filter(s => s.kind === 'RoutineDay').length, 0));

  onModeChange(mode: ProgramMode) {
    if (this.program().mode === mode) return;
    this.modeChange.emit(mode);  // The parent confirms + may collapse weeks before issuing the patch
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/ui/program-meta-panel.ts
git commit -m "feat(web): kx-program-meta-panel"
```

---

### Task 4.7: Build `<kx-cell-inspector>`

**Files:**
- Create: `kondix-web/src/app/features/trainer/programs/ui/cell-inspector.ts`

Reference: `view-programs.jsx` `CellInspector` line 1094-1135 + `EmptySlotInspector` 1129-1142 + `RestSlotInspector` 1144-1168 + `RoutineSlotInspector` 1170-1207. **Drop the "Progresión" overrides section** (Q6 closed).

- [ ] **Step 1: Write**

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Plus, Moon, Trash, X } from 'lucide-angular';
import { ProgramSlot } from '../../../../shared/models';

@Component({
  selector: 'kx-cell-inspector',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true,
                useValue: new LucideIconProvider({ Plus, Moon, Trash, X }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (slot(); as s) {
      <div class="p-5">
        <div class="text-overline mb-1">Semana {{ (weekIndex() ?? 0) + 1 }} · {{ dayLabel() }}</div>
        @switch (s.kind) {
          @case ('Empty') {
            <h3 class="font-display text-lg my-2">Día vacío</h3>
            <p class="text-xs text-text-muted leading-relaxed mb-4">
              Elige qué hacer en este día: asignar una rutina o marcar descanso explícito.
            </p>
            <div class="flex flex-col gap-2">
              <button class="btn-primary w-full" (click)="assign.emit()">
                <lucide-icon name="plus" [size]="14"></lucide-icon> Asignar rutina
              </button>
              @if (canMarkRest()) {
                <button class="btn-outline w-full" (click)="setKind.emit('Rest')">
                  <lucide-icon name="moon" [size]="14"></lucide-icon> Marcar como descanso
                </button>
              }
            </div>
          }
          @case ('Rest') {
            <div class="flex items-center gap-2 mt-1">
              <div class="w-8 h-8 rounded-md bg-bg-raised border border-border flex items-center justify-center">
                <lucide-icon name="moon" [size]="14"></lucide-icon>
              </div>
              <div>
                <h3 class="font-display text-lg leading-tight">Descanso</h3>
                <div class="text-[11px] text-text-muted font-mono">DÍA DE RECUPERACIÓN</div>
              </div>
            </div>
            <p class="text-xs text-text-muted leading-relaxed my-3">
              El estudiante verá este día marcado como descanso.
            </p>
            <button class="btn-outline w-full" (click)="setKind.emit('Empty')">
              Quitar descanso
            </button>
          }
          @case ('RoutineDay') {
            <div class="rounded-xl p-3 mt-1"
                 style="border:1px solid var(--color-primary)55;border-left:3px solid var(--color-primary);background:var(--color-primary)10;">
              <div class="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">{{ s.routineName }}</div>
              <h3 class="font-display text-lg leading-tight">{{ s.dayName }}</h3>
            </div>
            <div class="flex gap-1.5 mt-3 flex-wrap">
              @if (s.blockId) {
                <button class="btn-ghost btn-sm" (click)="removeBlock.emit(s.blockId!)">
                  <lucide-icon name="trash" [size]="13"></lucide-icon> Quitar rutina
                </button>
              } @else {
                <button class="btn-ghost btn-sm" (click)="setKind.emit('Empty')">
                  <lucide-icon name="trash" [size]="13"></lucide-icon> Quitar
                </button>
              }
            </div>
          }
        }
      </div>
    } @else {
      <div class="p-5">
        <div class="text-overline mb-2">Detalle</div>
        <div class="p-5 border border-dashed border-border rounded-lg text-center text-xs text-text-muted leading-relaxed">
          Selecciona un día del calendario para ver y editar sus detalles.
        </div>
      </div>
    }
  `,
})
export class CellInspector {
  readonly slot = input<ProgramSlot | null>(null);
  readonly weekIndex = input<number | null>(null);
  readonly dayLabel = input<string | null>(null);
  readonly canMarkRest = input(true);  // false in Numbered mode

  readonly setKind = output<'Empty' | 'Rest'>();
  readonly assign = output<void>();
  readonly removeBlock = output<string>();
}
```

- [ ] **Step 2: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/ui/cell-inspector.ts
git commit -m "feat(web): kx-cell-inspector (no Progresión section)"
```

---

### Task 4.8: Build `<kx-assign-routine-modal>` — picker + mapping (Week + Numbered branches)

**Files:**
- Create: `kondix-web/src/app/features/trainer/programs/ui/assign-routine-modal.ts`

This is the largest single component. Reference: `view-programs.jsx` `AssignRoutineModal` line 1319-1630. Two-step wizard with internal branch by `scheduleType`.

- [ ] **Step 1: Write the wizard**

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, X, Search, ArrowLeft, Check, Plus } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProgramDetail, ProgramScheduleType } from '../../../../shared/models';
import { suggestWeekdayMapping } from '../utils/weekday-mapping';

interface RoutineLite { id: string; name: string; category?: string | null; days: { id: string; name: string; }[]; }

@Component({
  selector: 'kx-assign-routine-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true,
                useValue: new LucideIconProvider({ X, Search, ArrowLeft, Check, Plus }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[200] bg-black/70" (click)="close.emit()"></div>
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201]
                w-[min(780px,calc(100vw-32px))] max-h-[calc(100vh-40px)]
                bg-bg border border-border rounded-2xl shadow-lg flex flex-col">
      @if (step() === 1) {
        <ng-container *ngTemplateOutlet="step1"></ng-container>
      } @else {
        <ng-container *ngTemplateOutlet="step2"></ng-container>
      }
    </div>

    <ng-template #step1>
      <header class="px-6 py-4 border-b border-border-light flex items-center justify-between">
        <div>
          <div class="text-overline">Paso 1 de 2 · Rutina</div>
          <h2 class="text-h2 font-display">Selecciona una rutina</h2>
        </div>
        <button (click)="close.emit()" class="p-2"><lucide-icon name="x" [size]="16"></lucide-icon></button>
      </header>
      <div class="px-6 py-3 border-b border-border-light flex gap-2 items-center">
        <input class="input flex-1" [(ngModel)]="query" placeholder="Buscar rutina…" />
      </div>
      <div class="flex-1 overflow-auto p-3 scroll-thin">
        @if (filtered().length === 0) {
          <div class="p-10 text-center text-sm text-text-muted">
            No se encontraron rutinas.
          </div>
        } @else {
          <div class="flex flex-col gap-1.5">
            @for (r of filtered(); track r.id) {
              <button class="flex gap-3 items-center p-3 rounded-md border border-border-light bg-card hover:border-primary hover:bg-card-hover text-left"
                      (click)="pick(r)">
                <div class="w-1 h-8 bg-primary rounded-sm"></div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-text">{{ r.name }}</div>
                  <div class="text-[10px] text-text-muted font-mono mt-0.5">{{ r.days.length }} días</div>
                </div>
                <lucide-icon name="plus" [size]="14"></lucide-icon>
              </button>
            }
          </div>
        }
      </div>
      <footer class="px-6 py-3 border-t border-border-light flex justify-end">
        <button class="btn-ghost" (click)="close.emit()">Cancelar</button>
      </footer>
    </ng-template>

    <ng-template #step2>
      <header class="px-6 py-4 border-b border-border-light flex items-center justify-between">
        <div class="min-w-0 flex-1">
          <div class="text-overline">Paso 2 de 2 · Mapeo</div>
          <h2 class="text-h2 font-display truncate">{{ routine()?.name }}</h2>
        </div>
        <button (click)="close.emit()" class="p-2"><lucide-icon name="x" [size]="16"></lucide-icon></button>
      </header>

      <div class="flex-1 overflow-auto p-6 scroll-thin">
        <!-- Scope -->
        <div class="text-overline mb-2">En qué semanas</div>
        <div class="flex gap-2 mb-3 flex-wrap">
          <button class="px-3 py-2 rounded-md border text-sm font-semibold"
                  [class.bg-primary]="scope() === 'all'"
                  [class.text-white]="scope() === 'all'"
                  [class.border-primary]="scope() === 'all'"
                  [class.bg-bg-raised]="scope() !== 'all'"
                  [class.border-border]="scope() !== 'all'"
                  (click)="scope.set('all')">Todas ({{ totalWeeks() }})</button>
          <button class="px-3 py-2 rounded-md border text-sm font-semibold"
                  [class.bg-primary]="scope() === 'range'"
                  [class.text-white]="scope() === 'range'"
                  [class.border-primary]="scope() === 'range'"
                  [class.bg-bg-raised]="scope() !== 'range'"
                  [class.border-border]="scope() !== 'range'"
                  (click)="scope.set('range')">Un rango</button>
          <button class="px-3 py-2 rounded-md border text-sm font-semibold"
                  [class.bg-primary]="scope() === 'one'"
                  [class.text-white]="scope() === 'one'"
                  [class.border-primary]="scope() === 'one'"
                  [class.bg-bg-raised]="scope() !== 'one'"
                  [class.border-border]="scope() !== 'one'"
                  (click)="scope.set('one')">Una sola</button>
        </div>

        @if (scope() === 'range') {
          <div class="flex gap-2 items-center mb-3 text-sm">
            <span class="text-[11px] text-text-muted font-mono">DE</span>
            <input type="number" class="input w-16 text-center font-mono" [(ngModel)]="rangeStart" [min]="1" [max]="totalWeeks()" />
            <span class="text-[11px] text-text-muted font-mono">A</span>
            <input type="number" class="input w-16 text-center font-mono" [(ngModel)]="rangeEnd" [min]="1" [max]="totalWeeks()" />
          </div>
        }
        @if (scope() === 'one') {
          <div class="flex gap-2 items-center mb-3 text-sm">
            <span class="text-[11px] text-text-muted font-mono">SEMANA</span>
            <input type="number" class="input w-16 text-center font-mono" [(ngModel)]="singleWeek" [min]="1" [max]="totalWeeks()" />
          </div>
        }

        <div class="text-[11px] text-text-muted font-mono mb-5">
          APLICA A {{ weeksSelected().length }} SEMANA{{ weeksSelected().length === 1 ? '' : 'S' }}
        </div>

        <!-- Mapping (Week mode only) -->
        @if (program().scheduleType === 'Week') {
          <div class="text-overline mb-2">Mapear días a la semana</div>
          <p class="text-xs text-text-muted mb-3 leading-relaxed">
            Asigna cada día de la rutina a un día de la semana. Debes mapear todos.
          </p>
          <div class="flex flex-col gap-2">
            @for (d of routine()?.days ?? []; track d.id) {
              <div class="flex items-center gap-3 p-3 bg-card rounded-md flex-wrap"
                   [class.border]="true"
                   [class.border-warning]="mapping()[d.id] == null"
                   [class.border-border-light]="mapping()[d.id] != null">
                <div class="flex-1 min-w-[140px]">
                  <div class="text-sm font-semibold">{{ d.name }}</div>
                </div>
                <div class="flex gap-1 flex-wrap">
                  @for (lbl of weekdayLabels; track $index) {
                    <button type="button"
                            class="w-9 h-8 rounded-md border text-xs font-mono font-semibold"
                            [class.bg-primary]="mapping()[d.id] === $index"
                            [class.text-white]="mapping()[d.id] === $index"
                            [class.border-primary]="mapping()[d.id] === $index"
                            [class.bg-bg-raised]="mapping()[d.id] !== $index"
                            [class.border-border]="mapping()[d.id] !== $index"
                            (click)="setMapping(d.id, $index)">{{ lbl }}</button>
                  }
                </div>
              </div>
            }
          </div>
          @if (hasCollision()) {
            <div class="mt-3 p-3 rounded-md text-xs"
                 style="background:color-mix(in oklab, var(--color-warning) 12%, transparent);border:1px solid var(--color-warning);">
              <strong>Colisión:</strong> dos días de rutina tienen el mismo día de la semana.
            </div>
          }
        }

        <!-- Numbered mode: select which routine days to add -->
        @if (program().scheduleType === 'Numbered') {
          <div class="text-overline mb-2">Selecciona días de la rutina</div>
          <p class="text-xs text-text-muted mb-3 leading-relaxed">
            Hasta {{ program().daysPerWeek }} días. Se agregan en el orden seleccionado.
          </p>
          <div class="flex flex-col gap-2">
            @for (d of routine()?.days ?? []; track d.id) {
              <button type="button"
                      class="flex items-center gap-3 p-3 rounded-md border text-left"
                      [class.border-primary]="numberedSelected().includes(d.id)"
                      [class.bg-primary-subtle]="numberedSelected().includes(d.id)"
                      [class.border-border-light]="!numberedSelected().includes(d.id)"
                      [class.bg-card]="!numberedSelected().includes(d.id)"
                      (click)="toggleNumberedDay(d.id)">
                <div class="text-sm font-semibold flex-1">{{ d.name }}</div>
                @if (numberedSelected().includes(d.id)) {
                  <span class="text-xs font-mono text-primary">
                    Día {{ numberedSelected().indexOf(d.id) + 1 }}
                  </span>
                }
              </button>
            }
          </div>
          @if (numberedSelected().length > (program().daysPerWeek ?? 0)) {
            <div class="mt-3 p-3 rounded-md text-xs"
                 style="background:color-mix(in oklab, var(--color-warning) 12%, transparent);border:1px solid var(--color-warning);">
              Demasiados días seleccionados. El programa permite {{ program().daysPerWeek }}.
            </div>
          }
        }
      </div>

      <footer class="px-6 py-3 border-t border-border-light flex justify-between items-center gap-3">
        <button class="btn-ghost" (click)="step.set(1)">
          <lucide-icon name="arrow-left" [size]="14"></lucide-icon> Cambiar rutina
        </button>
        <div class="flex gap-2">
          <button class="btn-outline" (click)="close.emit()">Cancelar</button>
          <button class="btn-primary" [disabled]="!canSubmit()" (click)="submit()">
            <lucide-icon name="check" [size]="14"></lucide-icon>
            Asignar a {{ weeksSelected().length }} sem
          </button>
        </div>
      </footer>
    </ng-template>
  `,
})
export class AssignRoutineModal implements OnInit {
  private http = inject(HttpClient);

  readonly program = input.required<ProgramDetail>();
  readonly initialWeek = input(0);

  readonly close = output<void>();
  readonly assigned = output<{ routineId: string; weeks: number[]; mapping?: Record<string, number>; dayIds?: string[]; }>();

  protected readonly weekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  protected readonly step = signal<1 | 2>(1);
  protected readonly query = signal('');
  protected readonly library = signal<RoutineLite[]>([]);
  protected readonly routine = signal<RoutineLite | null>(null);
  protected readonly mapping = signal<Record<string, number | null>>({});
  protected readonly numberedSelected = signal<string[]>([]);

  protected readonly scope = signal<'all' | 'range' | 'one'>('all');
  protected readonly rangeStart = signal(1);
  protected readonly rangeEnd = signal(1);
  protected readonly singleWeek = signal(1);

  protected readonly totalWeeks = computed(() => this.program().weeks.length);
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.library().filter(r => !q || r.name.toLowerCase().includes(q));
  });

  protected readonly weeksSelected = computed<number[]>(() => {
    if (this.scope() === 'all') {
      return Array.from({ length: this.totalWeeks() }, (_, i) => i);
    }
    if (this.scope() === 'one') {
      return [this.singleWeek() - 1];
    }
    const s = Math.min(this.rangeStart(), this.rangeEnd()) - 1;
    const e = Math.max(this.rangeStart(), this.rangeEnd()) - 1;
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  });

  protected readonly hasCollision = computed(() => {
    const m = this.mapping();
    const taken = new Map<number, number>();
    for (const v of Object.values(m)) {
      if (v == null) continue;
      taken.set(v, (taken.get(v) ?? 0) + 1);
    }
    return Array.from(taken.values()).some(c => c > 1);
  });

  protected readonly canSubmit = computed(() => {
    if (this.weeksSelected().length === 0) return false;
    if (this.program().scheduleType === 'Week') {
      const m = this.mapping();
      const allMapped = (this.routine()?.days ?? []).every(d => m[d.id] != null);
      return allMapped && !this.hasCollision();
    }
    const sel = this.numberedSelected();
    const max = this.program().daysPerWeek ?? 0;
    return sel.length > 0 && sel.length <= max;
  });

  ngOnInit() {
    this.rangeStart.set((this.initialWeek() ?? 0) + 1);
    this.rangeEnd.set(this.totalWeeks());
    this.singleWeek.set((this.initialWeek() ?? 0) + 1);
    // Load routine library.
    firstValueFrom(this.http.get<RoutineLite[]>('/api/v1/routines', { withCredentials: true }))
      .then(rs => this.library.set(rs ?? []))
      .catch(() => this.library.set([]));
  }

  pick(r: RoutineLite) {
    this.routine.set(r);
    if (this.program().scheduleType === 'Week') {
      this.mapping.set(suggestWeekdayMapping(r.days.map(d => d.id)));
    } else {
      this.numberedSelected.set([]);
    }
    this.step.set(2);
  }

  setMapping(dayId: string, weekdayIdx: number) {
    const cur = this.mapping();
    if (cur[dayId] === weekdayIdx) {
      this.mapping.set({ ...cur, [dayId]: null });
    } else {
      this.mapping.set({ ...cur, [dayId]: weekdayIdx });
    }
  }

  toggleNumberedDay(dayId: string) {
    const cur = this.numberedSelected();
    if (cur.includes(dayId)) {
      this.numberedSelected.set(cur.filter(x => x !== dayId));
    } else {
      this.numberedSelected.set([...cur, dayId]);
    }
  }

  submit() {
    if (!this.canSubmit()) return;
    const r = this.routine()!;
    if (this.program().scheduleType === 'Week') {
      const m = this.mapping();
      const cleaned: Record<string, number> = {};
      for (const [k, v] of Object.entries(m)) if (v != null) cleaned[k] = v;
      this.assigned.emit({ routineId: r.id, weeks: this.weeksSelected(), mapping: cleaned });
    } else {
      this.assigned.emit({ routineId: r.id, weeks: this.weeksSelected(), dayIds: this.numberedSelected() });
    }
    this.close.emit();
  }
}
```

The endpoint shape `GET /api/v1/routines` should already return the routine library. If the existing endpoint returns a different shape (e.g., wrapped in `{ items: [...] }`), adapt the load call accordingly.

- [ ] **Step 2: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/ui/assign-routine-modal.ts
git commit -m "feat(web): kx-assign-routine-modal (Week + Numbered branches)"
```

---

### Task 4.9: Replace `program-form.ts` with the new editor shell

**Files:**
- Replace: `kondix-web/src/app/features/trainer/programs/feature/program-form.ts`

This deletes the existing v2-Phase-5 form (629 LOC). The new file is the editor shell that orchestrates all UI components from Tasks 4.4-4.8.

- [ ] **Step 1: Replace contents**

```typescript
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, ArrowLeft, Users, Check, Plus, Moon, X } from 'lucide-angular';

import { ProgramEditorStore } from '../data-access/program-editor.store';
import { ProgramMetaPanel } from '../ui/program-meta-panel';
import { ProgramWeekRow } from '../ui/program-week-row';
import { CellInspector } from '../ui/cell-inspector';
import { AssignRoutineModal } from '../ui/assign-routine-modal';
import { ProgramSlot } from '../../../../shared/models';

@Component({
  selector: 'kx-program-editor-page',
  standalone: true,
  imports: [
    CommonModule, LucideAngularModule,
    ProgramMetaPanel, ProgramWeekRow, CellInspector, AssignRoutineModal,
  ],
  providers: [
    ProgramEditorStore,
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ ArrowLeft, Users, Check, Plus, Moon, X }) },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.program(); as p) {
      <div class="flex flex-col h-full bg-bg-deep">
        <!-- Top bar -->
        <div class="flex-shrink-0 px-5 py-2.5 border-b border-border-light bg-bg flex items-center gap-2.5 justify-between">
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            <button class="btn-ghost btn-sm" (click)="back()">
              <lucide-icon name="arrow-left" [size]="14"></lucide-icon> Volver
            </button>
            <span class="text-overline">Editando</span>
            <span class="text-sm font-semibold ml-2 truncate">{{ p.name }}</span>
            @if (!p.isPublished) {
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-md border border-border text-text-muted">BORRADOR</span>
            }
          </div>
          <div class="flex gap-2">
            @if (!p.isPublished) {
              <button class="btn-primary btn-sm" (click)="publish()">
                <lucide-icon name="check" [size]="14"></lucide-icon> Publicar
              </button>
            }
            <button class="btn-outline btn-sm" (click)="goAssign()" [disabled]="!p.isPublished">
              <lucide-icon name="users" [size]="14"></lucide-icon> Asignar
            </button>
          </div>
        </div>

        <div class="flex-1 grid k-prog-grid min-h-0"
             [style.grid-template-columns]="'320px 1fr 340px'">
          <!-- Left: meta panel -->
          <kx-program-meta-panel
            [program]="p"
            (patch)="onMetaPatch($event)"
            (modeChange)="onModeChange($event)" />

          <!-- Center: weekly grid -->
          <main class="overflow-auto p-5 pb-20 scroll-thin">
            <div class="flex items-center justify-between mb-4">
              <div>
                <div class="text-overline">Calendario</div>
                <h2 class="text-h2 font-display mt-0.5">
                  {{ p.mode === 'Loop' ? 'Semana base (se repite)' : 'Estructura semanal' }}
                </h2>
              </div>
              <div class="flex gap-2 flex-wrap">
                <button class="btn-primary btn-sm" (click)="openAssignFor(0)">
                  <lucide-icon name="plus" [size]="14"></lucide-icon> Asignar rutina
                </button>
                @if (showFillRest()) {
                  <button class="btn-outline btn-sm" (click)="fillRest()">
                    <lucide-icon name="moon" [size]="14"></lucide-icon> Rellenar descansos
                  </button>
                }
                @if (p.mode === 'Fixed') {
                  <button class="btn-outline btn-sm" (click)="addWeek()">
                    <lucide-icon name="plus" [size]="14"></lucide-icon> Añadir semana
                  </button>
                }
              </div>
            </div>

            <div class="overflow-x-auto pb-1.5 k-prog-scroller">
              <div [style.min-width.px]="720">
                <!-- Day headers -->
                <div class="grid gap-1.5 mb-1.5"
                     [style.grid-template-columns]="gridTemplate()">
                  <div></div>
                  @for (lbl of dayLabels(); track $index) {
                    <div class="text-[10px] font-mono tracking-wider text-text-muted text-center py-1.5">{{ lbl }}</div>
                  }
                  <div></div>
                </div>

                <div class="flex flex-col gap-1.5">
                  @for (w of p.weeks; track w.id) {
                    <kx-program-week-row
                      [week]="w"
                      [selectedDayIndex]="store.selected()?.weekIndex === w.weekIndex ? store.selected()!.dayIndex : null"
                      [hideMenu]="p.mode === 'Loop'"
                      [canDelete]="p.weeks.length > 1"
                      [programObjective]="p.objective"
                      (selectCell)="selectCell(w.weekIndex, $event)"
                      (duplicate)="duplicateWeek(w.weekIndex)"
                      (delete)="deleteWeek(w.weekIndex)" />
                  }
                </div>
              </div>
            </div>
          </main>

          <!-- Right: inspector (drawer on narrow) -->
          <aside class="border-l border-border-light bg-bg overflow-auto scroll-thin k-prog-inspector"
                 [class.is-open]="!!store.selected()">
            <button (click)="store.clearSelection()"
                    class="k-prog-inspector-close sticky top-0 self-end bg-bg-raised border border-border rounded-md p-1.5 cursor-pointer ml-auto z-[2]"
                    style="display:none;" aria-label="Cerrar panel">
              <lucide-icon name="x" [size]="14"></lucide-icon>
            </button>
            <kx-cell-inspector
              [slot]="activeSlot()"
              [weekIndex]="store.selected()?.weekIndex ?? null"
              [dayLabel]="activeDayLabel()"
              [canMarkRest]="p.scheduleType === 'Week'"
              (setKind)="onSetKind($event)"
              (assign)="openAssignFor(store.selected()!.weekIndex)"
              (removeBlock)="removeBlock($event)" />
          </aside>

          @if (store.selected()) {
            <div class="k-prog-inspector-backdrop fixed inset-0 bg-black/50 z-[49]" style="display:none;"
                 (click)="store.clearSelection()"></div>
          }
        </div>

        @if (assignFor() != null) {
          <kx-assign-routine-modal
            [program]="p"
            [initialWeek]="assignFor()!"
            (close)="assignFor.set(null)"
            (assigned)="onRoutineAssigned($event)" />
        }
      </div>
    } @else if (store.loading()) {
      <div class="p-10 text-center text-text-muted">Cargando…</div>
    } @else if (store.error()) {
      <div class="p-10 text-center text-danger">Error: {{ store.error() }}</div>
    }
  `,
  styles: [`
    @media (max-width: 1180px) {
      :host ::ng-deep .k-prog-grid { grid-template-columns: 240px 1fr !important; }
      :host ::ng-deep .k-prog-inspector {
        position: fixed !important;
        top: 0; right: 0; bottom: 0;
        width: min(380px, 92vw);
        z-index: 50;
        box-shadow: -12px 0 32px rgba(0,0,0,0.5);
        transform: translateX(100%);
        transition: transform .2s ease;
        display: flex !important;
        flex-direction: column;
      }
      :host ::ng-deep .k-prog-inspector.is-open { transform: translateX(0); }
      :host ::ng-deep .k-prog-inspector-close { display: flex !important; margin: 10px 10px 0 auto !important; }
      :host ::ng-deep .k-prog-inspector-backdrop { display: block !important; }
    }
    @media (max-width: 820px) {
      :host ::ng-deep .k-prog-grid { grid-template-columns: 1fr !important; }
    }
  `],
})
export class ProgramEditorPage implements OnInit {
  protected readonly store = inject(ProgramEditorStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected readonly programId = signal<string>('');
  protected readonly assignFor = signal<number | null>(null);

  protected readonly dayLabels = computed(() => {
    const p = this.store.program();
    if (!p) return [];
    if (p.scheduleType === 'Numbered') {
      return Array.from({ length: p.daysPerWeek ?? 0 }, (_, i) => `D${i + 1}`);
    }
    return ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  });

  protected readonly gridTemplate = computed(() => {
    const cells = this.dayLabels().length;
    return `90px repeat(${cells}, minmax(82px, 1fr)) 40px`;
  });

  protected readonly activeSlot = computed<ProgramSlot | null>(() => {
    const p = this.store.program();
    const sel = this.store.selected();
    if (!p || !sel) return null;
    const week = p.weeks.find(w => w.weekIndex === sel.weekIndex);
    return week?.slots.find(s => s.dayIndex === sel.dayIndex) ?? null;
  });

  protected readonly activeDayLabel = computed(() => {
    const sel = this.store.selected();
    if (sel == null) return null;
    return this.dayLabels()[sel.dayIndex] ?? null;
  });

  protected readonly showFillRest = computed(() => {
    const p = this.store.program();
    if (!p || p.scheduleType === 'Numbered') return false;
    const empty = p.weeks.flatMap(w => w.slots).filter(s => s.kind === 'Empty').length;
    const hasRoutine = p.weeks.some(w => w.slots.some(s => s.kind === 'RoutineDay'));
    return empty > 0 && hasRoutine;
  });

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id') ?? '';
      this.programId.set(id);
      if (id) this.store.reload(id);
    });
  }

  back() { this.router.navigate(['/trainer/programs']); }
  selectCell(weekIndex: number, dayIndex: number) { this.store.selectCell(weekIndex, dayIndex); }
  openAssignFor(weekIndex: number) { this.assignFor.set(weekIndex); }

  onMetaPatch(patch: any) {
    const p = this.store.program();
    if (!p) return;
    this.store.updateMeta(p.id, {
      name: patch.name ?? p.name,
      description: patch.description !== undefined ? patch.description : p.description,
      notes: patch.notes !== undefined ? patch.notes : p.notes,
      objective: patch.objective ?? p.objective,
      level: patch.level ?? p.level,
      mode: patch.mode ?? p.mode,
    });
  }

  async onModeChange(newMode: 'Fixed' | 'Loop') {
    const p = this.store.program();
    if (!p) return;
    if (newMode === 'Loop' && p.weeks.length > 1) {
      const ok = window.confirm('El programa en bucle es de una sola semana. Se mantendrá solo la primera semana y se descartarán las demás. ¿Continuar?');
      if (!ok) return;
      // Delete weeks 1..N-1 first.
      for (let i = p.weeks.length - 1; i >= 1; i--) {
        await this.store.deleteWeek(p.id, i);
      }
    }
    this.onMetaPatch({ mode: newMode });
  }

  async addWeek() {
    const p = this.store.program(); if (!p) return;
    await this.store.addWeek(p.id);
  }

  async duplicateWeek(weekIndex: number) {
    const p = this.store.program(); if (!p) return;
    await this.store.duplicateWeek(p.id, weekIndex);
  }

  async deleteWeek(weekIndex: number) {
    const p = this.store.program(); if (!p) return;
    if (!window.confirm(`¿Eliminar Semana ${weekIndex + 1}? Las rutinas de esta semana se perderán.`)) return;
    await this.store.deleteWeek(p.id, weekIndex);
  }

  async fillRest() {
    const p = this.store.program(); if (!p) return;
    await this.store.fillRest(p.id);
  }

  async onSetKind(kind: 'Empty' | 'Rest') {
    const p = this.store.program(); const sel = this.store.selected();
    if (!p || !sel) return;
    await this.store.setSlot(p.id, sel.weekIndex, sel.dayIndex, kind);
  }

  async removeBlock(blockId: string) {
    const p = this.store.program(); if (!p) return;
    await this.store.removeBlock(p.id, blockId);
  }

  async onRoutineAssigned(payload: { routineId: string; weeks: number[]; mapping?: Record<string, number>; dayIds?: string[]; }) {
    const p = this.store.program(); if (!p) return;
    await this.store.assignRoutine(p.id, payload);
  }

  async publish() {
    const p = this.store.program(); if (!p) return;
    if (!window.confirm('¿Publicar este programa? Después podrás asignarlo a estudiantes. Esta acción no se puede deshacer.')) return;
    await this.store.publish(p.id);
  }

  goAssign() {
    const p = this.store.program(); if (!p) return;
    // Phase 6 wires this. For now, navigate back.
    this.router.navigate(['/trainer/programs', p.id, 'assign']);
  }
}
```

- [ ] **Step 2: Update routes**

In `kondix-web/src/app/features/trainer/trainer.routes.ts` ensure the `/trainer/programs/:id` route loads `ProgramEditorPage` (the new component class). The class name change from `ProgramForm` to `ProgramEditorPage` requires updating any `loadComponent: () => import('./...').then(m => m.ProgramForm)` lines accordingly:

```typescript
{
  path: 'programs/:id',
  loadComponent: () => import('./programs/feature/program-form').then(m => m.ProgramEditorPage),
}
```

- [ ] **Step 3: Build**

```bash
cd kondix-web && npm run build
```

Expected: green. If any old reference to `ProgramForm` still lives in routes, fix it.

- [ ] **Step 4: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/feature/program-form.ts \
        kondix-web/src/app/features/trainer/trainer.routes.ts
git commit -m "feat(web): replace program-form.ts with v3 editor shell"
```

---

### Task 4.10: Phase 4 verification

- [ ] **Step 1: Build + frontend tests**

```bash
cd kondix-web && npm run build && npm run test -- --run
```

- [ ] **Step 2: Manual smoke (most important checkpoint of the project)**

Run dev backend + frontend. As trainer:

1. Create program "Hipertrofia 8 semanas" (Fixed, Week, 8 weeks).
2. Editor opens. Verify left meta panel shows the data; center has 8 empty rows of 7 cells; right inspector says "Selecciona un día...".
3. Click any empty cell → inspector switches to "Día vacío" with 2 buttons.
4. Click "Asignar rutina". Modal opens. Pick a routine (one with 3 days).
5. Step 2 shows scope = "Todas (8)" and routine days mapped to Mon/Wed/Fri (auto-suggest).
6. Click "Asignar a 8 sem". Modal closes. The grid now shows 24 colored cells (3 per week × 8 weeks).
7. Click a routineDay cell → inspector shows the routine name + "Quitar rutina" button.
8. Click "Quitar rutina" → all 24 cells revert to empty.
9. Click "Rellenar descansos" → empty cells turn into rest.
10. Click "Publicar" → confirm → badge changes from BORRADOR to nothing.
11. Repeat with mode=Loop: collapses to 1 week.
12. Repeat with scheduleType=Numbered, daysPerWeek=3: editor shows 3 cells per week labeled D1/D2/D3.
13. Mobile (Chrome devtools 375px): inspector slides as drawer; grid scrolls horizontally.

If any of those break, fix before moving to Phase 5.

- [ ] **Step 3: Tag**

```bash
git tag programs-v3-phase-4-done
```

---

# Phase 5 — Student-side (next-workout + numbered home + recovery gating)

**Goal:** Students see the right next workout for both Week and Numbered modes. Recovery flow only fires for Week-mode programs. Sessions persist `WeekIndex` and `SlotIndex`.

**Verification at end of phase:**
- `GetNextWorkoutQuery` returns the right shape for both modes (unit tested).
- `/api/v1/public/my/this-week` returns N pending sessions for numbered students.
- Manual: a student assigned to a numbered program sees a list of pending workouts; a student assigned to a week-mode program sees the calendar-day workout.

---

### Task 5.1: Rewrite `GetNextWorkoutQuery`

**Files:**
- Modify: `src/Kondix.Application/Queries/StudentPortal/GetNextWorkoutQuery.cs`
- Create: `tests/Kondix.UnitTests/Queries/GetNextWorkoutQueryHandlerTests.cs`

- [ ] **Step 1: Read current handler**

```bash
cat src/Kondix.Application/Queries/StudentPortal/GetNextWorkoutQuery.cs
```

- [ ] **Step 2: Write tests for both branches**

```csharp
using FluentAssertions;
using Kondix.Application.Queries.StudentPortal;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Queries;

public sealed class GetNextWorkoutQueryHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static (Program p, ProgramAssignment a) SeedWeekProgram(KondixDbContext db, Guid studentId)
    {
        var trainerId = Guid.NewGuid();
        var p = new Program { Id = Guid.NewGuid(), TrainerId = trainerId, Name = "P", Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Week, IsPublished = true };
        var w = new ProgramWeek { WeekIndex = 0, Label = "S1" };
        for (var i = 0; i < 7; i++) w.Slots.Add(new ProgramSlot { DayIndex = i, Kind = ProgramSlotKind.Empty });
        // Wednesday (idx 2) gets a routineDay slot.
        var wed = w.Slots.First(s => s.DayIndex == 2);
        wed.Kind = ProgramSlotKind.RoutineDay;
        wed.RoutineId = Guid.NewGuid();
        wed.DayId = Guid.NewGuid();
        wed.BlockId = Guid.NewGuid();
        p.Weeks.Add(w);

        var a = new ProgramAssignment
        {
            Id = Guid.NewGuid(), TrainerId = trainerId, StudentId = studentId, ProgramId = p.Id,
            StartDate = DateTimeOffset.Parse("2026-04-27T00:00:00+00:00"), // Mon
            Status = ProgramAssignmentStatus.Active,
        };
        p.Assignments.Add(a);
        db.Programs.Add(p);
        db.SaveChanges();
        return (p, a);
    }

    [Fact]
    public async Task Week_Mode_Today_Wednesday_Returns_RoutineDay()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        var (p, a) = SeedWeekProgram(db, studentId);

        var handler = new GetNextWorkoutHandler(db);
        var result = await handler.Handle(new GetNextWorkoutQuery(studentId,
            new DateOnly(2026, 4, 29) /* Wed */), default);

        result.Kind.Should().Be("Routine");
        result.WeekIndex.Should().Be(0);
        result.SlotIndex.Should().Be(2);
    }

    [Fact]
    public async Task Week_Mode_Today_Tuesday_Empty_Slot_Returns_Empty()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        SeedWeekProgram(db, studentId);

        var handler = new GetNextWorkoutHandler(db);
        var result = await handler.Handle(new GetNextWorkoutQuery(studentId,
            new DateOnly(2026, 4, 28) /* Tue */), default);

        result.Kind.Should().Be("Empty");
    }

    [Fact]
    public async Task Numbered_Mode_Returns_Bucket_Style_Result()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        var trainerId = Guid.NewGuid();
        var p = new Program { Id = Guid.NewGuid(), TrainerId = trainerId, Name = "P", Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Numbered, DaysPerWeek = 3, IsPublished = true };
        var w = new ProgramWeek { WeekIndex = 0, Label = "S1" };
        for (var i = 0; i < 3; i++)
        {
            w.Slots.Add(new ProgramSlot
            {
                DayIndex = i, Kind = ProgramSlotKind.RoutineDay,
                RoutineId = Guid.NewGuid(), DayId = Guid.NewGuid(), BlockId = Guid.NewGuid()
            });
        }
        p.Weeks.Add(w);
        p.Assignments.Add(new ProgramAssignment
        {
            Id = Guid.NewGuid(), TrainerId = trainerId, StudentId = studentId, ProgramId = p.Id,
            StartDate = DateTimeOffset.Parse("2026-04-27T00:00:00+00:00"),
            Status = ProgramAssignmentStatus.Active,
        });
        db.Programs.Add(p);
        await db.SaveChangesAsync();

        var handler = new GetNextWorkoutHandler(db);
        var result = await handler.Handle(new GetNextWorkoutQuery(studentId,
            new DateOnly(2026, 4, 30) /* Thu */), default);

        result.Kind.Should().Be("Numbered");
        result.PendingCount.Should().Be(3);
        result.CompletedCount.Should().Be(0);
    }
}
```

- [ ] **Step 3: Replace handler**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.StudentPortal;

public sealed record NextWorkoutDto(
    string Kind,           // "Routine" | "Rest" | "Empty" | "Numbered" | "Done"
    Guid? AssignmentId = null,
    Guid? RoutineId = null,
    string? RoutineName = null,
    Guid? DayId = null,
    string? DayName = null,
    int? WeekIndex = null,
    int? SlotIndex = null,
    int? PendingCount = null,
    int? CompletedCount = null,
    int? Total = null);

public sealed record GetNextWorkoutQuery(Guid StudentId, DateOnly Today) : IRequest<NextWorkoutDto>;

public sealed class GetNextWorkoutHandler(IKondixDbContext db) : IRequestHandler<GetNextWorkoutQuery, NextWorkoutDto>
{
    public async Task<NextWorkoutDto> Handle(GetNextWorkoutQuery request, CancellationToken ct)
    {
        var assignment = await db.ProgramAssignments
            .Include(a => a.Program).ThenInclude(p => p.Weeks).ThenInclude(w => w.Slots)
            .ThenInclude(s => s.Routine)
            .Where(a => a.StudentId == request.StudentId && a.Status == ProgramAssignmentStatus.Active)
            .OrderByDescending(a => a.StartDate)
            .FirstOrDefaultAsync(ct);

        if (assignment is null)
            return new NextWorkoutDto("Done");

        var p = assignment.Program;
        var startDay = DateOnly.FromDateTime(assignment.StartDate.UtcDateTime);
        var daysSinceStart = request.Today.DayNumber - startDay.DayNumber;
        if (daysSinceStart < 0) daysSinceStart = 0;

        int currentWeekIdx;
        if (p.Mode == ProgramMode.Loop)
        {
            currentWeekIdx = 0;
        }
        else
        {
            currentWeekIdx = daysSinceStart / 7;
            if (currentWeekIdx >= p.Weeks.Count)
                return new NextWorkoutDto("Done", AssignmentId: assignment.Id);
        }

        var week = p.Weeks.FirstOrDefault(w => w.WeekIndex == currentWeekIdx);
        if (week is null)
            return new NextWorkoutDto("Done", AssignmentId: assignment.Id);

        if (p.ScheduleType == ProgramScheduleType.Numbered)
        {
            // Calendar week boundary (Mon 00:00 UTC).
            var todayDt = request.Today.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var dow = ((int)todayDt.DayOfWeek + 6) % 7;
            var weekStart = new DateTimeOffset(todayDt.AddDays(-dow), TimeSpan.Zero);

            var completedCount = await db.WorkoutSessions
                .Where(s => s.AssignmentId == assignment.Id
                            && s.WeekIndex == currentWeekIdx
                            && s.Status == WorkoutSessionStatus.Completed
                            && s.StartedAt >= weekStart)
                .CountAsync(ct);

            var total = week.Slots.Count(s => s.Kind == ProgramSlotKind.RoutineDay);
            return new NextWorkoutDto(
                Kind: "Numbered",
                AssignmentId: assignment.Id,
                WeekIndex: currentWeekIdx,
                PendingCount: total - completedCount,
                CompletedCount: completedCount,
                Total: total);
        }
        else
        {
            // Week mode: today's weekday.
            var todayDow = ((int)request.Today.DayOfWeek + 6) % 7;
            var slot = week.Slots.FirstOrDefault(s => s.DayIndex == todayDow);
            if (slot is null) return new NextWorkoutDto("Empty", AssignmentId: assignment.Id);

            return slot.Kind switch
            {
                ProgramSlotKind.Empty => new NextWorkoutDto("Empty", AssignmentId: assignment.Id, WeekIndex: currentWeekIdx, SlotIndex: todayDow),
                ProgramSlotKind.Rest  => new NextWorkoutDto("Rest", AssignmentId: assignment.Id, WeekIndex: currentWeekIdx, SlotIndex: todayDow),
                ProgramSlotKind.RoutineDay => new NextWorkoutDto(
                    "Routine",
                    AssignmentId: assignment.Id,
                    RoutineId: slot.RoutineId,
                    RoutineName: slot.Routine?.Name,
                    DayId: slot.DayId,
                    WeekIndex: currentWeekIdx,
                    SlotIndex: todayDow),
                _ => new NextWorkoutDto("Empty", AssignmentId: assignment.Id),
            };
        }
    }
}
```

The `WorkoutSessionStatus` enum likely already exists in `Kondix.Domain.Enums` (used by v2 sessions). If not, add it with values `InProgress | Completed | Abandoned`.

- [ ] **Step 4: Run** → 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Queries/StudentPortal/GetNextWorkoutQuery.cs \
        tests/Kondix.UnitTests/Queries/GetNextWorkoutQueryHandlerTests.cs
git commit -m "feat(student): GetNextWorkoutQuery v3 (Week + Numbered branches)"
```

---

### Task 5.2: Add `GetThisWeekQuery` for numbered students

**Files:**
- Create: `src/Kondix.Application/Queries/StudentPortal/GetThisWeekQuery.cs`
- Create: `tests/Kondix.UnitTests/Queries/GetThisWeekQueryHandlerTests.cs`

- [ ] **Step 1: Write test**

```csharp
using FluentAssertions;
using Kondix.Application.Queries.StudentPortal;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Queries;

public sealed class GetThisWeekQueryHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Returns_All_Pending_Routine_Slots_For_Numbered_Mode()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        var trainerId = Guid.NewGuid();
        var p = new Program { Id = Guid.NewGuid(), TrainerId = trainerId, Name = "P",
                              Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Numbered,
                              DaysPerWeek = 3, IsPublished = true };
        var w = new ProgramWeek { WeekIndex = 0, Label = "S1" };
        var routineId = Guid.NewGuid();
        for (var i = 0; i < 3; i++)
            w.Slots.Add(new ProgramSlot
            {
                DayIndex = i, Kind = ProgramSlotKind.RoutineDay,
                RoutineId = routineId, DayId = Guid.NewGuid(), BlockId = Guid.NewGuid()
            });
        p.Weeks.Add(w);
        var a = new ProgramAssignment
        {
            Id = Guid.NewGuid(), TrainerId = trainerId, StudentId = studentId, ProgramId = p.Id,
            StartDate = DateTimeOffset.Parse("2026-04-27T00:00:00+00:00"),
            Status = ProgramAssignmentStatus.Active,
        };
        p.Assignments.Add(a);
        db.Programs.Add(p);
        // One completed already.
        db.Routines.Add(new Routine { Id = routineId, TrainerId = trainerId, Name = "R", IsActive = true });
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = Guid.NewGuid(), StudentId = studentId, AssignmentId = a.Id, ProgramId = p.Id,
            RoutineId = routineId, DayId = Guid.NewGuid(),
            WeekIndex = 0, SlotIndex = 0,
            StartedAt = DateTimeOffset.Parse("2026-04-29T10:00:00+00:00"),
            CompletedAt = DateTimeOffset.Parse("2026-04-29T11:00:00+00:00"),
            Status = WorkoutSessionStatus.Completed,
        });
        await db.SaveChangesAsync();

        var result = await new GetThisWeekHandler(db).Handle(
            new GetThisWeekQuery(studentId, new DateOnly(2026, 4, 30)), default);

        result.Total.Should().Be(3);
        result.CompletedCount.Should().Be(1);
        result.Pending.Should().HaveCount(2);
    }
}
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```csharp
using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.StudentPortal;

public sealed record ThisWeekPendingSlot(
    int SlotIndex,
    Guid RoutineId,
    string RoutineName,
    Guid DayId,
    string DayName);

public sealed record ThisWeekDto(
    Guid AssignmentId,
    int WeekIndex,
    int Total,
    int CompletedCount,
    List<ThisWeekPendingSlot> Pending);

public sealed record GetThisWeekQuery(Guid StudentId, DateOnly Today) : IRequest<ThisWeekDto?>;

public sealed class GetThisWeekHandler(IKondixDbContext db) : IRequestHandler<GetThisWeekQuery, ThisWeekDto?>
{
    public async Task<ThisWeekDto?> Handle(GetThisWeekQuery request, CancellationToken ct)
    {
        var assignment = await db.ProgramAssignments
            .Include(a => a.Program).ThenInclude(p => p.Weeks).ThenInclude(w => w.Slots)
            .ThenInclude(s => s.Routine)
            .Include(a => a.Program).ThenInclude(p => p.Weeks).ThenInclude(w => w.Slots)
            .ThenInclude(s => s.Day)
            .Where(a => a.StudentId == request.StudentId && a.Status == ProgramAssignmentStatus.Active)
            .OrderByDescending(a => a.StartDate)
            .FirstOrDefaultAsync(ct);

        if (assignment is null) return null;
        var p = assignment.Program;
        if (p.ScheduleType != ProgramScheduleType.Numbered) return null;

        int currentWeekIdx;
        if (p.Mode == ProgramMode.Loop) currentWeekIdx = 0;
        else
        {
            var startDay = DateOnly.FromDateTime(assignment.StartDate.UtcDateTime);
            currentWeekIdx = Math.Max(0, request.Today.DayNumber - startDay.DayNumber) / 7;
            if (currentWeekIdx >= p.Weeks.Count) return null;
        }

        var week = p.Weeks.First(w => w.WeekIndex == currentWeekIdx);

        var todayDt = request.Today.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dow = ((int)todayDt.DayOfWeek + 6) % 7;
        var weekStart = new DateTimeOffset(todayDt.AddDays(-dow), TimeSpan.Zero);

        var completedSlots = await db.WorkoutSessions
            .Where(s => s.AssignmentId == assignment.Id
                        && s.WeekIndex == currentWeekIdx
                        && s.Status == WorkoutSessionStatus.Completed
                        && s.StartedAt >= weekStart)
            .Select(s => s.SlotIndex)
            .ToListAsync(ct);

        var pending = week.Slots
            .Where(s => s.Kind == ProgramSlotKind.RoutineDay && !completedSlots.Contains(s.DayIndex))
            .OrderBy(s => s.DayIndex)
            .Select(s => new ThisWeekPendingSlot(
                s.DayIndex,
                s.RoutineId!.Value,
                s.Routine!.Name,
                s.DayId!.Value,
                s.Day?.Name ?? ""))
            .ToList();

        return new ThisWeekDto(
            assignment.Id, currentWeekIdx,
            week.Slots.Count(s => s.Kind == ProgramSlotKind.RoutineDay),
            completedSlots.Count,
            pending);
    }
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Kondix.Application/Queries/StudentPortal/GetThisWeekQuery.cs \
        tests/Kondix.UnitTests/Queries/GetThisWeekQueryHandlerTests.cs
git commit -m "feat(student): GetThisWeekQuery for numbered students"
```

---

### Task 5.3: Wire `/this-week` endpoint + update `StartSessionCommand`

**Files:**
- Modify: `src/Kondix.Api/Controllers/PublicController.cs` (or wherever `/api/v1/public/my/*` lives — likely `StudentPortalController.cs`)
- Modify: `src/Kondix.Application/Commands/Sessions/StartSessionCommand.cs`

- [ ] **Step 1: Find the student-portal controller**

```bash
grep -rn "public/my/next-workout" src/Kondix.Api/Controllers/
```

- [ ] **Step 2: Add the new endpoint**

In the found controller, append (alongside `next-workout`):

```csharp
[HttpGet("public/my/this-week")]
public async Task<IActionResult> GetThisWeek(CancellationToken ct)
{
    var studentId = HttpContext.GetStudentId();
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var result = await mediator.Send(new GetThisWeekQuery(studentId, today), ct);
    if (result is null) return NoContent();
    return Ok(result);
}
```

(Adjust the route prefix to whatever the controller uses.)

- [ ] **Step 3: Update `StartSessionCommand` to persist WeekIndex/SlotIndex**

Read the current command:

```bash
cat src/Kondix.Application/Commands/Sessions/StartSessionCommand.cs
```

Add `int WeekIndex` and `int SlotIndex` to the command record. Set them on the new `WorkoutSession`:

```csharp
var session = new WorkoutSession
{
    StudentId = ...,
    AssignmentId = ...,
    ProgramId = ...,
    RoutineId = ...,
    DayId = ...,
    WeekIndex = request.WeekIndex,
    SlotIndex = request.SlotIndex,
    StartedAt = DateTimeOffset.UtcNow,
    Status = WorkoutSessionStatus.InProgress,
    // existing fields (Mood, IsRecovery, RecoversPlannedDate) preserved
};
```

The frontend already has these values in the `next-workout` payload (`WeekIndex`, `SlotIndex`); update the frontend's `start session` call to forward them.

- [ ] **Step 4: Update frontend call site**

In whichever student-side service starts a session, add `weekIndex` and `slotIndex` to the request body.

- [ ] **Step 5: Build + tests**

```bash
dotnet test Kondix.slnx
cd kondix-web && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/Kondix.Api/Controllers/StudentPortalController.cs \
        src/Kondix.Application/Commands/Sessions/StartSessionCommand.cs \
        kondix-web/src/app/
git commit -m "feat(student): /this-week endpoint + persist WeekIndex/SlotIndex on session start"
```

---

### Task 5.4: Student home — branch by mode

**Files:**
- Modify: `kondix-web/src/app/features/student/feature/home.ts`

- [ ] **Step 1: Read current home component**

```bash
cat kondix-web/src/app/features/student/feature/home.ts
```

- [ ] **Step 2: Add a branch on `nextWorkout.kind`**

The existing home renders `<kx-hero-card>` for routine/rest. Add a `Numbered` branch that fetches `/api/v1/public/my/this-week` and renders a list:

```typescript
@if (nextWorkout()?.kind === 'Numbered') {
  <section class="px-5 py-4">
    <h2 class="text-h2 font-display mb-1">Esta semana</h2>
    <p class="text-sm text-text-muted mb-4">
      {{ thisWeek()?.completedCount ?? 0 }} de {{ thisWeek()?.total ?? 0 }} entrenamientos completados
    </p>

    @if ((thisWeek()?.pending?.length ?? 0) === 0) {
      <kx-empty-state title="¡Listo!" subtitle="Completaste todos los entrenamientos de esta semana." icon="trophy" />
    } @else {
      <ul class="flex flex-col gap-2.5">
        @for (slot of thisWeek()?.pending ?? []; track slot.slotIndex) {
          <li>
            <button class="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 text-left hover:border-primary"
                    (click)="startNumberedSession(slot)">
              <div class="w-10 h-10 rounded-lg bg-primary-subtle text-primary flex items-center justify-center font-display font-bold">
                D{{ slot.slotIndex + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-text">{{ slot.dayName }}</div>
                <div class="text-xs text-text-muted">{{ slot.routineName }}</div>
              </div>
              <lucide-icon name="arrow-right" [size]="16"></lucide-icon>
            </button>
          </li>
        }
      </ul>
    }
  </section>
}
```

In the class:

```typescript
protected readonly thisWeek = signal<ThisWeekDto | null>(null);

ngOnInit() {
  // existing logic + after loading nextWorkout:
  if (this.nextWorkout()?.kind === 'Numbered') {
    this.http.get<ThisWeekDto>('/api/v1/public/my/this-week', { withCredentials: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.thisWeek.set(r));
  }
}

startNumberedSession(slot: ThisWeekPendingSlot) {
  const next = this.nextWorkout();
  if (!next) return;
  // navigate to the session-start route with weekIndex + slotIndex from the picked card
  this.router.navigate(['/student/session/start'], {
    queryParams: {
      assignmentId: next.assignmentId,
      routineId: slot.routineId,
      dayId: slot.dayId,
      weekIndex: next.weekIndex,
      slotIndex: slot.slotIndex,
    },
  });
}
```

Adapt route names to the existing student session-start flow.

- [ ] **Step 3: Build + smoke**

```bash
cd kondix-web && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add kondix-web/src/app/features/student/feature/home.ts
git commit -m "feat(student): numbered-mode home branch with this-week list"
```

---

### Task 5.5: Gate recovery flow to Week mode only

**Files:**
- Modify: `kondix-web/src/app/features/student/feature/home.ts` (or wherever `<kx-recovery-banner>` is conditionally rendered)
- Modify: `kondix-web/src/app/features/student/feature/calendar.ts` (numbered hides calendar grid)

- [ ] **Step 1: Hide recovery banner when scheduleType=Numbered**

The current home likely conditionally shows `<kx-recovery-banner>` when there's a missed session. Add an extra check:

```typescript
@if (recoverableSession() && nextWorkout()?.kind !== 'Numbered') {
  <kx-recovery-banner ... />
}
```

- [ ] **Step 2: In `calendar.ts`, branch the layout**

If the program is numbered, render a "no calendar" placeholder with the `this-week` list, OR redirect away from `/student/calendar` to `/student` (the home already shows the list).

Simplest: if `nextWorkout().kind === 'Numbered'`, render `<kx-empty-state title="Sin calendario" subtitle="Tu programa avanza por entrenamientos, no por días."/>` and link back home.

- [ ] **Step 3: Build**

```bash
cd kondix-web && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add kondix-web/src/app/features/student/feature/
git commit -m "feat(student): gate recovery flow + calendar to Week mode only"
```

---

### Task 5.6: Phase 5 verification

- [ ] **Step 1: Run all tests**

```bash
dotnet test Kondix.slnx
cd kondix-web && npm run build && npm run test -- --run
```

- [ ] **Step 2: Manual smoke**

Create a numbered program, assign to a student, log in as student → home shows "Esta semana" with N pending cards. Tap one → starts the session. Complete it → returns to home → "X-1 pending".

Test Week mode end-to-end too: today's slot is shown via hero card. Recovery banner appears for missed week-mode sessions.

- [ ] **Step 3: Tag**

```bash
git tag programs-v3-phase-5-done
```

---

# Phase 6 — Assignment + List redesign + docs

**Goal:** Trainer can assign published programs to students. Program list shows redesigned cards + filters. Final docs updated.

**Verification at end of phase:**
- Assigning a program from the list / detail views works end-to-end.
- Cards show correct stats + badges.
- Filters narrow the list.

---

### Task 6.1: Add `objective-color.ts` helper

**Files:**
- Create: `kondix-web/src/app/shared/utils/objective-color.ts`

- [ ] **Step 1: Write**

```typescript
import { ProgramObjective } from '../models';

const OBJECTIVE_COLORS: Record<ProgramObjective, string> = {
  Hipertrofia: '#E62639',
  Fuerza: '#f59e0b',
  Resistencia: '#22c55e',
  Funcional: '#60a5fa',
  Rendimiento: '#a78bfa',
  Otro: '#78787f',
};

export function objectiveColor(objective: ProgramObjective): string {
  return OBJECTIVE_COLORS[objective] ?? OBJECTIVE_COLORS.Otro;
}
```

- [ ] **Step 2: Commit**

```bash
git add kondix-web/src/app/shared/utils/objective-color.ts
git commit -m "feat(web): objective-color helper"
```

---

### Task 6.2: Build redesigned `<kx-program-card>`

**Files:**
- Replace: `kondix-web/src/app/features/trainer/programs/ui/program-card.ts`

Reference: `view-programs.jsx` `ProgramCard` line 243-360.

- [ ] **Step 1: Write**

```typescript
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, MoreVertical, Users, Copy, Trash, ArrowRight } from 'lucide-angular';
import { ProgramSummary } from '../../../../shared/models';
import { objectiveColor } from '../../../../shared/utils/objective-color';

@Component({
  selector: 'kx-program-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true,
                useValue: new LucideIconProvider({ MoreVertical, Users, Copy, Trash, ArrowRight }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary hover:-translate-y-0.5 relative"
             (click)="open.emit()">
      <!-- Top: timeline preview + badges + menu -->
      <div class="h-[90px] relative border-b border-border-light p-3 flex flex-col justify-between"
           [style.background]="gradient()">
        <div class="flex items-center gap-1.5">
          <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold tracking-wider"
                [style.background]="badgeBg()" [style.color]="color()" [style.borderColor]="color() + '55'"
                style="border:1px solid">{{ program().objective }}</span>
          @if (!program().isPublished) {
            <span class="px-2 py-0.5 rounded-md text-[10px] font-mono border border-border text-text-muted">BORRADOR</span>
          }
          @if (program().mode === 'Loop') {
            <span class="px-2 py-0.5 rounded-md text-[10px] font-mono border border-border text-text-muted">EN BUCLE</span>
          }
        </div>

        <!-- Mini timeline: simple bars per week (max 16 visible) -->
        <div class="flex gap-0.5 items-end">
          @for (i of weekIndices(); track i) {
            <div class="flex-1 h-3 rounded-sm" [style.background]="color()" style="opacity:0.85;"></div>
          }
        </div>

        <button class="absolute top-2 right-2 p-1.5 rounded-md bg-black/50"
                (click)="$event.stopPropagation(); menuOpen.set(!menuOpen())"
                aria-label="Menú">
          <lucide-icon name="more-vertical" [size]="14"></lucide-icon>
        </button>
        @if (menuOpen()) {
          <div class="absolute right-2 top-10 z-10 bg-bg border border-border rounded-md shadow-lg py-1 min-w-[180px]"
               (click)="$event.stopPropagation()">
            <button class="w-full text-left px-3 py-2 text-sm hover:bg-card-hover flex items-center gap-2"
                    (click)="assign.emit(); menuOpen.set(false)">
              <lucide-icon name="users" [size]="13"></lucide-icon> Asignar a estudiantes
            </button>
            <button class="w-full text-left px-3 py-2 text-sm hover:bg-card-hover flex items-center gap-2"
                    (click)="duplicate.emit(); menuOpen.set(false)">
              <lucide-icon name="copy" [size]="13"></lucide-icon> Duplicar
            </button>
            <div class="h-px bg-border my-1"></div>
            <button class="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 flex items-center gap-2"
                    (click)="delete.emit(); menuOpen.set(false)">
              <lucide-icon name="trash" [size]="13"></lucide-icon> Eliminar
            </button>
          </div>
        }
      </div>

      <!-- Body -->
      <div class="p-4">
        <div class="font-display text-base font-bold tracking-tight leading-tight">{{ program().name }}</div>
        @if (program().description) {
          <p class="text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-2">{{ program().description }}</p>
        }

        <div class="grid grid-cols-3 gap-2 mt-3 font-mono">
          <div class="bg-bg-raised border border-border-light rounded-md px-2 py-1.5">
            <div class="text-[9px] text-text-muted uppercase tracking-wider">Semanas</div>
            <div class="text-sm font-semibold mt-0.5">{{ program().mode === 'Loop' ? '∞' : program().weeksCount }}</div>
          </div>
          <div class="bg-bg-raised border border-border-light rounded-md px-2 py-1.5">
            <div class="text-[9px] text-text-muted uppercase tracking-wider">Sesiones</div>
            <div class="text-sm font-semibold mt-0.5">{{ program().sessionsCount }}</div>
          </div>
          <div class="bg-bg-raised border border-border-light rounded-md px-2 py-1.5">
            <div class="text-[9px] text-text-muted uppercase tracking-wider">Nivel</div>
            <div class="text-sm font-semibold mt-0.5">{{ program().level }}</div>
          </div>
        </div>

        <div class="mt-3 pt-2.5 border-t border-border-light flex items-center justify-between">
          <div class="text-[11px] text-text-muted font-mono flex items-center gap-1">
            <lucide-icon name="users" [size]="11"></lucide-icon>
            {{ program().assignedCount }} asignad{{ program().assignedCount === 1 ? 'o' : 'os' }}
          </div>
          <div class="flex items-center gap-1 text-[11px] font-semibold text-text-muted">
            Editar <lucide-icon name="arrow-right" [size]="11"></lucide-icon>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class ProgramCard {
  readonly program = input.required<ProgramSummary>();

  readonly open = output<void>();
  readonly assign = output<void>();
  readonly duplicate = output<void>();
  readonly delete = output<void>();

  protected readonly menuOpen = signal(false);
  protected readonly color = computed(() => objectiveColor(this.program().objective));
  protected readonly badgeBg = computed(() => this.color() + '30');
  protected readonly gradient = computed(() => `linear-gradient(135deg, ${this.color()}20 0%, #0a0a0b 85%)`);
  protected readonly weekIndices = computed(() =>
    Array.from({ length: Math.min(this.program().weeksCount, 16) }, (_, i) => i));
}
```

- [ ] **Step 2: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/ui/program-card.ts
git commit -m "feat(web): redesigned kx-program-card"
```

---

### Task 6.3: Build minimal `<kx-assign-program-modal>`

**Files:**
- Replace: `kondix-web/src/app/features/trainer/programs/ui/assign-program-modal.ts`

The new modal asks for: student + start date. Cancellation of any prior active assignment happens server-side.

- [ ] **Step 1: Write**

```typescript
import { ChangeDetectionStrategy, Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, X, Check } from 'lucide-angular';

interface StudentLite { id: string; name: string; email: string; }

@Component({
  selector: 'kx-assign-program-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ X, Check }) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[200] bg-black/70" (click)="close.emit()"></div>
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201]
                w-[min(480px,calc(100vw-32px))] bg-bg border border-border rounded-2xl shadow-lg flex flex-col">
      <header class="px-6 py-4 border-b border-border-light flex items-center justify-between">
        <div>
          <div class="text-overline">Asignar</div>
          <h2 class="text-h2 font-display">{{ programName() }}</h2>
        </div>
        <button (click)="close.emit()" class="p-2"><lucide-icon name="x" [size]="16"></lucide-icon></button>
      </header>

      <div class="px-6 py-5 flex flex-col gap-4">
        <label class="flex flex-col gap-1">
          <span class="text-overline">Estudiante</span>
          <select class="select-styled w-full" [(ngModel)]="studentId">
            <option [ngValue]="null">— elegí estudiante —</option>
            @for (s of students(); track s.id) {
              <option [value]="s.id">{{ s.name }} · {{ s.email }}</option>
            }
          </select>
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-overline">Fecha de inicio</span>
          <input type="date" class="input" [(ngModel)]="startDate" />
        </label>
      </div>

      <footer class="px-6 py-3 border-t border-border-light flex justify-end gap-2">
        <button class="btn-ghost" (click)="close.emit()">Cancelar</button>
        <button class="btn-primary" [disabled]="!studentId() || !startDate() || saving()" (click)="submit()">
          <lucide-icon name="check" [size]="14"></lucide-icon> Asignar
        </button>
      </footer>
    </div>
  `,
})
export class AssignProgramModal implements OnInit {
  private http = inject(HttpClient);

  readonly programId = input.required<string>();
  readonly programName = input.required<string>();

  readonly close = output<void>();
  readonly assigned = output<void>();

  protected readonly students = signal<StudentLite[]>([]);
  protected readonly studentId = signal<string | null>(null);
  protected readonly startDate = signal<string>(new Date().toISOString().slice(0, 10));
  protected readonly saving = signal(false);

  ngOnInit() {
    firstValueFrom(this.http.get<StudentLite[]>('/api/v1/students', { withCredentials: true }))
      .then(s => this.students.set(s ?? []))
      .catch(() => this.students.set([]));
  }

  async submit() {
    if (!this.studentId() || !this.startDate() || this.saving()) return;
    this.saving.set(true);
    try {
      await firstValueFrom(this.http.post('/api/v1/program-assignments', {
        studentId: this.studentId(),
        programId: this.programId(),
        startDate: this.startDate(),
      }, { withCredentials: true }));
      this.assigned.emit();
      this.close.emit();
    } finally {
      this.saving.set(false);
    }
  }
}
```

- [ ] **Step 2: Update `ProgramAssignmentsController`** (or whichever wires `POST /program-assignments`)

The controller's POST handler should:
1. Verify program belongs to trainer + `IsPublished = true` (else 400 "Publicá el programa primero").
2. Cancel any prior `Active` assignment for that student (`Status = Cancelled, UpdatedAt = now`).
3. Insert new active assignment.

If the existing handler has a different shape, refactor it to match the v3 minimal API:

```csharp
[HttpPost]
public async Task<IActionResult> Create([FromBody] AssignProgramRequest request, CancellationToken ct)
{
    HttpContext.RequirePermission(Permissions.GymManage);
    var id = await mediator.Send(new CreateProgramAssignmentCommand(
        HttpContext.GetTrainerId(), request.StudentId, request.ProgramId, request.StartDate), ct);
    return Created($"/api/v1/program-assignments/{id}", new { id });
}

public sealed record AssignProgramRequest(Guid StudentId, Guid ProgramId, DateTimeOffset StartDate);
```

The handler `CreateProgramAssignmentCommand` is new or renamed; implement it with the 3 steps above.

- [ ] **Step 3: Add tests for cancellation behavior**

```csharp
[Fact]
public async Task Creating_New_Assignment_Cancels_Prior_Active_Assignment_For_Same_Student()
{
    // ... seed prior Active assignment for student S to program P1 ...
    // ... create new assignment for student S to program P2 ...
    // assert prior assignment is Cancelled, new one is Active
}

[Fact]
public async Task Cannot_Assign_Unpublished_Program()
{
    // ... seed program with IsPublished=false ...
    // attempt assign → expect InvalidOperationException("Publicá ...")
}
```

- [ ] **Step 4: Build + tests**

```bash
dotnet test Kondix.slnx
cd kondix-web && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/ui/assign-program-modal.ts \
        src/Kondix.Api/Controllers/ProgramAssignmentsController.cs \
        src/Kondix.Application/Commands/ \
        tests/Kondix.UnitTests/Commands/
git commit -m "feat(programs): minimal AssignProgramModal + 1:1 active assignment rule"
```

---

### Task 6.4: Add list filters to `program-list.ts`

**Files:**
- Modify: `kondix-web/src/app/features/trainer/programs/feature/program-list.ts`

- [ ] **Step 1: Add filter signals + UI**

In the component:

```typescript
protected readonly filterObjective = signal<ProgramObjective | ''>('');
protected readonly filterLevel = signal<ProgramLevel | ''>('');
protected readonly filterPublished = signal<'all' | 'published' | 'draft'>('all');
protected readonly query = signal('');

protected readonly filtered = computed(() => {
  const all = this.programs();   // existing programs signal from store
  const obj = this.filterObjective();
  const lvl = this.filterLevel();
  const pub = this.filterPublished();
  const q = this.query().toLowerCase();
  return all.filter(p =>
    (!obj || p.objective === obj) &&
    (!lvl || p.level === lvl) &&
    (pub === 'all' || (pub === 'published' && p.isPublished) || (pub === 'draft' && !p.isPublished)) &&
    (!q || p.name.toLowerCase().includes(q))
  );
});
```

In the template, add filter chips above the grid:

```html
<div class="flex gap-2 mb-4 flex-wrap items-center">
  <input class="input flex-1 min-w-[200px]" [(ngModel)]="query" placeholder="Buscar…" />
  <select class="select-styled" [(ngModel)]="filterObjective">
    <option value="">Todos los objetivos</option>
    @for (o of objectives; track o) { <option [value]="o">{{ o }}</option> }
  </select>
  <select class="select-styled" [(ngModel)]="filterLevel">
    <option value="">Todos los niveles</option>
    @for (l of levels; track l) { <option [value]="l">{{ l }}</option> }
  </select>
  <select class="select-styled" [(ngModel)]="filterPublished">
    <option value="all">Todos</option>
    <option value="published">Publicados</option>
    <option value="draft">Borradores</option>
  </select>
</div>
```

The grid then iterates `filtered()` instead of the raw list.

- [ ] **Step 2: Build**

```bash
cd kondix-web && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add kondix-web/src/app/features/trainer/programs/feature/program-list.ts
git commit -m "feat(web): program list filters"
```

---

### Task 6.5: Update `CLAUDE.md` and `.impeccable.md`

**Files:**
- Modify: `CLAUDE.md` (project root) — Kondix-specific section
- Modify: `kondix-web/.impeccable.md`

- [ ] **Step 1: Update `CLAUDE.md`**

Replace the Programs-related sections (specifically "Program structure", "Assignment model", "Assignment modes") with the v3 model:

```markdown
- **Program structure**: Program → ProgramWeek → ProgramSlot (kind: Empty | Rest | RoutineDay)
- **Program modes**: `Mode: Fixed | Loop` — Fixed has N weeks, Loop has 1 week template that repeats forever
- **Schedule type**: `ScheduleType: Week | Numbered` (immutable after create) — Week has 7 cells/week (Mon..Sun); Numbered has N cells/week (`DaysPerWeek`), no rest/empty slots, week-bucket scheduling on the student side
- **Assignment**: `(StudentId, ProgramId, StartDate, Status)` — schedule is in the program, not the assignment. Loop assignments are indefinite; fixed assignments end after `Program.Weeks.Count × 7` days
- **Publish flow**: programs created as `IsPublished=false`; one-way transition to `IsPublished=true`. Assignment requires published program.
- **Per-slot overrides** are out of scope for v3.
```

Update the "Reusable Components" table to include the new `<kx-program-*>` family.

Update "Known Bugs" to remove any v3-related items that are now fixed.

Update "Gotchas":
- Remove references to `program_week_overrides`.
- Remove `AssignmentMode = Rotation | Fixed` references.
- Add note: `1:1 active assignment per student is enforced server-side by cancelling prior active rows on insert`.

- [ ] **Step 2: Update `.impeccable.md`**

Append the new components in `kondix-web/.impeccable.md`:

```markdown
- `<kx-program-card>` — Program list card (cover gradient, timeline preview, badges, stats, menu)
- `<kx-program-meta-panel>` — Program editor left column (name/objective/level/mode/notes)
- `<kx-program-week-row>` — One week row with cells + duplicate/delete menu
- `<kx-program-day-cell>` — Single calendar cell, 3 visual states
- `<kx-cell-inspector>` — Right-side inspector for the selected cell
- `<kx-create-program-modal>` — Creation modal (objective/level/mode/scheduleType/duration)
- `<kx-assign-routine-modal>` — 2-step wizard (pick + map for Week mode, pick + select days for Numbered)
- `<kx-assign-program-modal>` — Minimal (student + start date)
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md kondix-web/.impeccable.md
git commit -m "docs: update CLAUDE.md + impeccable.md for Programs v3"
```

---

### Task 6.6: Phase 6 verification + final tag

- [ ] **Step 1: Full test pass**

```bash
dotnet test Kondix.slnx
cd kondix-web && npm run build && npm run test -- --run
```

Expected: all green.

- [ ] **Step 2: End-to-end manual smoke**

1. Create a Fixed/Week program. Publish.
2. Create a Loop/Week program. Publish.
3. Create a Fixed/Numbered/3 program. Publish.
4. Assign each to a different student.
5. Log in as each student → verify the right home view + ability to start a session.
6. Trainer view: list shows 3 cards with correct stats. Filters narrow the list correctly.
7. Trainer edits a card's name → reflected in the list.

- [ ] **Step 3: Tag the release**

```bash
git tag programs-v3-complete
```

- [ ] **Step 4: Push and prepare deploy**

```bash
git push
git push --tags
```

The destructive migration (`ProgramsV3Refactor`) ships on next deploy. Before pulling the trigger:
- Confirm the deploy host has the migration applied (`dotnet ef database update` is part of the API container start in this repo's deploy script — verify in `deploy/`).
- Notify any test trainers that prior programs are gone.

Phase 6 complete. Programs v3 done.
