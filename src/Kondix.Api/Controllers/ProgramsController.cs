using Kondix.Api.Extensions;
using Kondix.Application.Commands.Programs;
using Kondix.Application.DTOs;
using Kondix.Application.Queries.Programs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/programs")]
public class ProgramsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] ProgramObjective? objective,
        [FromQuery] ProgramLevel? level,
        [FromQuery] bool? published,
        [FromQuery] string? query,
        CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetProgramsQuery(
            HttpContext.GetTrainerId(), objective, level, published, query), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetProgramByIdQuery(id, HttpContext.GetTrainerId()), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProgramRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var id = await mediator.Send(new CreateProgramCommand(
            HttpContext.GetTrainerId(),
            request.Name, request.Description,
            request.Objective, request.Level, request.Mode, request.ScheduleType,
            request.DaysPerWeek, request.DurationWeeks), ct);
        return Created($"/api/v1/programs/{id}", new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProgramRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new UpdateProgramCommand(
            id, HttpContext.GetTrainerId(),
            request.Name, request.Description, request.Notes,
            request.Objective, request.Level, request.Mode), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeleteProgramCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }
}

public sealed record CreateProgramRequest(
    string Name,
    string? Description,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode,
    ProgramScheduleType ScheduleType,
    int? DaysPerWeek,
    int DurationWeeks);

public sealed record UpdateProgramRequest(
    string Name,
    string? Description,
    string? Notes,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode);
