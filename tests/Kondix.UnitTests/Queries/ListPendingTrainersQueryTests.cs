using FluentAssertions;
using Kondix.Application.Queries.Trainers;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Queries;

public sealed class ListPendingTrainersQueryTests
{
    private static KondixDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new KondixDbContext(options);
    }

    [Fact]
    public async Task Returns_OnlyUnapproved_OrderedOldestFirst()
    {
        await using var db = NewDb();
        var older = DateTimeOffset.UtcNow.AddDays(-3);
        var newer = DateTimeOffset.UtcNow.AddDays(-1);

        // NOTE: Trainer entity has no Email field. The local schema only stores
        // CelvoGuardUserId, which CelvoAdmin uses to resolve the email cross-schema
        // against celvoguard.users. The DTO carries CelvoGuardUserId for that purpose.
        db.Trainers.AddRange(
            new Trainer { Id = Guid.NewGuid(), CelvoGuardUserId = Guid.NewGuid(), TenantId = Guid.NewGuid(), DisplayName = "Old",  IsApproved = false, CreatedAt = older },
            new Trainer { Id = Guid.NewGuid(), CelvoGuardUserId = Guid.NewGuid(), TenantId = Guid.NewGuid(), DisplayName = "New",  IsApproved = false, CreatedAt = newer },
            new Trainer { Id = Guid.NewGuid(), CelvoGuardUserId = Guid.NewGuid(), TenantId = Guid.NewGuid(), DisplayName = "Done", IsApproved = true,  CreatedAt = older }
        );
        await db.SaveChangesAsync();

        var handler = new ListPendingTrainersQueryHandler(db);
        var result = await handler.Handle(new ListPendingTrainersQuery(), CancellationToken.None);

        result.Should().HaveCount(2);
        result[0].DisplayName.Should().Be("Old");
        result[1].DisplayName.Should().Be("New");
    }
}
