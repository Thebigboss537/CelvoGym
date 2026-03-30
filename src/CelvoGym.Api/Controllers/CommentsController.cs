using System.Text.Json;
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
        RequirePermission("gym:manage");
        var result = await mediator.Send(new GetCommentsQuery(routineId, dayId), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> AddComment([FromBody] CreateCommentRequest request, CancellationToken ct)
    {
        RequirePermission("gym:manage");
        var trainerUserId = GetTrainerUserId();
        var trainerName = GetTrainerName();

        var result = await mediator.Send(new CreateCommentCommand(
            request.RoutineId, request.DayId, request.ExerciseId,
            trainerUserId, AuthorType.Trainer, trainerName, request.Text), ct);

        return Created($"/api/v1/comments/{result.Id}", result);
    }

    private Guid GetTrainerUserId()
    {
        var session = HttpContext.Items["Session"] as Dictionary<string, object>;
        if (session is null || !session.TryGetValue("userId", out var userIdObj))
            throw new UnauthorizedAccessException("UserId not found");

        return Guid.TryParse(userIdObj is JsonElement je ? je.GetString() : userIdObj?.ToString(), out var userId)
            ? userId
            : throw new UnauthorizedAccessException("Invalid UserId");
    }

    private string GetTrainerName()
    {
        var session = HttpContext.Items["Session"] as Dictionary<string, object>;
        if (session is not null && session.TryGetValue("email", out var emailObj))
        {
            var email = emailObj is JsonElement je ? je.GetString() : emailObj?.ToString();
            if (!string.IsNullOrEmpty(email)) return email;
        }
        return "Entrenador";
    }

    private void RequirePermission(string permission)
    {
        var permissions = HttpContext.Items["Permissions"] as List<string>;
        if (permissions is null || !permissions.Contains(permission))
            throw new UnauthorizedAccessException($"Missing permission: {permission}");
    }
}

public sealed record CreateCommentRequest(Guid RoutineId, Guid DayId, Guid? ExerciseId, string Text);
