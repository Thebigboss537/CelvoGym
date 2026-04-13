using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Domain.Interfaces;
using CelvoGym.Infrastructure.Persistence;
using CelvoGym.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CelvoGym.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<CelvoGymDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                .UseSnakeCaseNamingConvention());

        services.AddScoped<ICelvoGymDbContext>(sp => sp.GetRequiredService<CelvoGymDbContext>());

        services.AddHttpClient<IEmailService, ResendEmailService>();
        services.AddSingleton<IStorageService, MinioStorageService>();

        return services;
    }
}
