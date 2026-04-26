using Kondix.Api.Internal;
using Kondix.Application.Commands.Onboarding;
using Kondix.Application.Queries.Trainers;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/internal/trainers")]
public class InternalTrainersController(IMediator mediator, IConfiguration config) : ControllerBase
{
    private bool AuthorizeInternal() =>
        InternalAuth.IsAuthorized(Request, config, "Internal:ApiKey");

    [HttpGet("pending")]
    public async Task<IActionResult> ListPending(CancellationToken ct)
    {
        if (!AuthorizeInternal()) return Unauthorized();
        var result = await mediator.Send(new ListPendingTrainersQuery(), ct);
        return Ok(result);
    }

    [HttpPost("{trainerId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid trainerId, CancellationToken ct)
    {
        if (!AuthorizeInternal()) return Unauthorized();
        try
        {
            var result = await mediator.Send(new ApproveTrainerCommand(trainerId), ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex) when (ex.Message == ApproveTrainerCommand.TrainerNotFoundMessage)
        {
            return NotFound(new { error = "trainer not found" });
        }
    }
}
