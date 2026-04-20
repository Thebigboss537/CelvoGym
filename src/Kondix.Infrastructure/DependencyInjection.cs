using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Interfaces;
using Kondix.Infrastructure.Persistence;
using Kondix.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Kondix.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment? environment = null)
    {
        // Skip Npgsql DbContext registration in Testing environment so the
        // WebApplicationFactory can substitute InMemory without provider conflicts.
        if (environment is null || !environment.IsEnvironment("Testing"))
        {
            services.AddDbContext<KondixDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                    .UseSnakeCaseNamingConvention());
        }

        services.AddScoped<IKondixDbContext>(sp => sp.GetRequiredService<KondixDbContext>());

        services.AddHttpClient<IEmailService, ResendEmailService>();
        services.AddSingleton<IStorageService, MinioStorageService>();

        return services;
    }
}
