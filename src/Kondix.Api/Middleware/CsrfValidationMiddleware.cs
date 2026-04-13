namespace Kondix.Api.Middleware;

public sealed class CsrfValidationMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> MutatingMethods = ["POST", "PUT", "DELETE", "PATCH"];

    public async Task InvokeAsync(HttpContext context)
    {
        if (MutatingMethods.Contains(context.Request.Method))
        {
            var csrfCookie = context.Request.Cookies["cg-csrf-celvogym"];
            var csrfHeader = context.Request.Headers["X-CSRF-Token"].FirstOrDefault();

            if (string.IsNullOrEmpty(csrfCookie) || string.IsNullOrEmpty(csrfHeader) || csrfCookie != csrfHeader)
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { error = "CSRF validation failed" });
                return;
            }
        }

        await next(context);
    }
}
