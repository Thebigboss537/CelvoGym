using FluentAssertions;
using Kondix.Application.DTOs;
using Kondix.Application.Queries.StudentPortal;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Queries;

public sealed class GetNextWorkoutQueryTests
{
    [Fact]
    public async Task Rotation_SingleRoutineWithThreeDays_CyclesThroughDays()
    {
        var (db, studentId, assignmentId, dayIds) = BuildFixture(
            routineCount: 1,
            daysPerRoutine: 3,
            mode: ProgramAssignmentMode.Rotation);

        // RotationIndex = 0 → day 0 (Monday)
        var result = await InvokeHandler(db, studentId);
        result!.DayId.Should().Be(dayIds[0]);

        // After completing one session (RotationIndex = 1) → day 1 (Wednesday)
        await SetRotationIndex(db, assignmentId, 1);
        result = await InvokeHandler(db, studentId);
        result!.DayId.Should().Be(dayIds[1]);

        // After completing two sessions (RotationIndex = 2) → day 2 (Friday)
        await SetRotationIndex(db, assignmentId, 2);
        result = await InvokeHandler(db, studentId);
        result!.DayId.Should().Be(dayIds[2]);

        // Wraps to start (RotationIndex = 3 % 3 == 0)
        await SetRotationIndex(db, assignmentId, 3);
        result = await InvokeHandler(db, studentId);
        result!.DayId.Should().Be(dayIds[0]);
    }

    [Fact]
    public async Task Rotation_MultipleRoutinesSingleDay_CyclesRoutinesInOrder()
    {
        var (db, studentId, assignmentId, dayIds) = BuildFixture(
            routineCount: 3,
            daysPerRoutine: 1,
            mode: ProgramAssignmentMode.Rotation);

        var r0 = await InvokeHandler(db, studentId);
        r0!.DayId.Should().Be(dayIds[0]);

        await SetRotationIndex(db, assignmentId, 1);
        var r1 = await InvokeHandler(db, studentId);
        r1!.DayId.Should().Be(dayIds[1]);

        await SetRotationIndex(db, assignmentId, 2);
        var r2 = await InvokeHandler(db, studentId);
        r2!.DayId.Should().Be(dayIds[2]);
    }

    [Fact]
    public async Task Rotation_ReturnsNullWhenNoActiveAssignment()
    {
        var (db, studentId, _, _) = BuildFixture(1, 1, ProgramAssignmentMode.Rotation);

        var assignment = await db.ProgramAssignments.FirstAsync();
        assignment.Status = ProgramAssignmentStatus.Completed;
        await db.SaveChangesAsync();

        var result = await InvokeHandler(db, studentId);
        result.Should().BeNull();
    }

    private static async Task<NextWorkoutDto?> InvokeHandler(KondixDbContext db, Guid studentId)
    {
        var handler = new GetNextWorkoutHandler(db);
        return await handler.Handle(new GetNextWorkoutQuery(studentId), CancellationToken.None);
    }

    private static async Task SetRotationIndex(KondixDbContext db, Guid assignmentId, int value)
    {
        var pa = await db.ProgramAssignments.FirstAsync(p => p.Id == assignmentId);
        pa.RotationIndex = value;
        await db.SaveChangesAsync();
    }

    private static (KondixDbContext Db, Guid StudentId, Guid AssignmentId, List<Guid> DayIds)
        BuildFixture(int routineCount, int daysPerRoutine, ProgramAssignmentMode mode)
    {
        var options = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new KondixDbContext(options);

        var trainerId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();

        db.Programs.Add(new Program
        {
            Id = programId,
            TrainerId = trainerId,
            Name = "Test Program",
            DurationWeeks = 4,
            UpdatedAt = DateTimeOffset.UtcNow,
        });

        var dayIds = new List<Guid>();
        for (var r = 0; r < routineCount; r++)
        {
            var routineId = Guid.NewGuid();
            db.Routines.Add(new Routine
            {
                Id = routineId,
                TrainerId = trainerId,
                Name = $"Routine {r}",
                UpdatedAt = DateTimeOffset.UtcNow,
            });
            db.ProgramRoutines.Add(new ProgramRoutine
            {
                ProgramId = programId,
                RoutineId = routineId,
                SortOrder = r,
            });
            for (var d = 0; d < daysPerRoutine; d++)
            {
                var dayId = Guid.NewGuid();
                dayIds.Add(dayId);
                db.Days.Add(new Day
                {
                    Id = dayId,
                    RoutineId = routineId,
                    Name = $"R{r}-D{d}",
                    SortOrder = d,
                });
            }
        }

        db.ProgramAssignments.Add(new ProgramAssignment
        {
            Id = assignmentId,
            ProgramId = programId,
            StudentId = studentId,
            Mode = mode,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(28)),
            Status = ProgramAssignmentStatus.Active,
            RotationIndex = 0,
        });

        db.SaveChanges();
        return (db, studentId, assignmentId, dayIds);
    }
}
