using Kondix.Application.Commands.Students;
using Kondix.Application.Common.Interfaces;
using Kondix.Application.Queries.Invitations;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/public")]
public class PublicController(IMediator mediator, IKondixDbContext db) : ControllerBase
{
    [HttpGet("trainer/{tenantId:guid}/manifest.webmanifest")]
    [ResponseCache(Duration = 3600)]
    public async Task<IActionResult> GetManifest(Guid tenantId, CancellationToken ct)
    {
        var trainer = await db.Trainers
            .Where(t => t.TenantId == tenantId && t.IsActive && t.IsApproved)
            .Select(t => new { t.DisplayName, t.Bio })
            .FirstOrDefaultAsync(ct);

        var name = trainer?.DisplayName ?? "Kondix";
        var bio = trainer?.Bio;
        var manifest = new
        {
            name = $"{name} \u2014 Kondix",
            short_name = name.Length > 12 ? name[..12].TrimEnd() : name,
            start_url = $"/auth/login?t={tenantId}",
            scope = "/",
            display = "standalone",
            background_color = "#09090B",
            theme_color = "#E62639",
            orientation = "portrait",
            categories = new[] { "fitness", "health" },
            description = bio is not null ? bio[..Math.Min(bio.Length, 100)] : "Tu progreso, tu fuerza.",
            icons = new[]
            {
                new { src = "/icons/icon-192.png", sizes = "192x192", type = "image/png", purpose = "any" },
                new { src = "/icons/icon-512.png", sizes = "512x512", type = "image/png", purpose = "any" },
                new { src = "/icons/icon-maskable-512.png", sizes = "512x512", type = "image/png", purpose = "maskable" }
            }
        };

        return new JsonResult(manifest) { ContentType = "application/manifest+json" };
    }

    [HttpGet("invite/{token}")]
    public async Task<IActionResult> ValidateInvitation(string token, CancellationToken ct)
    {
        var result = await mediator.Send(new ValidateInvitationQuery(token), ct);
        return Ok(result);
    }

    [HttpPost("invite/{token}/accept")]
    public async Task<IActionResult> AcceptInvitation(
        string token,
        [FromBody] AcceptInvitationRequest request,
        CancellationToken ct)
    {
        var result = await mediator.Send(new AcceptInvitationCommand(
            token, request.CelvoGuardUserId, request.DisplayName), ct);
        return Ok(result);
    }
}

public sealed record AcceptInvitationRequest(Guid CelvoGuardUserId, string DisplayName);
