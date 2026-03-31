using CelvoGym.Api.Extensions;
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
        var tenantId = (Guid)HttpContext.Items[ContextKeys.TenantId]!;
        var userId = HttpContext.GetUserIdFromSession();

        var result = await mediator.Send(new SetupTrainerCommand(
            tenantId, userId, request.DisplayName, request.Bio), ct);

        return Created($"/api/v1/onboarding/trainer/{result.Id}", result);
    }
}

public sealed record SetupTrainerRequest(string DisplayName, string? Bio);
