using Kondix.Api.Extensions;
using Kondix.Application.Commands.Programs;
using Kondix.Application.DTOs;
using Kondix.Application.Queries.Programs;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/programs")]
public class ProgramsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetProgramsQuery(HttpContext.GetTrainerId()), ct);
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
        var routines = request.Routines.Select(r => new CreateProgramRoutineInput(r.RoutineId, r.Label)).ToList();
        var result = await mediator.Send(new CreateProgramCommand(
            HttpContext.GetTrainerId(), request.Name, request.Description, request.DurationWeeks, routines), ct);
        return Created($"/api/v1/programs/{result.Id}", result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateProgramRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var routines = request.Routines.Select(r => new CreateProgramRoutineInput(r.RoutineId, r.Label)).ToList();
        var result = await mediator.Send(new UpdateProgramCommand(
            id, HttpContext.GetTrainerId(), request.Name, request.Description, request.DurationWeeks, routines), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeleteProgramCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/week-overrides")]
    public async Task<IActionResult> GetWeekOverrides(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetProgramWeekOverridesQuery(id), ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}/week-overrides/{weekIndex:int}")]
    public async Task<IActionResult> UpsertWeekOverride(
        Guid id,
        int weekIndex,
        [FromBody] UpsertWeekOverrideRequest request,
        CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new UpsertProgramWeekOverrideCommand(id, weekIndex, request.Notes), ct);
        return NoContent();
    }
}

public sealed record CreateProgramRequest(
    string Name,
    string? Description,
    int DurationWeeks,
    List<ProgramRoutineRequest> Routines);

public sealed record ProgramRoutineRequest(
    Guid RoutineId,
    string? Label);

public sealed record UpsertWeekOverrideRequest(string Notes);
