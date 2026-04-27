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
        var trainerId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var routine = new Routine { Id = Guid.NewGuid(), Name = "R" };
        db.Routines.Add(routine);
        // Seed trainer-student link
        db.TrainerStudents.Add(new TrainerStudent { TrainerId = trainerId, StudentId = studentId, IsActive = true });
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
        var result = await handler.Handle(new GetRecentFeedbackQuery(trainerId, studentId), default);

        result.UnreadCount.Should().Be(1);
        result.Sessions.Should().HaveCount(1);
    }

    [Fact]
    public async Task Throws_When_Trainer_Not_Linked_To_Student()
    {
        await using var db = NewDb();
        var unlinkedTrainerId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        // No TrainerStudent link seeded

        var handler = new GetRecentFeedbackQueryHandler(db);
        var act = () => handler.Handle(new GetRecentFeedbackQuery(unlinkedTrainerId, studentId), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Student not found");
    }
}
