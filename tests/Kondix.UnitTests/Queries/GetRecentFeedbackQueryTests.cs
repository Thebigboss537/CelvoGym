using FluentAssertions;
using Kondix.Application.Queries.Analytics;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Queries;

public sealed class GetRecentFeedbackQueryTests
{
    private static KondixDbContext NewDb()
    {
        var o = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(o);
    }

    [Fact]
    public async Task Counts_Only_Unread_With_Feedback()
    {
        await using var db = NewDb();
        var studentId = Guid.NewGuid();
        var routine = new Routine { Id = Guid.NewGuid(), Name = "R" };
        db.Routines.Add(routine);
        // Unread + has mood → counted
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = Guid.NewGuid(), StudentId = studentId,
            RoutineId = routine.Id, DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddDays(-1),
            CompletedAt = DateTimeOffset.UtcNow.AddDays(-1).AddHours(1),
            Mood = MoodType.Good,
        });
        // Read (FeedbackReviewedAt set) → not counted
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = Guid.NewGuid(), StudentId = studentId,
            RoutineId = routine.Id, DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddDays(-2),
            CompletedAt = DateTimeOffset.UtcNow.AddDays(-2).AddHours(1),
            Mood = MoodType.Good,
            FeedbackReviewedAt = DateTimeOffset.UtcNow.AddHours(-1),
        });
        // Unread but no feedback → not counted
        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = Guid.NewGuid(), StudentId = studentId,
            RoutineId = routine.Id, DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddDays(-1),
            CompletedAt = DateTimeOffset.UtcNow.AddDays(-1).AddHours(1),
        });
        await db.SaveChangesAsync();

        var handler = new GetRecentFeedbackQueryHandler(db);
        var result = await handler.Handle(new GetRecentFeedbackQuery(studentId), default);

        result.UnreadCount.Should().Be(1);
        result.Sessions.Should().HaveCount(1);
    }
}
