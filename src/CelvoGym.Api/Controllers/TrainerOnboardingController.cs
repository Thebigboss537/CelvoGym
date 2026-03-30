using System.Text.Json;
using CelvoGym.Application.Commands.Onboarding;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CelvoGym.Api.Controllers;

[ApiController]
[Route("api/v1/onboarding")]
public class TrainerOnboardingController(IMediator mediator) : ControllerBase
{
    [HttpPost("trainer/setup")]
    public async Task<IActionResult> Setup([FromBody] SetupTrainerRequest request, CancellationToken ct)
    {
        var tenantId = GetTenantId();
        var userId = GetUserId();

        var result = await mediator.Send(new SetupTrainerCommand(
            tenantId, userId, request.DisplayName, request.Bio), ct);

        return Created($"/api/v1/onboarding/trainer/{result.Id}", result);
    }

    private Guid GetTenantId()
    {
        return (Guid)(HttpContext.Items["TenantId"]
            ?? throw new UnauthorizedAccessException("TenantId not found in context"));
    }

    private Guid GetUserId()
    {
        var session = HttpContext.Items["Session"] as Dictionary<string, object>;
        if (session is null || !session.TryGetValue("userId", out var userIdObj))
            throw new UnauthorizedAccessException("UserId not found in session");

        return Guid.TryParse(userIdObj is JsonElement je ? je.GetString() : userIdObj?.ToString(), out var userId)
            ? userId
            : throw new UnauthorizedAccessException("Invalid UserId in session");
    }
}

public sealed record SetupTrainerRequest(string DisplayName, string? Bio);
