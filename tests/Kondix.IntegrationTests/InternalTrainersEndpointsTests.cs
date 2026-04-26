using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Kondix.Domain.Entities;
using Kondix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kondix.IntegrationTests;

public sealed class InternalTrainersEndpointsTests : IClassFixture<InternalTrainersFactory>
{
    private readonly InternalTrainersFactory _factory;

    public InternalTrainersEndpointsTests(InternalTrainersFactory f) => _factory = f;

    [Fact]
    public async Task ListPending_WithoutKey_Returns401()
    {
        using var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/v1/internal/trainers/pending");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Approve_Unknown_Returns404()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", InternalTrainersFactory.Key);
        var res = await client.PostAsync($"/api/v1/internal/trainers/{Guid.NewGuid()}/approve", null);
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Approve_FlipsFlagAndSeedsCatalog()
    {
        var trainerId = Guid.NewGuid();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            db.Trainers.Add(new Trainer
            {
                Id = trainerId,
                CelvoGuardUserId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                DisplayName = "Pending",
                IsApproved = false,
            });
            await db.SaveChangesAsync();
        }

        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", InternalTrainersFactory.Key);
        var res = await client.PostAsync($"/api/v1/internal/trainers/{trainerId}/approve", null);
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await res.Content.ReadFromJsonAsync<ApprovalBody>();
        body!.AlreadyApproved.Should().BeFalse();
        body.ExercisesSeeded.Should().BeInRange(40, 100); // Seed list has 50 entries; upper bound catches accidental duplication
        body.ApprovedAt.Should().NotBeNull();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            var t = await db.Trainers.FirstAsync(x => x.Id == trainerId);
            t.IsApproved.Should().BeTrue();
            t.ApprovedAt.Should().NotBeNull();
            var catalog = await db.CatalogExercises.CountAsync(c => c.TrainerId == trainerId);
            catalog.Should().BeInRange(40, 100);
        }
    }

    [Fact]
    public async Task Approve_AlreadyApproved_IsNoOp()
    {
        var trainerId = Guid.NewGuid();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            db.Trainers.Add(new Trainer
            {
                Id = trainerId,
                CelvoGuardUserId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                DisplayName = "Already",
                IsApproved = true,
                ApprovedAt = DateTimeOffset.UtcNow.AddDays(-2),
            });
            await db.SaveChangesAsync();
        }

        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", InternalTrainersFactory.Key);
        var res = await client.PostAsync($"/api/v1/internal/trainers/{trainerId}/approve", null);
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await res.Content.ReadFromJsonAsync<ApprovalBody>();
        body!.AlreadyApproved.Should().BeTrue();
        body.ExercisesSeeded.Should().Be(0);
    }

    [Fact]
    public async Task ListPending_WithKey_ReturnsOnlyUnapproved()
    {
        // Seed: one unapproved (recent), one approved.
        var unapprovedId = Guid.NewGuid();
        var approvedId = Guid.NewGuid();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            db.Trainers.Add(new Trainer
            {
                Id = unapprovedId,
                CelvoGuardUserId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                DisplayName = "Pending listing",
                IsApproved = false,
            });
            db.Trainers.Add(new Trainer
            {
                Id = approvedId,
                CelvoGuardUserId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                DisplayName = "Already approved listing",
                IsApproved = true,
                ApprovedAt = DateTimeOffset.UtcNow.AddDays(-5),
            });
            await db.SaveChangesAsync();
        }

        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", InternalTrainersFactory.Key);
        var res = await client.GetAsync("/api/v1/internal/trainers/pending");
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var list = await res.Content.ReadFromJsonAsync<List<PendingTrainerBody>>();
        list.Should().NotBeNull();
        list!.Select(p => p.TrainerId).Should().Contain(unapprovedId);
        list.Select(p => p.TrainerId).Should().NotContain(approvedId);
    }

    private sealed record ApprovalBody(DateTimeOffset? ApprovedAt, int ExercisesSeeded, bool AlreadyApproved);
    private sealed record PendingTrainerBody(Guid TrainerId, string DisplayName, Guid CelvoGuardUserId, DateTimeOffset RegisteredAt);
}

public sealed class InternalTrainersFactory : WebApplicationFactory<Program>
{
    public const string Key = "integration-trainers-key";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Internal:ApiKey", Key);

        builder.ConfigureServices(services =>
        {
            var toRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<KondixDbContext>)
                    || d.ServiceType == typeof(DbContextOptions)
                    || d.ServiceType == typeof(KondixDbContext)
                    || (d.ServiceType.IsGenericType &&
                        d.ServiceType.GetGenericArguments().Any(a => a == typeof(KondixDbContext))))
                .ToList();
            foreach (var d in toRemove) services.Remove(d);

            services.AddDbContext<KondixDbContext>(options =>
                options.UseInMemoryDatabase("KondixInternalTrainers"));
        });
    }
}
