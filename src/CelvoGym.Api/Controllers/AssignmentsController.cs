using CelvoGym.Api.Extensions;
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
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetAssignmentsQuery(HttpContext.GetTrainerId()), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAssignmentRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new CreateAssignmentCommand(HttpContext.GetTrainerId(), request.RoutineId, request.StudentId), ct);
        return Created($"/api/v1/assignments/{result.Id}", result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeactivateAssignmentCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }
}

public sealed record CreateAssignmentRequest(Guid RoutineId, Guid StudentId);
