using CelvoGym.Application.Commands.Students;
using CelvoGym.Application.Queries.Invitations;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CelvoGym.Api.Controllers;

[ApiController]
[Route("api/v1/public")]
public class PublicController(IMediator mediator) : ControllerBase
{
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
