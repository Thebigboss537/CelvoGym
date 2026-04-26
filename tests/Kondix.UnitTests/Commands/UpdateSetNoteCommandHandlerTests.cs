using FluentAssertions;
using Kondix.Application.Commands.Sessions;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class UpdateSetNoteCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(options);
    }

    private static (KondixDbContext db, Guid setLogId, Guid studentId) Seed(bool sessionActive)
    {
        var db = NewDb();
        var studentId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var setLogId = Guid.NewGuid();

        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = sessionId,
            StudentId = studentId,
            RoutineId = Guid.NewGuid(),
            DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-10),
            CompletedAt = sessionActive ? null : DateTimeOffset.UtcNow,
        });
        db.SetLogs.Add(new SetLog
        {
            Id = setLogId,
            SessionId = sessionId,
            StudentId = studentId,
            RoutineId = Guid.NewGuid(),
        });
        db.SaveChanges();
        return (db, setLogId, studentId);
    }

    [Fact]
    public async Task Updates_Notes_When_Session_Active()
    {
        var (db, setLogId, studentId) = Seed(sessionActive: true);
        var handler = new UpdateSetNoteCommandHandler(db);

        await handler.Handle(new UpdateSetNoteCommand(studentId, setLogId, "felt heavy"), default);

        var saved = await db.SetLogs.FirstAsync(s => s.Id == setLogId);
        saved.Notes.Should().Be("felt heavy");
    }

    [Fact]
    public async Task Throws_When_Session_Completed()
    {
        var (db, setLogId, studentId) = Seed(sessionActive: false);
        var handler = new UpdateSetNoteCommandHandler(db);

        var act = async () => await handler.Handle(
            new UpdateSetNoteCommand(studentId, setLogId, "x"), default);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Session not active");
    }

    [Fact]
    public async Task Throws_When_NotOwner()
    {
        var (db, setLogId, _) = Seed(sessionActive: true);
        var handler = new UpdateSetNoteCommandHandler(db);

        var act = async () => await handler.Handle(
            new UpdateSetNoteCommand(Guid.NewGuid(), setLogId, "x"), default);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Set log not found");
    }
}
