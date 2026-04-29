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
        // Routine + a completed session at slot 0.
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

        result.Should().NotBeNull();
        result!.Total.Should().Be(3);
        result.CompletedCount.Should().Be(1);
        result.Pending.Should().HaveCount(2);
    }
}
