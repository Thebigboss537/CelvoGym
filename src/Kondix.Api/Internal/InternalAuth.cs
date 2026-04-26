using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Kondix.Api.Internal;

/// <summary>
/// Shared X-Internal-Key validation for internal-only endpoints. Reads the
/// expected key from configuration. Returns true if the request carries a
/// matching header. Used by InternalTestController (Dev/Testing only) and
/// InternalTrainersController (always registered).
/// </summary>
public static class InternalAuth
{
    public static bool IsAuthorized(HttpRequest request, IConfiguration config, string keyPath)
    {
        var expected = config[keyPath];
        if (string.IsNullOrEmpty(expected)) return false;
        var provided = request.Headers["X-Internal-Key"].ToString();
        return !string.IsNullOrEmpty(provided) && provided == expected;
    }
}
