using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class UpsertProgramWeekOverrideCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var o = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(o);
    }

    [Fact]
    public async Task Inserts_When_None_Exists()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = trainerId, Name = "P" });
        await db.SaveChangesAsync();

        var handler = new UpsertProgramWeekOverrideCommandHandler(db);
        await handler.Handle(new UpsertProgramWeekOverrideCommand(programId, trainerId, 2, "+5kg en compuestos"), default);

        var saved = await db.ProgramWeekOverrides.FirstAsync();
        saved.WeekIndex.Should().Be(2);
        saved.Notes.Should().Be("+5kg en compuestos");
    }

    [Fact]
    public async Task Updates_When_Existing()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = trainerId, Name = "P" });
        db.ProgramWeekOverrides.Add(new ProgramWeekOverride { ProgramId = programId, WeekIndex = 4, Notes = "old" });
        await db.SaveChangesAsync();

        var handler = new UpsertProgramWeekOverrideCommandHandler(db);
        await handler.Handle(new UpsertProgramWeekOverrideCommand(programId, trainerId, 4, "deload semana"), default);

        (await db.ProgramWeekOverrides.CountAsync()).Should().Be(1);
        var saved = await db.ProgramWeekOverrides.FirstAsync();
        saved.Notes.Should().Be("deload semana");
    }

    [Fact]
    public async Task EmptyNotes_Deletes_Row()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = trainerId, Name = "P" });
        db.ProgramWeekOverrides.Add(new ProgramWeekOverride { ProgramId = programId, WeekIndex = 3, Notes = "old" });
        await db.SaveChangesAsync();

        var handler = new UpsertProgramWeekOverrideCommandHandler(db);
        await handler.Handle(new UpsertProgramWeekOverrideCommand(programId, trainerId, 3, ""), default);

        (await db.ProgramWeekOverrides.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Whitespace_Notes_Treated_As_Empty_And_Deletes_Row()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = trainerId, Name = "P" });
        db.ProgramWeekOverrides.Add(new ProgramWeekOverride { ProgramId = programId, WeekIndex = 5, Notes = "old" });
        await db.SaveChangesAsync();

        var handler = new UpsertProgramWeekOverrideCommandHandler(db);
        await handler.Handle(new UpsertProgramWeekOverrideCommand(programId, trainerId, 5, "   "), default);

        (await db.ProgramWeekOverrides.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task EmptyNotes_With_No_Existing_Is_NoOp()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = trainerId, Name = "P" });
        await db.SaveChangesAsync();

        var handler = new UpsertProgramWeekOverrideCommandHandler(db);
        await handler.Handle(new UpsertProgramWeekOverrideCommand(programId, trainerId, 7, ""), default);

        (await db.ProgramWeekOverrides.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Throws_When_Trainer_Does_Not_Own_Program()
    {
        await using var db = NewDb();
        var ownerTrainerId = Guid.NewGuid();
        var foreignTrainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = ownerTrainerId, Name = "P" });
        await db.SaveChangesAsync();

        var handler = new UpsertProgramWeekOverrideCommandHandler(db);
        var act = () => handler.Handle(
            new UpsertProgramWeekOverrideCommand(programId, foreignTrainerId, 2, "stolen note"), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Program not found");
        (await db.ProgramWeekOverrides.CountAsync()).Should().Be(0);
    }
}
