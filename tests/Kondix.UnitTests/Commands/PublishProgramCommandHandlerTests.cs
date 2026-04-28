using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class PublishProgramCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Sets_IsPublished_True()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = trainerId, Name = "P", IsPublished = false });
        await db.SaveChangesAsync();

        await new PublishProgramHandler(db).Handle(new PublishProgramCommand(programId, trainerId), default);

        (await db.Programs.FirstAsync()).IsPublished.Should().BeTrue();
    }

    [Fact]
    public async Task Idempotent_When_Already_Published()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = trainerId, Name = "P", IsPublished = true });
        await db.SaveChangesAsync();

        await new PublishProgramHandler(db).Handle(new PublishProgramCommand(programId, trainerId), default);
        (await db.Programs.FirstAsync()).IsPublished.Should().BeTrue();
    }

    [Fact]
    public async Task Wrong_Trainer_Throws()
    {
        await using var db = NewDb();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = Guid.NewGuid(), Name = "P" });
        await db.SaveChangesAsync();

        await FluentActions.Invoking(() => new PublishProgramHandler(db)
            .Handle(new PublishProgramCommand(programId, Guid.NewGuid()), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }
}
