using CelvoGym.Api.Extensions;
using CelvoGym.Application.Commands.Comments;
using CelvoGym.Application.Queries.Comments;
using CelvoGym.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CelvoGym.Api.Controllers;

[ApiController]
[Route("api/v1/comments")]
public class CommentsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetComments(
        [FromQuery] Guid routineId,
        [FromQuery] Guid dayId,
        CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetCommentsQuery(routineId, dayId), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> AddComment([FromBody] CreateCommentRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var trainerUserId = HttpContext.GetUserIdFromSession();
        var trainerName = HttpContext.GetUserEmailFromSession();

        var result = await mediator.Send(new CreateCommentCommand(
            request.RoutineId, request.DayId, request.ExerciseId,
            trainerUserId, AuthorType.Trainer, trainerName, request.Text), ct);

        return Created($"/api/v1/comments/{result.Id}", result);
    }
}

public sealed record CreateCommentRequest(Guid RoutineId, Guid DayId, Guid? ExerciseId, string Text);
