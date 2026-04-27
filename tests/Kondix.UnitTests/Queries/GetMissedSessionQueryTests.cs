using System.Text.Json;
using FluentAssertions;
using Kondix.Application.Queries.StudentPortal;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Queries;

public sealed class GetMissedSessionQueryTests
{
    private static KondixDbContext NewDb()
    {
        var o = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(o);
    }

    // ─── helpers ────────────────────────────────────────────────────────────────

    /// <summary>
    /// Builds a minimal but complete chain: Program → ProgramRoutine → Routine → Day.
    /// Returns (programId, routineId, dayId).
    /// </summary>
    private static (Guid ProgramId, Guid RoutineId, Guid DayId) SeedProgramChain(
        KondixDbContext db, Guid trainerId)
    {
        var programId = Guid.NewGuid();
        var routineId = Guid.NewGuid();
        var dayId = Guid.NewGuid();

        db.Programs.Add(new Program
        {
            Id = programId,
            TrainerId = trainerId,
            Name = "Test Program",
            DurationWeeks = 8,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        db.Routines.Add(new Routine
        {
            Id = routineId,
            TrainerId = trainerId,
            Name = "Test Routine",
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        db.ProgramRoutines.Add(new ProgramRoutine
        {
            ProgramId = programId,
            RoutineId = routineId,
            SortOrder = 0,
        });
        db.Days.Add(new Day
        {
            Id = dayId,
            RoutineId = routineId,
            Name = "Test Day",
            SortOrder = 0,
        });

        return (programId, routineId, dayId);
    }

    private static ProgramAssignment MakeAssignment(
        Guid studentId, Guid programId,
        int[] trainingDays,
        ProgramAssignmentMode mode = ProgramAssignmentMode.Rotation,
        string? fixedScheduleJson = null,
        int rotationIndex = 0)
    {
        return new ProgramAssignment
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ProgramId = programId,
            Mode = mode,
            TrainingDays = [.. trainingDays],
            FixedScheduleJson = fixedScheduleJson,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            Status = ProgramAssignmentStatus.Active,
            RotationIndex = rotationIndex,
        };
    }

    // ─── tests ──────────────────────────────────────────────────────────────────

    /// <summary>
    /// Today is a training day. Yesterday and 2-days-ago are NOT training days.
    /// No missed window → null.
    /// </summary>
    [Fact]
    public async Task NoMissedDay_Returns_Null()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        var trainerId = Guid.NewGuid();

        var (programId, _, _) = SeedProgramChain(db, trainerId);

        // Training days contain only today — yesterday and 2-days-ago are NOT training days.
        var todayDow = (int)DateTime.UtcNow.DayOfWeek;
        db.ProgramAssignments.Add(MakeAssignment(studentId, programId, [todayDow]));
        await db.SaveChangesAsync();

        var handler = new GetMissedSessionQueryHandler(db);
        var result = await handler.Handle(new GetMissedSessionQuery(studentId), default);

        result.Should().BeNull();
    }

    /// <summary>
    /// Yesterday WAS a training day and no session was completed that day.
    /// Returns a recoverable session pointing at yesterday.
    /// </summary>
    [Fact]
    public async Task MissedYesterday_Returns_Recoverable()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        var trainerId = Guid.NewGuid();

        var (programId, routineId, dayId) = SeedProgramChain(db, trainerId);

        var yesterdayDow = (int)DateTime.UtcNow.AddDays(-1).DayOfWeek;
        db.ProgramAssignments.Add(MakeAssignment(studentId, programId, [yesterdayDow]));
        await db.SaveChangesAsync();

        var handler = new GetMissedSessionQueryHandler(db);
        var result = await handler.Handle(new GetMissedSessionQuery(studentId), default);

        result.Should().NotBeNull();
        result!.PlannedDate.Should().Be(DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)));
        result.RoutineId.Should().Be(routineId);
        result.DayId.Should().Be(dayId);
        result.DeadlineDate.Should().Be(DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)));
    }

    /// <summary>
    /// Two days ago WAS a training day and no session was completed that day.
    /// Returns a recoverable session pointing at 2-days-ago.
    /// </summary>
    [Fact]
    public async Task MissedTwoDaysAgo_Returns_Recoverable()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        var trainerId = Guid.NewGuid();

        var (programId, routineId, dayId) = SeedProgramChain(db, trainerId);

        var twoDaysAgoDow = (int)DateTime.UtcNow.AddDays(-2).DayOfWeek;
        db.ProgramAssignments.Add(MakeAssignment(studentId, programId, [twoDaysAgoDow]));
        await db.SaveChangesAsync();

        var handler = new GetMissedSessionQueryHandler(db);
        var result = await handler.Handle(new GetMissedSessionQuery(studentId), default);

        result.Should().NotBeNull();
        result!.PlannedDate.Should().Be(DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)));
        result.RoutineId.Should().Be(routineId);
        result.DayId.Should().Be(dayId);
        result.DeadlineDate.Should().Be(DateOnly.FromDateTime(DateTime.UtcNow));
    }

    /// <summary>
    /// Yesterday was a training day that was missed, but a recovery session
    /// (IsRecovery=true) already exists for it. Returns null.
    /// </summary>
    [Fact]
    public async Task AlreadyRecovered_Returns_Null()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        var trainerId = Guid.NewGuid();

        var (programId, routineId, dayId) = SeedProgramChain(db, trainerId);

        var yesterdayDow = (int)DateTime.UtcNow.AddDays(-1).DayOfWeek;
        var assignment = MakeAssignment(studentId, programId, [yesterdayDow]);
        db.ProgramAssignments.Add(assignment);

        // Seed a recovery session started today for the missed yesterday session.
        // ProgramAssignmentId must match so the updated predicate (consistent with
        // StartSessionCommand) correctly recognises the session as already recovered.
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ProgramAssignmentId = assignment.Id,
            RoutineId = routineId,
            DayId = dayId,
            StartedAt = DateTimeOffset.UtcNow,
            IsRecovery = true,
            RecoversSessionId = null, // no original session existed — recovery still blocks re-recovery
        });
        await db.SaveChangesAsync();

        var handler = new GetMissedSessionQueryHandler(db);
        var result = await handler.Handle(new GetMissedSessionQuery(studentId), default);

        result.Should().BeNull();
    }

    /// <summary>
    /// Three days ago was a training day that was missed. Outside the 2-day window → null.
    /// </summary>
    [Fact]
    public async Task MissedThreeDaysAgo_Returns_Null()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        var trainerId = Guid.NewGuid();

        var (programId, _, _) = SeedProgramChain(db, trainerId);

        // Only train 3 days ago — no training in the last 2 days.
        var threeDaysAgoDow = (int)DateTime.UtcNow.AddDays(-3).DayOfWeek;
        db.ProgramAssignments.Add(MakeAssignment(studentId, programId, [threeDaysAgoDow]));
        await db.SaveChangesAsync();

        var handler = new GetMissedSessionQueryHandler(db);
        var result = await handler.Handle(new GetMissedSessionQuery(studentId), default);

        result.Should().BeNull();
    }

    /// <summary>
    /// Student has no active program assignment → null.
    /// </summary>
    [Fact]
    public async Task NoActiveAssignment_Returns_Null()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        var trainerId = Guid.NewGuid();

        var (programId, _, _) = SeedProgramChain(db, trainerId);

        // Assignment exists but is not active.
        var yesterdayDow = (int)DateTime.UtcNow.AddDays(-1).DayOfWeek;
        var assignment = MakeAssignment(studentId, programId, [yesterdayDow]);
        assignment.Status = ProgramAssignmentStatus.Completed;
        db.ProgramAssignments.Add(assignment);
        await db.SaveChangesAsync();

        var handler = new GetMissedSessionQueryHandler(db);
        var result = await handler.Handle(new GetMissedSessionQuery(studentId), default);

        result.Should().BeNull();
    }
}
