using CelvoGym.Api.Extensions;
using CelvoGym.Application.Commands.ProgramAssignments;
using CelvoGym.Application.Queries.ProgramAssignments;
using CelvoGym.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CelvoGym.Api.Controllers;

[ApiController]
[Route("api/v1/program-assignments")]
public class ProgramAssignmentsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetProgramAssignmentsQuery(HttpContext.GetTrainerId()), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] AssignProgramRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var mode = Enum.Parse<ProgramAssignmentMode>(request.Mode, ignoreCase: true);
        var fixedSchedule = request.FixedSchedule?.Select(fs => new FixedScheduleInput(fs.RoutineId, fs.Days)).ToList();

        var result = await mediator.Send(new AssignProgramCommand(
            HttpContext.GetTrainerId(), request.ProgramId, request.StudentId,
            mode, request.TrainingDays, fixedSchedule, request.StartDate), ct);

        return Created($"/api/v1/program-assignments/{result.Id}", result);
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkAssign([FromBody] BulkAssignProgramRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var mode = Enum.Parse<ProgramAssignmentMode>(request.Mode, ignoreCase: true);
        var fixedSchedule = request.FixedSchedule?.Select(fs => new FixedScheduleInput(fs.RoutineId, fs.Days)).ToList();

        var result = await mediator.Send(new BulkAssignProgramCommand(
            HttpContext.GetTrainerId(), request.ProgramId, request.StudentIds,
            mode, request.TrainingDays, fixedSchedule, request.StartDate), ct);

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new CancelProgramAssignmentCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new CompleteProgramAssignmentCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }
}

public sealed record AssignProgramRequest(
    Guid ProgramId,
    Guid StudentId,
    string Mode,
    List<int>? TrainingDays = null,
    List<FixedScheduleEntryRequest>? FixedSchedule = null,
    DateOnly? StartDate = null);

public sealed record BulkAssignProgramRequest(
    Guid ProgramId,
    List<Guid> StudentIds,
    string Mode,
    List<int>? TrainingDays = null,
    List<FixedScheduleEntryRequest>? FixedSchedule = null,
    DateOnly? StartDate = null);

public sealed record FixedScheduleEntryRequest(Guid RoutineId, List<int> Days);
