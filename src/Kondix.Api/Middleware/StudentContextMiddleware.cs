using Kondix.Api.Extensions;
using Kondix.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Api.Middleware;

public sealed class StudentContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IKondixDbContext db)
    {
        var session = context.Items[ContextKeys.Session] as Dictionary<string, object>;
        if (session is null)
        {
            context.Response.StatusCode = 401;
            return;
        }

        var userId = session.GetGuid("userId");
        if (userId is null)
        {
            context.Response.StatusCode = 401;
            return;
        }

        var student = await db.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.CelvoGuardUserId == userId.Value && s.IsActive);

        if (student is null)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { error = "Student profile not found" });
            return;
        }

        context.Items[ContextKeys.StudentId] = student.Id;
        context.Items[ContextKeys.StudentUserId] = userId.Value;
        context.Items[ContextKeys.StudentName] = student.DisplayName;

        session.ExtractPermissionsTo(context);

        await next(context);
    }
}
