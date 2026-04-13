using Kondix.Api.Extensions;
using Kondix.Application.Commands.Routines;
using Kondix.Application.Queries.Routines;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/routines")]
public class RoutinesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetRoutinesQuery(HttpContext.GetTrainerId()), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetRoutineByIdQuery(id, HttpContext.GetTrainerId()), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoutineRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var days = MapDays(request.Days);
        var result = await mediator.Send(new CreateRoutineCommand(HttpContext.GetTrainerId(), request.Name, request.Description, days, request.Tags, request.Category), ct);
        return Created($"/api/v1/routines/{result.Id}", result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateRoutineRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var days = MapDays(request.Days);
        var result = await mediator.Send(new UpdateRoutineCommand(id, HttpContext.GetTrainerId(), request.Name, request.Description, days, request.Tags, request.Category), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeleteRoutineCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/duplicate")]
    public async Task<IActionResult> Duplicate(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new DuplicateRoutineCommand(id, HttpContext.GetTrainerId()), ct);
        return Created($"/api/v1/routines/{result.Id}", result);
    }

    private static List<CreateDayInput> MapDays(List<DayRequest> days)
        => days.Select(d => new CreateDayInput(
            d.Name,
            d.Groups.Select(g => new CreateExerciseGroupInput(
                g.GroupType, g.RestSeconds,
                g.Exercises.Select(e => new CreateExerciseInput(
                    e.Name, e.Notes, e.VideoSource, e.VideoUrl, e.Tempo,
                    e.Sets.Select(s => new CreateExerciseSetInput(
                        s.SetType, s.TargetReps, s.TargetWeight, s.TargetRpe, s.RestSeconds
                    )).ToList()
                )).ToList()
            )).ToList()
        )).ToList();
}

public sealed record CreateRoutineRequest(
    string Name,
    string? Description,
    List<DayRequest> Days,
    List<string>? Tags = null,
    string? Category = null);

public sealed record DayRequest(
    string Name,
    List<ExerciseGroupRequest> Groups);

public sealed record ExerciseGroupRequest(
    GroupType GroupType,
    int RestSeconds,
    List<ExerciseRequest> Exercises);

public sealed record ExerciseRequest(
    string Name,
    string? Notes,
    VideoSource VideoSource,
    string? VideoUrl,
    string? Tempo,
    List<ExerciseSetRequest> Sets);

public sealed record ExerciseSetRequest(
    SetType SetType,
    string? TargetReps,
    string? TargetWeight,
    int? TargetRpe,
    int? RestSeconds);
