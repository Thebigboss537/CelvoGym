using CelvoGym.Application.Commands.Routines;
using CelvoGym.Application.Queries.Routines;
using CelvoGym.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CelvoGym.Api.Controllers;

[ApiController]
[Route("api/v1/routines")]
public class RoutinesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        RequirePermission("gym:manage");
        var trainerId = GetTrainerId();
        var result = await mediator.Send(new GetRoutinesQuery(trainerId), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        RequirePermission("gym:manage");
        var trainerId = GetTrainerId();
        var result = await mediator.Send(new GetRoutineByIdQuery(id, trainerId), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoutineRequest request, CancellationToken ct)
    {
        RequirePermission("gym:manage");
        var trainerId = GetTrainerId();

        var days = request.Days.Select(d => new CreateDayInput(
            d.Name,
            d.Groups.Select(g => new CreateExerciseGroupInput(
                g.GroupType,
                g.RestSeconds,
                g.Exercises.Select(e => new CreateExerciseInput(
                    e.Name, e.Notes, e.VideoSource, e.VideoUrl, e.Tempo,
                    e.Sets.Select(s => new CreateExerciseSetInput(
                        s.SetType, s.TargetReps, s.TargetWeight, s.TargetRpe, s.RestSeconds
                    )).ToList()
                )).ToList()
            )).ToList()
        )).ToList();

        var result = await mediator.Send(new CreateRoutineCommand(trainerId, request.Name, request.Description, days), ct);
        return Created($"/api/v1/routines/{result.Id}", result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateRoutineRequest request, CancellationToken ct)
    {
        RequirePermission("gym:manage");
        var trainerId = GetTrainerId();

        var days = request.Days.Select(d => new CreateDayInput(
            d.Name,
            d.Groups.Select(g => new CreateExerciseGroupInput(
                g.GroupType,
                g.RestSeconds,
                g.Exercises.Select(e => new CreateExerciseInput(
                    e.Name, e.Notes, e.VideoSource, e.VideoUrl, e.Tempo,
                    e.Sets.Select(s => new CreateExerciseSetInput(
                        s.SetType, s.TargetReps, s.TargetWeight, s.TargetRpe, s.RestSeconds
                    )).ToList()
                )).ToList()
            )).ToList()
        )).ToList();

        var result = await mediator.Send(new UpdateRoutineCommand(id, trainerId, request.Name, request.Description, days), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        RequirePermission("gym:manage");
        var trainerId = GetTrainerId();
        await mediator.Send(new DeleteRoutineCommand(id, trainerId), ct);
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

public sealed record CreateRoutineRequest(
    string Name,
    string? Description,
    List<DayRequest> Days);

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
