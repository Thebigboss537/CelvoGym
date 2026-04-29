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

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new PublishProgramCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/duplicate")]
    public async Task<IActionResult> Duplicate(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var newId = await mediator.Send(new DuplicateProgramCommand(id, HttpContext.GetTrainerId()), ct);
        return Created($"/api/v1/programs/{newId}", new { id = newId });
    }

    [HttpPost("{id:guid}/weeks")]
    public async Task<IActionResult> AddWeek(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new AddWeekCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/weeks/{weekIndex:int}/duplicate")]
    public async Task<IActionResult> DuplicateWeek(Guid id, int weekIndex, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DuplicateWeekCommand(id, HttpContext.GetTrainerId(), weekIndex), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}/weeks/{weekIndex:int}")]
    public async Task<IActionResult> DeleteWeek(Guid id, int weekIndex, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeleteWeekCommand(id, HttpContext.GetTrainerId(), weekIndex), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/weeks/{weekIndex:int}/slots/{dayIndex:int}")]
    public async Task<IActionResult> SetSlot(Guid id, int weekIndex, int dayIndex,
        [FromBody] SetSlotRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new SetSlotCommand(id, HttpContext.GetTrainerId(), weekIndex, dayIndex, request.Kind), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/assign-routine")]
    public async Task<IActionResult> AssignRoutine(Guid id,
        [FromBody] AssignRoutineRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var blockId = await mediator.Send(new AssignRoutineToProgramCommand(
            id, HttpContext.GetTrainerId(),
            request.RoutineId, request.Weeks, request.Mapping, request.DayIds), ct);
        return Ok(new { blockId });
    }

    [HttpDelete("{id:guid}/blocks/{blockId:guid}")]
    public async Task<IActionResult> RemoveBlock(Guid id, Guid blockId, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new RemoveBlockCommand(id, HttpContext.GetTrainerId(), blockId), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/fill-rest")]
    public async Task<IActionResult> FillRest(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new FillRestCommand(id, HttpContext.GetTrainerId()), ct);
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

public sealed record SetSlotRequest(ProgramSlotKind Kind);

public sealed record AssignRoutineRequest(
    Guid RoutineId,
    IReadOnlyList<int> Weeks,
    IReadOnlyDictionary<Guid, int>? Mapping,
    IReadOnlyList<Guid>? DayIds);
