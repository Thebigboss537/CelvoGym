using CelvoGym.Api.Extensions;
using CelvoGym.Application.Commands.Assignments;
using CelvoGym.Application.Commands.Templates;
using CelvoGym.Application.Queries.Assignments;
using CelvoGym.Application.Queries.Templates;
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
        var result = await mediator.Send(new CreateAssignmentCommand(
            HttpContext.GetTrainerId(), request.RoutineId, request.StudentId,
            request.ScheduledDays, request.ProgramId, request.StartDate), ct);
        return Created($"/api/v1/assignments/{result.Id}", result);
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkCreate([FromBody] BulkCreateAssignmentRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new BulkCreateAssignmentCommand(
            HttpContext.GetTrainerId(), request.RoutineId, request.StudentIds,
            request.ScheduledDays, request.ProgramId, request.StartDate), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeactivateAssignmentCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }

    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates(CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetTemplatesQuery(HttpContext.GetTrainerId()), ct);
        return Ok(result);
    }

    [HttpPost("templates")]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new CreateTemplateCommand(
            HttpContext.GetTrainerId(), request.Name, request.ProgramId,
            request.RoutineId, request.ScheduledDays, request.DurationWeeks), ct);
        return Created($"/api/v1/assignments/templates/{result.Id}", result);
    }

    [HttpDelete("templates/{id:guid}")]
    public async Task<IActionResult> DeleteTemplate(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeleteTemplateCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }
}

public sealed record CreateAssignmentRequest(
    Guid RoutineId,
    Guid StudentId,
    List<int>? ScheduledDays = null,
    Guid? ProgramId = null,
    DateOnly? StartDate = null);

public sealed record BulkCreateAssignmentRequest(
    Guid RoutineId,
    List<Guid> StudentIds,
    List<int>? ScheduledDays = null,
    Guid? ProgramId = null,
    DateOnly? StartDate = null);

public sealed record CreateTemplateRequest(
    string Name,
    Guid? ProgramId = null,
    Guid? RoutineId = null,
    List<int> ScheduledDays = default!,
    int? DurationWeeks = null);
