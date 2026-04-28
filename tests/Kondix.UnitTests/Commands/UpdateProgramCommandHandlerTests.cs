using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class UpdateProgramCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Updates_Metadata()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        var p = new Program
        {
            Id = programId, TrainerId = trainerId, Name = "Old",
            Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Week
        };
        p.Weeks.Add(new ProgramWeek { WeekIndex = 0, Label = "Semana 1" });
        db.Programs.Add(p);
        await db.SaveChangesAsync();

        var handler = new UpdateProgramHandler(db);
        await handler.Handle(new UpdateProgramCommand(programId, trainerId,
            "New Name", "Desc", "Internal",
            ProgramObjective.Fuerza, ProgramLevel.Avanzado, ProgramMode.Fixed), default);

        var refreshed = await db.Programs.FirstAsync(x => x.Id == programId);
        refreshed.Name.Should().Be("New Name");
        refreshed.Description.Should().Be("Desc");
        refreshed.Notes.Should().Be("Internal");
        refreshed.Objective.Should().Be(ProgramObjective.Fuerza);
        refreshed.Level.Should().Be(ProgramLevel.Avanzado);
    }

    [Fact]
    public async Task Switching_To_Loop_With_Multiple_Weeks_Throws()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        var p = new Program { Id = programId, TrainerId = trainerId, Name = "P", Mode = ProgramMode.Fixed };
        p.Weeks.Add(new ProgramWeek { WeekIndex = 0, Label = "S1" });
        p.Weeks.Add(new ProgramWeek { WeekIndex = 1, Label = "S2" });
        db.Programs.Add(p);
        await db.SaveChangesAsync();

        var handler = new UpdateProgramHandler(db);
        await FluentActions.Invoking(() => handler.Handle(new UpdateProgramCommand(
            programId, trainerId, "P", null, null,
            ProgramObjective.Otro, ProgramLevel.Todos, ProgramMode.Loop), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Loop*");
    }

    [Fact]
    public async Task Wrong_Trainer_Throws_NotFound()
    {
        await using var db = NewDb();
        var ownerTrainerId = Guid.NewGuid();
        var attackerTrainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = ownerTrainerId, Name = "P" });
        await db.SaveChangesAsync();

        var handler = new UpdateProgramHandler(db);
        await FluentActions.Invoking(() => handler.Handle(new UpdateProgramCommand(
            programId, attackerTrainerId, "Hacked", null, null,
            ProgramObjective.Otro, ProgramLevel.Todos, ProgramMode.Fixed), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }
}
