using CelvoGym.Api.Extensions;
using CelvoGym.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Api.Middleware;

public sealed class TrainerContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ICelvoGymDbContext db)
    {
        var session = context.Items[ContextKeys.Session] as Dictionary<string, object>;
        if (session is null)
        {
            context.Response.StatusCode = 401;
            return;
        }

        var tenantId = session.GetGuid("tenantId");
        if (tenantId is null)
        {
            context.Response.StatusCode = 401;
            return;
        }

        context.Items[ContextKeys.TenantId] = tenantId.Value;

        var trainer = await db.Trainers
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TenantId == tenantId.Value && t.IsActive);

        var isOnboarding = context.Request.Path.StartsWithSegments("/api/v1/onboarding");

        if (trainer is not null)
        {
            if (!trainer.IsApproved && !isOnboarding)
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { error = "Trainer account pending approval" });
                return;
            }

            context.Items[ContextKeys.TrainerId] = trainer.Id;
        }
        else if (!isOnboarding)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { error = "Trainer profile not found. Complete setup first." });
            return;
        }

        session.ExtractPermissionsTo(context);

        await next(context);
    }
}
