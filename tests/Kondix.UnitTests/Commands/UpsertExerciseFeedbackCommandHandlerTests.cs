using FluentAssertions;
using Kondix.Application.Commands.Sessions;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class UpsertExerciseFeedbackCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var o = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(o);
    }

    private static (KondixDbContext db, Guid sessionId, Guid exerciseId, Guid studentId) Seed(bool active)
    {
        var db = NewDb();
        var studentId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var exerciseId = Guid.NewGuid();
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = sessionId,
            StudentId = studentId,
            RoutineId = Guid.NewGuid(),
            DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-15),
            CompletedAt = active ? null : DateTimeOffset.UtcNow,
        });
        db.SaveChanges();
        return (db, sessionId, exerciseId, studentId);
    }

    [Fact]
    public async Task Inserts_When_None_Exists()
    {
        var (db, sessionId, exerciseId, studentId) = Seed(active: true);
        var handler = new UpsertExerciseFeedbackCommandHandler(db);

        await handler.Handle(new UpsertExerciseFeedbackCommand(
            studentId, sessionId, exerciseId, 8, "tough"), default);

        var fb = await db.ExerciseFeedback.FirstAsync();
        fb.SessionId.Should().Be(sessionId);
        fb.ExerciseId.Should().Be(exerciseId);
        fb.ActualRpe.Should().Be(8);
        fb.Notes.Should().Be("tough");
    }

    [Fact]
    public async Task Updates_When_Existing()
    {
        var (db, sessionId, exerciseId, studentId) = Seed(active: true);
        db.ExerciseFeedback.Add(new ExerciseFeedback
        {
            SessionId = sessionId, ExerciseId = exerciseId,
            ActualRpe = 5, Notes = "old",
        });
        await db.SaveChangesAsync();

        var handler = new UpsertExerciseFeedbackCommandHandler(db);
        await handler.Handle(new UpsertExerciseFeedbackCommand(
            studentId, sessionId, exerciseId, 9, "new"), default);

        (await db.ExerciseFeedback.CountAsync()).Should().Be(1);
        var fb = await db.ExerciseFeedback.FirstAsync();
        fb.ActualRpe.Should().Be(9);
        fb.Notes.Should().Be("new");
    }

    [Fact]
    public async Task Throws_When_Session_Completed()
    {
        var (db, sessionId, exerciseId, studentId) = Seed(active: false);
        var handler = new UpsertExerciseFeedbackCommandHandler(db);
        var act = async () => await handler.Handle(
            new UpsertExerciseFeedbackCommand(studentId, sessionId, exerciseId, 7, null), default);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Session not active");
    }
}
