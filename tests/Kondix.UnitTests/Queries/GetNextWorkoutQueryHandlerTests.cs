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
