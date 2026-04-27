using FluentAssertions;
using Kondix.Application.Commands.PersonalRecords;
using Kondix.Application.Commands.Progress;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Kondix.UnitTests.Commands;

public sealed class UpdateSetDataCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(options);
    }

    // Seeds a WorkoutSession and an existing SetLog so the handler follows the
    // UPDATE path, which avoids the ExerciseSets.Include(es => es.Exercise) lookup
    // that would need a fully-wired relational DB.
    // SnapshotExerciseName is pre-populated so PR matching can be tested.
    private static (KondixDbContext db, Guid sessionId, Guid setId, Guid studentId) Seed(
        string exerciseName = "Press banca")
    {
        var db = NewDb();
        var studentId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var routineId = Guid.NewGuid();
        var setId = Guid.NewGuid();

        db.WorkoutSessions.Add(new WorkoutSession
        {
            Id = sessionId,
            StudentId = studentId,
            RoutineId = routineId,
            DayId = Guid.NewGuid(),
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-20),
        });

        db.SetLogs.Add(new SetLog
        {
            SessionId = sessionId,
            StudentId = studentId,
            SetId = setId,
            RoutineId = routineId,
            SnapshotExerciseName = exerciseName,
        });

        db.SaveChanges();
        return (db, sessionId, setId, studentId);
    }

    [Fact]
    public async Task Returns_SetLog_Without_NewPr_When_No_Pr_Detected()
    {
        var (db, sessionId, setId, studentId) = Seed();
        await using (db)
        {
            var mediator = Substitute.For<IMediator>();
            mediator
                .Send(Arg.Any<DetectNewPRsCommand>(), Arg.Any<CancellationToken>())
                .Returns(new List<NewPrDto>());

            var handler = new UpdateSetDataHandler(db, mediator);
            var result = await handler.Handle(
                new UpdateSetDataCommand(studentId, sessionId, setId, Guid.NewGuid(), "80", "5", 7), default);

            result.SetLog.Should().NotBeNull();
            result.SetLog.ActualWeight.Should().Be("80");
            result.NewPr.Should().BeNull();
        }
    }

    [Fact]
    public async Task Returns_NewPr_When_Detected()
    {
        // Arrange: existing PR at 80 kg, now lifting 85 kg
        var (db, sessionId, setId, studentId) = Seed("Press banca");
        await using (db)
        {
            var mediator = Substitute.For<IMediator>();
            mediator
                .Send(Arg.Any<DetectNewPRsCommand>(), Arg.Any<CancellationToken>())
                .Returns(new List<NewPrDto>
                {
                    new NewPrDto("Press banca", "85", "80")
                });

            var handler = new UpdateSetDataHandler(db, mediator);
            var result = await handler.Handle(
                new UpdateSetDataCommand(studentId, sessionId, setId, Guid.NewGuid(), "85", "5", 8), default);

            result.SetLog.Should().NotBeNull();
            result.SetLog.ActualWeight.Should().Be("85");
            result.NewPr.Should().NotBeNull();
            result.NewPr!.ExerciseName.Should().Be("Press banca");
            result.NewPr.Weight.Should().Be("85");
            result.NewPr.PreviousWeight.Should().Be("80");
        }
    }

    [Fact]
    public async Task Returns_NewPr_Only_For_Matching_Exercise()
    {
        // PR detected for a different exercise than what was just logged — should not surface.
        var (db, sessionId, setId, studentId) = Seed("Sentadilla");
        await using (db)
        {
            var mediator = Substitute.For<IMediator>();
            mediator
                .Send(Arg.Any<DetectNewPRsCommand>(), Arg.Any<CancellationToken>())
                .Returns(new List<NewPrDto>
                {
                    new NewPrDto("Press banca", "100", "90")
                });

            var handler = new UpdateSetDataHandler(db, mediator);
            var result = await handler.Handle(
                new UpdateSetDataCommand(studentId, sessionId, setId, Guid.NewGuid(), "120", "3", null), default);

            result.NewPr.Should().BeNull();
        }
    }

    [Fact]
    public async Task Swallows_PR_Detection_Failure_And_Returns_SetLog()
    {
        // PR detection failure must never block the write — toast miss is acceptable.
        var (db, sessionId, setId, studentId) = Seed();
        await using (db)
        {
            var mediator = Substitute.For<IMediator>();
            mediator
                .Send(Arg.Any<DetectNewPRsCommand>(), Arg.Any<CancellationToken>())
                .Returns<List<NewPrDto>>(_ => throw new Exception("detection failure"));

            var handler = new UpdateSetDataHandler(db, mediator);
            var result = await handler.Handle(
                new UpdateSetDataCommand(studentId, sessionId, setId, Guid.NewGuid(), "90", "4", null), default);

            result.SetLog.Should().NotBeNull();
            result.SetLog.ActualWeight.Should().Be("90");
            result.NewPr.Should().BeNull();
        }
    }
}
