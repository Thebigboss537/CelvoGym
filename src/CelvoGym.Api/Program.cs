using CelvoGym.Api.Middleware;
using CelvoGym.Application;
using CelvoGym.Infrastructure;
using CelvoGym.Infrastructure.Persistence;
using CelvoGuard.Client;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, config) => config
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    builder.Services.AddApplicationServices();
    builder.Services.AddInfrastructureServices(builder.Configuration);

    builder.Services.AddCelvoGuard(options =>
    {
        options.AppSlug = "celvogym";
        options.RedisConnection = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
        options.JwtSigningKey = builder.Configuration["CelvoGuard:SigningKey"]!;
        options.JwtIssuer = builder.Configuration["CelvoGuard:Issuer"] ?? "guard.celvo.dev";
        options.PublicPaths =
        [
            "/api/v1/health"
        ];
    });

    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(
                new System.Text.Json.Serialization.JsonStringEnumConverter());
        });
    builder.Services.AddOpenApi();

    builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
        o.MultipartBodyLengthLimit = 50 * 1024 * 1024); // 50MB for video uploads

    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? ["http://localhost:4200"];
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    });

    var app = builder.Build();

    // Auto-migrate on startup
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CelvoGymDbContext>();
        await dbContext.Database.MigrateAsync();
    }

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference(options =>
        {
            options.WithTitle("CelvoGym API");
            options.WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
        });
    }

    // Security headers
    app.Use(async (context, next) =>
    {
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        await next();
    });

    app.UseCors();

    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
            var exLogger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            exLogger.LogError(exception, "Unhandled exception");

            context.Response.ContentType = "application/json";

            var (statusCode, message) = exception switch
            {
                ValidationException ve => (400, string.Join("; ", ve.Errors.Select(e => e.ErrorMessage))),
                UnauthorizedAccessException ue => (401, ue.Message),
                InvalidOperationException ioe => (400, ioe.Message),
                _ => (500, "An unexpected error occurred")
            };

            context.Response.StatusCode = statusCode;
            await context.Response.WriteAsJsonAsync(new { error = message });
        });
    });

    // CelvoGuard + TrainerContext + CSRF for operator endpoints (trainer)
    app.UseWhen(
        ctx => ctx.Request.Path.StartsWithSegments("/api/v1")
               && !ctx.Request.Path.StartsWithSegments("/api/v1/public")
               && !ctx.Request.Path.StartsWithSegments("/api/v1/health"),
        branch =>
        {
            branch.UseMiddleware<CelvoGuardMiddleware>();
            branch.UseMiddleware<TrainerContextMiddleware>();
            branch.UseMiddleware<CsrfValidationMiddleware>();
        }
    );

    // CelvoGuard + StudentContext for authenticated student endpoints
    app.UseWhen(
        ctx => ctx.Request.Path.StartsWithSegments("/api/v1/public/my"),
        branch =>
        {
            branch.UseMiddleware<CelvoGuardMiddleware>();
            branch.UseMiddleware<StudentContextMiddleware>();
        }
    );

    app.MapControllers();

    await app.RunAsync();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    await Log.CloseAndFlushAsync();
}

public partial class Program;
