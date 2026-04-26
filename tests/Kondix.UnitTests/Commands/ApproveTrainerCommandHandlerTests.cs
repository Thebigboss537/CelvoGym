using FluentAssertions;
using Kondix.Application.Commands.Catalog;
using Kondix.Application.Commands.Onboarding;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Kondix.UnitTests.Commands;

public sealed class ApproveTrainerCommandHandlerTests
{
    private static KondixDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new KondixDbContext(options);
    }

    [Fact]
    public async Task Approve_NewTrainer_SetsFlagsAndSeedsCatalog()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        db.Trainers.Add(new Trainer
        {
            Id = trainerId,
            CelvoGuardUserId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            DisplayName = "Test",
            IsApproved = false,
        });
        await db.SaveChangesAsync();

        var sender = Substitute.For<IMediator>();
        sender.Send(Arg.Any<SeedCatalogCommand>(), Arg.Any<CancellationToken>())
            .Returns(50);

        var handler = new ApproveTrainerCommandHandler(db, sender);
        var result = await handler.Handle(new ApproveTrainerCommand(trainerId), CancellationToken.None);

        result.AlreadyApproved.Should().BeFalse();
        result.ExercisesSeeded.Should().Be(50);
        result.ApprovedAt.Should().NotBeNull();

        var t = await db.Trainers.FirstAsync(x => x.Id == trainerId);
        t.IsApproved.Should().BeTrue();
        t.ApprovedAt.Should().NotBeNull();

        await sender.Received(1).Send(
            Arg.Is<SeedCatalogCommand>(c => c.TrainerId == trainerId),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Approve_AlreadyApproved_IsNoOp()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var alreadyAt = DateTimeOffset.UtcNow.AddDays(-1);
        db.Trainers.Add(new Trainer
        {
            Id = trainerId,
            CelvoGuardUserId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            DisplayName = "Test",
            IsApproved = true,
            ApprovedAt = alreadyAt,
        });
        await db.SaveChangesAsync();

        var sender = Substitute.For<IMediator>();
        var handler = new ApproveTrainerCommandHandler(db, sender);

        var result = await handler.Handle(new ApproveTrainerCommand(trainerId), CancellationToken.None);

        result.AlreadyApproved.Should().BeTrue();
        result.ExercisesSeeded.Should().Be(0);
        result.ApprovedAt.Should().Be(alreadyAt);
        await sender.DidNotReceive().Send(Arg.Any<SeedCatalogCommand>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Approve_NotFound_ThrowsInvalidOperation()
    {
        await using var db = NewDb();
        var sender = Substitute.For<IMediator>();
        var handler = new ApproveTrainerCommandHandler(db, sender);

        var act = async () => await handler.Handle(
            new ApproveTrainerCommand(Guid.NewGuid()), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Trainer not found");
    }
}
