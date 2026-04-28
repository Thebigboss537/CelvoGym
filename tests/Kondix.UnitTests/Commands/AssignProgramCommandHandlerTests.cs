using FluentAssertions;
using Kondix.Application.Commands.ProgramAssignments;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class AssignProgramCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static Program NewPublishedProgram(Guid trainerId) => new()
    {
        Id = Guid.NewGuid(),
        TrainerId = trainerId,
        Name = "P",
        IsPublished = true,
        Mode = ProgramMode.Fixed,
        ScheduleType = ProgramScheduleType.Week,
    };

    [Fact]
    public async Task Creating_New_Assignment_Cancels_Prior_Active_For_Same_Student()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var p1 = NewPublishedProgram(trainerId);
        var p2 = NewPublishedProgram(trainerId);
        db.Programs.AddRange(p1, p2);

        var prior = new ProgramAssignment
        {
            Id = Guid.NewGuid(), TrainerId = trainerId, StudentId = studentId,
            ProgramId = p1.Id, StartDate = DateTimeOffset.UtcNow.AddDays(-7),
            Status = ProgramAssignmentStatus.Active,
        };
        db.ProgramAssignments.Add(prior);
        await db.SaveChangesAsync();

        var handler = new AssignProgramHandler(db);
        var newId = await handler.Handle(new AssignProgramCommand(
            trainerId, studentId, p2.Id, DateTimeOffset.UtcNow), default);

        var priorAfter = await db.ProgramAssignments.FindAsync(prior.Id);
        priorAfter!.Status.Should().Be(ProgramAssignmentStatus.Cancelled);

        var newAssignment = await db.ProgramAssignments.FindAsync(newId);
        newAssignment!.Status.Should().Be(ProgramAssignmentStatus.Active);
        newAssignment.ProgramId.Should().Be(p2.Id);
    }

    [Fact]
    public async Task Cannot_Assign_Unpublished_Program()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var p = NewPublishedProgram(trainerId);
        p.IsPublished = false;
        db.Programs.Add(p);
        await db.SaveChangesAsync();

        var handler = new AssignProgramHandler(db);
        var act = async () => await handler.Handle(new AssignProgramCommand(
            trainerId, Guid.NewGuid(), p.Id, DateTimeOffset.UtcNow), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Publicá*");
    }

    [Fact]
    public async Task Cannot_Assign_Program_Of_Different_Trainer()
    {
        await using var db = NewDb();
        var trainerA = Guid.NewGuid();
        var trainerB = Guid.NewGuid();
        var p = NewPublishedProgram(trainerA); // owned by A
        db.Programs.Add(p);
        await db.SaveChangesAsync();

        var handler = new AssignProgramHandler(db);
        var act = async () => await handler.Handle(new AssignProgramCommand(
            trainerB /* wrong */, Guid.NewGuid(), p.Id, DateTimeOffset.UtcNow), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }
}
