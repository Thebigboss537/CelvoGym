using FluentAssertions;
using Kondix.Application.Queries.Programs;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Queries;

public sealed class GetProgramWeekOverridesQueryHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var o = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        return new KondixDbContext(o);
    }

    [Fact]
    public async Task Returns_Overrides_Ordered_By_Week()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = trainerId, Name = "P" });
        db.ProgramWeekOverrides.Add(new ProgramWeekOverride { ProgramId = programId, WeekIndex = 3, Notes = "tres" });
        db.ProgramWeekOverrides.Add(new ProgramWeekOverride { ProgramId = programId, WeekIndex = 1, Notes = "uno" });
        await db.SaveChangesAsync();

        var handler = new GetProgramWeekOverridesQueryHandler(db);
        var result = await handler.Handle(new GetProgramWeekOverridesQuery(programId, trainerId), default);

        result.Should().HaveCount(2);
        result[0].WeekIndex.Should().Be(1);
        result[1].WeekIndex.Should().Be(3);
    }

    [Fact]
    public async Task Throws_When_Trainer_Does_Not_Own_Program()
    {
        await using var db = NewDb();
        var ownerTrainerId = Guid.NewGuid();
        var foreignTrainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = ownerTrainerId, Name = "P" });
        db.ProgramWeekOverrides.Add(new ProgramWeekOverride { ProgramId = programId, WeekIndex = 1, Notes = "secret" });
        await db.SaveChangesAsync();

        var handler = new GetProgramWeekOverridesQueryHandler(db);
        var act = () => handler.Handle(
            new GetProgramWeekOverridesQuery(programId, foreignTrainerId), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Program not found");
    }
}
