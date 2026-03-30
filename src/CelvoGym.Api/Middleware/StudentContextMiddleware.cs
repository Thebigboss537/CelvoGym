using System.Text.Json;
using CelvoGym.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Api.Middleware;

public sealed class StudentContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ICelvoGymDbContext db)
    {
        var session = context.Items["Session"] as Dictionary<string, object>;
        if (session is null)
        {
            context.Response.StatusCode = 401;
            return;
        }

        if (!session.TryGetValue("userId", out var userIdObj)
            || !Guid.TryParse(userIdObj is JsonElement je ? je.GetString() : userIdObj?.ToString(), out var userId))
        {
            context.Response.StatusCode = 401;
            return;
        }

        var student = await db.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.CelvoGuardUserId == userId && s.IsActive);

        if (student is null)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { error = "Student profile not found" });
            return;
        }

        context.Items["StudentId"] = student.Id;
        context.Items["StudentUserId"] = userId;
        context.Items["StudentName"] = student.DisplayName;

        if (session.TryGetValue("permissions", out var permObj) && permObj is JsonElement permElement)
        {
            var permissions = permElement.EnumerateArray().Select(x => x.GetString()!).ToList();
            context.Items["Permissions"] = permissions;
        }

        await next(context);
    }
}
