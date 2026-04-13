using System.Text.Json;

namespace CelvoGym.Api.Extensions;

public static class HttpContextExtensions
{
    public static Guid GetTrainerId(this HttpContext context)
        => (Guid)(context.Items[ContextKeys.TrainerId]
            ?? throw new InvalidOperationException("Trainer profile not found"));

    public static Guid GetStudentId(this HttpContext context)
        => (Guid)(context.Items[ContextKeys.StudentId]
            ?? throw new InvalidOperationException("Student profile not found"));

    public static Guid GetUserIdFromSession(this HttpContext context)
    {
        var session = context.GetSession();
        return session.GetGuid("userId")
            ?? throw new UnauthorizedAccessException("UserId not found in session");
    }

    public static string GetUserEmailFromSession(this HttpContext context)
    {
        var session = context.GetSession();
        return session.GetString("email") ?? "Unknown";
    }

    public static void RequirePermission(this HttpContext context, string permission)
    {
        var permissions = context.Items[ContextKeys.Permissions] as List<string>;
        if (permissions is null || !permissions.Contains(permission))
            throw new UnauthorizedAccessException($"Missing permission: {permission}");
    }

    public static Dictionary<string, object> GetSession(this HttpContext context)
        => context.Items[ContextKeys.Session] as Dictionary<string, object>
            ?? throw new UnauthorizedAccessException("Session not found");
}

public static class SessionExtensions
{
    public static Guid? GetGuid(this Dictionary<string, object> session, string key)
    {
        if (!session.TryGetValue(key, out var obj)) return null;
        var str = obj is JsonElement je ? je.GetString() : obj?.ToString();
        return Guid.TryParse(str, out var result) ? result : null;
    }

    public static string? GetString(this Dictionary<string, object> session, string key)
    {
        if (!session.TryGetValue(key, out var obj)) return null;
        return obj is JsonElement je ? je.GetString() : obj?.ToString();
    }

    public static void ExtractPermissionsTo(this Dictionary<string, object> session, HttpContext context)
    {
        if (session.TryGetValue("permissions", out var permObj) && permObj is JsonElement permElement)
        {
            context.Items[ContextKeys.Permissions] = permElement.EnumerateArray()
                .Select(x => x.GetString()!).ToList();
        }
    }
}

public static class ContextKeys
{
    public const string TrainerId = "TrainerId";
    public const string TenantId = "TenantId";
    public const string Session = "Session";
    public const string Permissions = "Permissions";
    public const string StudentId = "StudentId";
    public const string StudentUserId = "StudentUserId";
    public const string StudentName = "StudentName";
}

public static class Permissions
{
    public const string GymManage = "gym:manage";
    public const string GymWorkout = "gym:workout";
}
