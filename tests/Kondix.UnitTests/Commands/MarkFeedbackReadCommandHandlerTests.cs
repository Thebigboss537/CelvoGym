using FluentAssertions;
using Kondix.Application.Commands.Sessions;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class MarkFeedbackReadCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var o = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(o);
    }

    [Fact]
    public async Task Marks_All_Unreviewed_Sessions_As_Read()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var routineId = Guid.NewGuid();
        db.TrainerStudents.Add(new TrainerStudent { TrainerId = trainerId, StudentId = studentId, IsActive = true });
        var session1 = new WorkoutSession
        {
            Id = Guid.NewGuid(), StudentId = studentId,
            RoutineId = routineId, DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddDays(-2),
            CompletedAt = DateTimeOffset.UtcNow.AddDays(-2).AddHours(1),
            Mood = MoodType.Good,
        };
        var session2 = new WorkoutSession
        {
            Id = Guid.NewGuid(), StudentId = studentId,
            RoutineId = routineId, DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddDays(-1),
            CompletedAt = DateTimeOffset.UtcNow.AddDays(-1).AddHours(1),
            Mood = MoodType.Tough,
        };
        db.WorkoutSessions.AddRange(session1, session2);
        await db.SaveChangesAsync();

        var handler = new MarkFeedbackReadCommandHandler(db);
        await handler.Handle(new MarkFeedbackReadCommand(trainerId, studentId), default);

        var saved1 = await db.WorkoutSessions.FirstAsync(s => s.Id == session1.Id);
        var saved2 = await db.WorkoutSessions.FirstAsync(s => s.Id == session2.Id);
        saved1.FeedbackReviewedAt.Should().NotBeNull();
        saved2.FeedbackReviewedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Throws_When_Trainer_Not_Linked_To_Student()
    {
        await using var db = NewDb();
        var unlinkedTrainerId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        // No TrainerStudent link seeded

        var handler = new MarkFeedbackReadCommandHandler(db);
        var act = () => handler.Handle(new MarkFeedbackReadCommand(unlinkedTrainerId, studentId), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Student not found");
    }
}
