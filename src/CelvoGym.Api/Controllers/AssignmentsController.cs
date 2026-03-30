using CelvoGym.Application.Commands.Assignments;
using CelvoGym.Application.Queries.Assignments;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CelvoGym.Api.Controllers;

[ApiController]
[Route("api/v1/assignments")]
public class AssignmentsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        RequirePermission("gym:manage");
        var trainerId = GetTrainerId();
        var result = await mediator.Send(new GetAssignmentsQuery(trainerId), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAssignmentRequest request, CancellationToken ct)
    {
        RequirePermission("gym:manage");
        var trainerId = GetTrainerId();
        var result = await mediator.Send(new CreateAssignmentCommand(trainerId, request.RoutineId, request.StudentId), ct);
        return Created($"/api/v1/assignments/{result.Id}", result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        RequirePermission("gym:manage");
        var trainerId = GetTrainerId();
        await mediator.Send(new DeactivateAssignmentCommand(id, trainerId), ct);
        return NoContent();
    }

    private Guid GetTrainerId()
    {
        return (Guid)(HttpContext.Items["TrainerId"]
            ?? throw new InvalidOperationException("Trainer profile not found"));
    }

    private void RequirePermission(string permission)
    {
        var permissions = HttpContext.Items["Permissions"] as List<string>;
        if (permissions is null || !permissions.Contains(permission))
            throw new UnauthorizedAccessException($"Missing permission: {permission}");
    }
}

public sealed record CreateAssignmentRequest(Guid RoutineId, Guid StudentId);
