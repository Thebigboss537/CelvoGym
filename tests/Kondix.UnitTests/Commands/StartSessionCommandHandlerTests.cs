using FluentAssertions;
using Kondix.Application.Commands.Sessions;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class StartSessionCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(options);
    }

    /// <summary>
    /// Seeds the minimum graph needed for StartSessionHandler:
    /// Trainer → Program → ProgramRoutine → Routine → Day
    ///                    ProgramAssignment (Active, includes that routine)
    /// </summary>
    private static (
        KondixDbContext db,
        Guid studentId,
        Guid routineId,
        Guid dayId,
        Guid assignmentId)
    SeedAssignment(
        KondixDbContext db,
        List<int>? trainingDays = null,
        ProgramAssignmentMode mode = ProgramAssignmentMode.Rotation)
    {
        var trainerId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        var routineId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();

        trainingDays ??= [1, 2, 3, 4, 5]; // Mon-Fri

        db.Trainers.Add(new Trainer
        {
            Id = trainerId,
            CelvoGuardUserId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            DisplayName = "Test Trainer",
        });

        db.Programs.Add(new Program
        {
            Id = programId,
            TrainerId = trainerId,
            Name = "Test Program",
            DurationWeeks = 8,
            UpdatedAt = DateTimeOffset.UtcNow,
        });

        db.ProgramRoutines.Add(new ProgramRoutine
        {
            ProgramId = programId,
            RoutineId = routineId,
            SortOrder = 0,
        });

        db.Routines.Add(new Routine
        {
            Id = routineId,
            TrainerId = trainerId,
            Name = "Test Routine",
            UpdatedAt = DateTimeOffset.UtcNow,
        });

        db.Days.Add(new Day
        {
            Id = dayId,
            RoutineId = routineId,
            Name = "Day A",
            SortOrder = 0,
        });

        db.ProgramAssignments.Add(new ProgramAssignment
        {
            Id = assignmentId,
            ProgramId = programId,
            StudentId = studentId,
            Mode = mode,
            TrainingDays = trainingDays,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            Status = ProgramAssignmentStatus.Active,
        });

        db.SaveChanges();

        return (db, studentId, routineId, dayId, assignmentId);
    }

    // -------------------------------------------------------------------------
    // Normal flow (no recovery)
    // -------------------------------------------------------------------------

    [Fact]
    public async Task StartSession_WithoutRecoveryDate_CreatesSessionWithIsRecoveryFalse()
    {
        await using var db = NewDb();
        var (_, studentId, routineId, dayId, _) = SeedAssignment(db);

        var handler = new StartSessionHandler(db);
        var result = await handler.Handle(
            new StartSessionCommand(studentId, routineId, dayId, null), default);

        result.Should().NotBeNull();

        var saved = await db.WorkoutSessions.FirstAsync(s => s.Id == result.Id);
        saved.IsRecovery.Should().BeFalse();
        saved.RecoversSessionId.Should().BeNull();
    }

    // -------------------------------------------------------------------------
    // Recovery flow — happy path
    // -------------------------------------------------------------------------

    [Fact]
    public async Task StartSession_WithValidRecoveryDate_SetsIsRecoveryTrue()
    {
        await using var db = NewDb();

        // Determine a date that is yesterday AND is a configured training day.
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var yesterday = today.AddDays(-1);
        var trainingDays = Enumerable.Range(0, 7).ToList(); // every day of the week

        var (_, studentId, routineId, dayId, _) = SeedAssignment(db, trainingDays);

        var handler = new StartSessionHandler(db);
        var result = await handler.Handle(
            new StartSessionCommand(studentId, routineId, dayId, yesterday), default);

        result.Should().NotBeNull();

        var saved = await db.WorkoutSessions.FirstAsync(s => s.Id == result.Id);
        saved.IsRecovery.Should().BeTrue();
        saved.RecoversSessionId.Should().BeNull();
    }

    [Fact]
    public async Task StartSession_WithTwoDaysAgoRecoveryDate_SetsIsRecoveryTrue()
    {
        await using var db = NewDb();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var twoDaysAgo = today.AddDays(-2);
        var trainingDays = Enumerable.Range(0, 7).ToList();

        var (_, studentId, routineId, dayId, _) = SeedAssignment(db, trainingDays);

        var handler = new StartSessionHandler(db);
        var result = await handler.Handle(
            new StartSessionCommand(studentId, routineId, dayId, twoDaysAgo), default);

        var saved = await db.WorkoutSessions.FirstAsync(s => s.Id == result.Id);
        saved.IsRecovery.Should().BeTrue();
    }

    // -------------------------------------------------------------------------
    // Recovery flow — validation failures
    // -------------------------------------------------------------------------

    [Fact]
    public async Task StartSession_WithFutureDate_Throws()
    {
        await using var db = NewDb();
        var trainingDays = Enumerable.Range(0, 7).ToList();
        var (_, studentId, routineId, dayId, _) = SeedAssignment(db, trainingDays);

        var tomorrow = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);

        var handler = new StartSessionHandler(db);
        var act = async () => await handler.Handle(
            new StartSessionCommand(studentId, routineId, dayId, tomorrow), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*outside the 2-day recovery window*");
    }

    [Fact]
    public async Task StartSession_WithTodayAsRecoveryDate_Throws()
    {
        await using var db = NewDb();
        var trainingDays = Enumerable.Range(0, 7).ToList();
        var (_, studentId, routineId, dayId, _) = SeedAssignment(db, trainingDays);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var handler = new StartSessionHandler(db);
        var act = async () => await handler.Handle(
            new StartSessionCommand(studentId, routineId, dayId, today), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*outside the 2-day recovery window*");
    }

    [Fact]
    public async Task StartSession_WithThreeDaysAgoRecoveryDate_Throws()
    {
        await using var db = NewDb();
        var trainingDays = Enumerable.Range(0, 7).ToList();
        var (_, studentId, routineId, dayId, _) = SeedAssignment(db, trainingDays);

        var threeDaysAgo = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-3);

        var handler = new StartSessionHandler(db);
        var act = async () => await handler.Handle(
            new StartSessionCommand(studentId, routineId, dayId, threeDaysAgo), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*outside the 2-day recovery window*");
    }

    [Fact]
    public async Task StartSession_WhenPlannedDateIsNotTrainingDay_Throws()
    {
        await using var db = NewDb();

        // Training days = empty (no day is a training day).
        var (_, studentId, routineId, dayId, _) = SeedAssignment(db, []);

        var yesterday = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-1);

        var handler = new StartSessionHandler(db);
        var act = async () => await handler.Handle(
            new StartSessionCommand(studentId, routineId, dayId, yesterday), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not a configured training day*");
    }

    [Fact]
    public async Task StartSession_WhenRecoveryAlreadyExists_Throws()
    {
        await using var db = NewDb();
        var trainingDays = Enumerable.Range(0, 7).ToList();
        var (_, studentId, routineId, dayId, assignmentId) = SeedAssignment(db, trainingDays);

        var yesterday = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-1);

        // Seed an existing recovery session started yesterday
        db.WorkoutSessions.Add(new WorkoutSession
        {
            StudentId = studentId,
            ProgramAssignmentId = assignmentId,
            RoutineId = routineId,
            DayId = dayId,
            StartedAt = new DateTimeOffset(
                yesterday.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero).AddHours(10),
            IsRecovery = true,
        });
        await db.SaveChangesAsync();

        var handler = new StartSessionHandler(db);
        var act = async () => await handler.Handle(
            new StartSessionCommand(studentId, routineId, dayId, yesterday), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*recovery session has already been started*");
    }

    [Fact]
    public async Task StartSession_WhenSessionAlreadyCompletedOnPlannedDate_Throws()
    {
        await using var db = NewDb();
        var trainingDays = Enumerable.Range(0, 7).ToList();
        var (_, studentId, routineId, dayId, assignmentId) = SeedAssignment(db, trainingDays);

        var yesterday = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-1);

        // Seed a completed normal session on that planned date
        db.WorkoutSessions.Add(new WorkoutSession
        {
            StudentId = studentId,
            ProgramAssignmentId = assignmentId,
            RoutineId = routineId,
            DayId = dayId,
            StartedAt = new DateTimeOffset(
                yesterday.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero).AddHours(8),
            CompletedAt = new DateTimeOffset(
                yesterday.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero).AddHours(9),
            IsRecovery = false,
        });
        await db.SaveChangesAsync();

        var handler = new StartSessionHandler(db);
        var act = async () => await handler.Handle(
            new StartSessionCommand(studentId, routineId, dayId, yesterday), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already completed on*");
    }
}
