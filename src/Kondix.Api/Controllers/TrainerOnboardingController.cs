using Kondix.Api.Extensions;
using Kondix.Application.Commands.Onboarding;
using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1")]
public class TrainerController(IMediator mediator, IKondixDbContext db) : ControllerBase
{
    [HttpPost("onboarding/trainer/setup")]
    public async Task<IActionResult> Setup([FromBody] SetupTrainerRequest request, CancellationToken ct)
    {
        var tenantId = (Guid)HttpContext.Items[ContextKeys.TenantId]!;
        var userId = HttpContext.GetUserIdFromSession();

        var result = await mediator.Send(new SetupTrainerCommand(
            tenantId, userId, request.DisplayName, request.Bio), ct);

        return Created($"/api/v1/onboarding/trainer/{result.Id}", result);
    }

    [HttpGet("onboarding/trainer/status")]
    public async Task<IActionResult> Status(CancellationToken ct)
    {
        var tenantId = (Guid)HttpContext.Items[ContextKeys.TenantId]!;

        var trainer = await db.Trainers
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TenantId == tenantId && t.IsActive, ct);

        if (trainer is null)
            return Ok(new { status = "no_profile" });

        if (!trainer.IsApproved)
            return Ok(new { status = "pending_approval", displayName = trainer.DisplayName });

        return Ok(new { status = "active", trainerId = trainer.Id });
    }

    [HttpGet("trainer/me")]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var trainerId = HttpContext.GetTrainerId();

        var trainer = await db.Trainers
            .AsNoTracking()
            .Where(t => t.Id == trainerId)
            .Select(t => new { t.Id, t.TenantId, t.DisplayName, t.AvatarUrl })
            .FirstAsync(ct);

        return Ok(trainer);
    }
}

public sealed record SetupTrainerRequest(string DisplayName, string? Bio);
