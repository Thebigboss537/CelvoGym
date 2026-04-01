using System.Reflection;
using CelvoGym.Api.Controllers;
using CelvoGym.Application.Common;
using CelvoGym.Domain.Common;
using CelvoGym.Infrastructure.Persistence;
using NetArchTest.Rules;

namespace CelvoGym.ArchTests;

public class ArchitectureTests
{
    private static readonly Assembly DomainAssembly = typeof(BaseEntity).Assembly;
    private static readonly Assembly ApplicationAssembly = typeof(TokenHasher).Assembly;
    private static readonly Assembly InfrastructureAssembly = typeof(CelvoGymDbContext).Assembly;
    private static readonly Assembly ApiAssembly = typeof(HealthController).Assembly;

    [Fact]
    public void Domain_ShouldNotReference_Application()
    {
        var result = Types.InAssembly(DomainAssembly)
            .ShouldNot()
            .HaveDependencyOn("CelvoGym.Application")
            .GetResult();

        Assert.True(result.IsSuccessful, "Domain should not reference Application");
    }

    [Fact]
    public void Domain_ShouldNotReference_Infrastructure()
    {
        var result = Types.InAssembly(DomainAssembly)
            .ShouldNot()
            .HaveDependencyOn("CelvoGym.Infrastructure")
            .GetResult();

        Assert.True(result.IsSuccessful, "Domain should not reference Infrastructure");
    }

    [Fact]
    public void Domain_ShouldNotReference_Api()
    {
        var result = Types.InAssembly(DomainAssembly)
            .ShouldNot()
            .HaveDependencyOn("CelvoGym.Api")
            .GetResult();

        Assert.True(result.IsSuccessful, "Domain should not reference Api");
    }

    [Fact]
    public void Application_ShouldNotReference_Infrastructure()
    {
        var result = Types.InAssembly(ApplicationAssembly)
            .ShouldNot()
            .HaveDependencyOn("CelvoGym.Infrastructure")
            .GetResult();

        Assert.True(result.IsSuccessful, "Application should not reference Infrastructure");
    }

    [Fact]
    public void Application_ShouldNotReference_Api()
    {
        var result = Types.InAssembly(ApplicationAssembly)
            .ShouldNot()
            .HaveDependencyOn("CelvoGym.Api")
            .GetResult();

        Assert.True(result.IsSuccessful, "Application should not reference Api");
    }

    [Fact]
    public void Infrastructure_ShouldNotReference_Api()
    {
        var result = Types.InAssembly(InfrastructureAssembly)
            .ShouldNot()
            .HaveDependencyOn("CelvoGym.Api")
            .GetResult();

        Assert.True(result.IsSuccessful, "Infrastructure should not reference Api");
    }

    [Fact]
    public void Entities_ShouldInherit_BaseEntity()
    {
        var result = Types.InAssembly(DomainAssembly)
            .That()
            .ResideInNamespace("CelvoGym.Domain.Entities")
            .And()
            .AreClasses()
            .Should()
            .Inherit(typeof(BaseEntity))
            .GetResult();

        Assert.True(result.IsSuccessful, "All entities should inherit from BaseEntity");
    }

    [Fact]
    public void Controllers_ShouldResideIn_ControllersNamespace()
    {
        var result = Types.InAssembly(ApiAssembly)
            .That()
            .HaveNameEndingWith("Controller")
            .Should()
            .ResideInNamespace("CelvoGym.Api.Controllers")
            .GetResult();

        Assert.True(result.IsSuccessful, "All controllers should be in CelvoGym.Api.Controllers namespace");
    }
}
