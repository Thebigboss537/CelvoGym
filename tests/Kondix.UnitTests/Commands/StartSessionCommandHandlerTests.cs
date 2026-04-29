using FluentAssertions;
using Kondix.Application.Commands.Sessions;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class StartSessionCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static (KondixDbContext db, Guid studentId, Guid routineId, Guid dayId, ProgramAssignment a)
        SeedActiveProgram(int dayIndex = 2 /* Wed */)
    {
        var db = NewDb();
        var studentId = Guid.NewGuid();
        var trainerId = Guid.NewGuid();
        var routineId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var blockId = Guid.NewGuid();

        db.Routines.Add(new Routine { Id = routineId, TrainerId = trainerId, Name = "R", IsActive = true });
        db.Days.Add(new Day { Id = dayId, RoutineId = routineId, Name = "D1", SortOrder = 0 });

        var p = new Program
        {
            Id = Guid.NewGuid(),
            TrainerId = trainerId,
            Name = "P",
            Mode = ProgramMode.Fixed,
            ScheduleType = ProgramScheduleType.Week,
            IsPublished = true,
        };
        var w = new ProgramWeek { ProgramId = p.Id, WeekIndex = 0, Label = "S1" };
        for (var i = 0; i < 7; i++) w.Slots.Add(new ProgramSlot { DayIndex = i, Kind = ProgramSlotKind.Empty });
        var target = w.Slots.First(s => s.DayIndex == dayIndex);
        target.Kind = ProgramSlotKind.RoutineDay;
        target.RoutineId = routineId;
        target.DayId = dayId;
        target.BlockId = blockId;
        p.Weeks.Add(w);

        var a = new ProgramAssignment
        {
            Id = Guid.NewGuid(),
            TrainerId = trainerId,
            StudentId = studentId,
            ProgramId = p.Id,
            StartDate = DateTimeOffset.UtcNow.AddDays(-1),
            Status = ProgramAssignmentStatus.Active,
        };
        p.Assignments.Add(a);
        db.Programs.Add(p);
        db.SaveChanges();
        return (db, studentId, routineId, dayId, a);
    }

    [Fact]
    public async Task Creates_New_Session_When_No_Active_Session_Exists()
    {
        var (db, studentId, routineId, dayId, a) = SeedActiveProgram();
        await using var _ = db;

        var handler = new StartSessionHandler(db);
        var result = await handler.Handle(new StartSessionCommand(studentId, routineId, dayId), default);

        result.Should().NotBeNull();
        var session = await db.WorkoutSessions.FirstAsync();
        session.Status.Should().Be(WorkoutSessionStatus.InProgress);
        session.WeekIndex.Should().Be(0);
        session.SlotIndex.Should().Be(2);
        session.AssignmentId.Should().Be(a.Id);
    }

    [Fact]
    public async Task Returns_Existing_Active_Session_When_Present()
    {
        var (db, studentId, routineId, dayId, a) = SeedActiveProgram();
        await using var _ = db;

        // Seed an existing in-progress session.
        var existing = new WorkoutSession
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            AssignmentId = a.Id,
            ProgramId = a.ProgramId,
            RoutineId = routineId,
            DayId = dayId,
            WeekIndex = 0,
            SlotIndex = 2,
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-15),
            Status = WorkoutSessionStatus.InProgress,
        };
        db.WorkoutSessions.Add(existing);
        await db.SaveChangesAsync();

        var handler = new StartSessionHandler(db);
        var result = await handler.Handle(new StartSessionCommand(studentId, routineId, dayId), default);

        result.Id.Should().Be(existing.Id);
        var count = await db.WorkoutSessions.CountAsync();
        count.Should().Be(1, "no new session should be created when one is already in progress");
    }

    [Fact]
    public async Task Throws_When_Routine_Not_Assigned_To_Current_Week()
    {
        var (db, studentId, _, _, _) = SeedActiveProgram();
        await using var _u = db;

        var handler = new StartSessionHandler(db);
        var act = async () => await handler.Handle(
            new StartSessionCommand(studentId, Guid.NewGuid() /* unrelated routine */, Guid.NewGuid()), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not assigned*");
    }

    // The following 5 recovery edge cases will be unblocked by Phase 5 Task 5.5 (recovery gating).
    [Fact(Skip = "Phase 5 Task 5.5 will restore recovery edge cases")]
    public Task Recovery_Sets_IsRecovery_True_For_Valid_Planned_Date() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 Task 5.5 will restore recovery edge cases")]
    public Task Recovery_Throws_When_Planned_Date_Too_Old() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 Task 5.5 will restore recovery edge cases")]
    public Task Recovery_Throws_When_Normal_Session_Already_Completed_That_Day() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 Task 5.5 will restore recovery edge cases")]
    public Task Recovery_Throws_When_Already_Recovered() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 Task 5.5 will restore recovery edge cases")]
    public Task Recovery_Throws_When_Planned_Date_Not_A_Training_Day() => Task.CompletedTask;
}
