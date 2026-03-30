using System.Text.Json;
using CelvoGym.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Api.Middleware;

public sealed class TrainerContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ICelvoGymDbContext db)
    {
        var session = context.Items["Session"] as Dictionary<string, object>;
        if (session is null)
        {
            context.Response.StatusCode = 401;
            return;
        }

        if (!session.TryGetValue("tenantId", out var tenantIdObj)
            || !Guid.TryParse(tenantIdObj is JsonElement je ? je.GetString() : tenantIdObj?.ToString(), out var tenantId))
        {
            context.Response.StatusCode = 401;
            return;
        }

        context.Items["TenantId"] = tenantId;

        var trainer = await db.Trainers
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TenantId == tenantId && t.IsActive);

        if (trainer is not null)
        {
            if (!trainer.IsApproved)
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { error = "Trainer account pending approval" });
                return;
            }

            context.Items["TrainerId"] = trainer.Id;
        }
        else if (!context.Request.Path.StartsWithSegments("/api/v1/onboarding"))
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { error = "Trainer profile not found. Complete setup first." });
            return;
        }

        if (session.TryGetValue("permissions", out var permObj) && permObj is JsonElement permElement)
        {
            var permissions = permElement.EnumerateArray().Select(x => x.GetString()!).ToList();
            context.Items["Permissions"] = permissions;
        }

        await next(context);
    }
}
