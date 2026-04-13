using Kondix.Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromServices] IKondixDbContext db, CancellationToken ct)
    {
        try { await db.Database.CanConnectAsync(ct); }
        catch { return StatusCode(503, new { status = "unhealthy" }); }
        return Ok(new { status = "healthy", timestamp = DateTimeOffset.UtcNow });
    }
}
