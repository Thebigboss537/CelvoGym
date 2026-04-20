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

public sealed class InternalTestEndpointsTests : IClassFixture<InternalTestFactory>
{
    private readonly InternalTestFactory _factory;

    public InternalTestEndpointsTests(InternalTestFactory factory) => _factory = factory;

    [Fact]
    public async Task ApproveTrainer_WithoutKey_Returns401()
    {
        using var client = _factory.CreateClient();

        var res = await client.PostAsJsonAsync(
            "/api/v1/internal/test/approve-trainer",
            new { tenantId = Guid.NewGuid() });

        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ApproveTrainer_WithBadKey_Returns401()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", "wrong");

        var res = await client.PostAsJsonAsync(
            "/api/v1/internal/test/approve-trainer",
            new { tenantId = Guid.NewGuid() });

        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ApproveTrainer_WithValidKey_SetsIsApprovedTrue()
    {
        var tenantId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            db.Trainers.Add(new Trainer
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CelvoGuardUserId = Guid.NewGuid(),
                DisplayName = "Test Trainer",
                IsApproved = false,
                IsActive = true,
            });
            await db.SaveChangesAsync();
        }

        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", InternalTestFactory.InternalKey);

        var res = await client.PostAsJsonAsync(
            "/api/v1/internal/test/approve-trainer",
            new { tenantId });

        res.StatusCode.Should().Be(HttpStatusCode.NoContent);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            var trainer = await db.Trainers.SingleAsync(t => t.TenantId == tenantId);
            trainer.IsApproved.Should().BeTrue();
        }
    }

    [Fact]
    public async Task Cleanup_WithValidKey_RemovesTenantData()
    {
        var tenantId = Guid.NewGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            db.Trainers.Add(new Trainer
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CelvoGuardUserId = Guid.NewGuid(),
                DisplayName = "Cleanup Target",
                IsApproved = true,
                IsActive = true,
            });
            await db.SaveChangesAsync();
        }

        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", InternalTestFactory.InternalKey);

        var res = await client.DeleteAsync(
            $"/api/v1/internal/test/cleanup?tenantId={tenantId}");

        res.StatusCode.Should().Be(HttpStatusCode.NoContent);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<KondixDbContext>();
            var still = await db.Trainers.AnyAsync(t => t.TenantId == tenantId);
            still.Should().BeFalse();
        }
    }
}

public sealed class InternalTestFactory : WebApplicationFactory<Program>
{
    public const string InternalKey = "integration-test-internal-key";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Testing:InternalApiKey", InternalKey);

        builder.ConfigureServices(services =>
        {
            var descriptor = services.Single(d =>
                d.ServiceType == typeof(DbContextOptions<KondixDbContext>));
            services.Remove(descriptor);

            services.AddDbContext<KondixDbContext>(options =>
                options.UseInMemoryDatabase($"Kondix-{Guid.NewGuid()}"));
        });
    }
}
