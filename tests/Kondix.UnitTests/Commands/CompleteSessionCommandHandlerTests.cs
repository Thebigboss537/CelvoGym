using FluentAssertions;
using Kondix.Application.Commands.Sessions;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class CompleteSessionCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var o = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(o);
    }

    [Fact]
    public async Task First_Call_Sets_CompletedAt_And_Mood()
    {
        await using var db = NewDb();
        var sessionId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = sessionId, StudentId = studentId,
            RoutineId = Guid.NewGuid(), DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-30),
        });
        await db.SaveChangesAsync();

        var handler = new CompleteSessionHandler(db);
        var dto = await handler.Handle(
            new CompleteSessionCommand(sessionId, studentId, "good", MoodType.Good), default);

        dto.CompletedAt.Should().NotBeNull();
        var saved = await db.WorkoutSessions.FirstAsync(s => s.Id == sessionId);
        saved.CompletedAt.Should().NotBeNull();
        saved.Mood.Should().Be(MoodType.Good);
        saved.Notes.Should().Be("good");
    }

    [Fact]
    public async Task Second_Call_Updates_Mood_Without_Throwing()
    {
        await using var db = NewDb();
        var sessionId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var firstAt = DateTimeOffset.UtcNow.AddMinutes(-1);
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = sessionId, StudentId = studentId,
            RoutineId = Guid.NewGuid(), DayId = Guid.NewGuid(),
            StartedAt = firstAt.AddMinutes(-30),
            CompletedAt = firstAt,
            Mood = MoodType.Ok,
            Notes = "old",
        });
        await db.SaveChangesAsync();

        var handler = new CompleteSessionHandler(db);
        await handler.Handle(new CompleteSessionCommand(sessionId, studentId, "actually rough", MoodType.Tough), default);

        var saved = await db.WorkoutSessions.FirstAsync(s => s.Id == sessionId);
        saved.CompletedAt.Should().Be(firstAt);  // not bumped
        saved.Mood.Should().Be(MoodType.Tough);
        saved.Notes.Should().Be("actually rough");
    }
}
