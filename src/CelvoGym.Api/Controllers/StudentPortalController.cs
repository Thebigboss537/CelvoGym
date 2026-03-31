using CelvoGym.Api.Extensions;
using CelvoGym.Application.Commands.Comments;
using CelvoGym.Application.Commands.Progress;
using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.Queries.Comments;
using CelvoGym.Application.Queries.StudentPortal;
using CelvoGym.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Api.Controllers;

[ApiController]
[Route("api/v1/public/my")]
public class StudentPortalController(IMediator mediator, ICelvoGymDbContext db) : ControllerBase
{
    [HttpGet("routines")]
    public async Task<IActionResult> GetMyRoutines(CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new GetMyRoutinesQuery(studentId), ct);
        return Ok(result);
    }

    [HttpGet("routines/{id:guid}")]
    public async Task<IActionResult> GetMyRoutineDetail(Guid id, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new GetMyRoutineDetailQuery(id, studentId), ct);
        return Ok(result);
    }

    [HttpPost("sets/toggle")]
    public async Task<IActionResult> ToggleSet([FromBody] ToggleSetRequest request, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new ToggleSetCommand(studentId, request.SetId, request.RoutineId), ct);
        return Ok(result);
    }

    [HttpPost("sets/update")]
    public async Task<IActionResult> UpdateSetData([FromBody] UpdateSetDataRequest request, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new UpdateSetDataCommand(
            studentId, request.SetId, request.RoutineId,
            request.Weight, request.Reps, request.Rpe), ct);
        return Ok(result);
    }

    [HttpGet("comments")]
    public async Task<IActionResult> GetComments(
        [FromQuery] Guid routineId,
        [FromQuery] Guid dayId,
        CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var hasAssignment = await db.RoutineAssignments
            .AnyAsync(ra => ra.RoutineId == routineId && ra.StudentId == studentId && ra.IsActive, ct);
        if (!hasAssignment) throw new InvalidOperationException("Routine not assigned to this student");

        var result = await mediator.Send(new GetCommentsQuery(routineId, dayId), ct);
        return Ok(result);
    }

    [HttpPost("comments")]
    public async Task<IActionResult> AddComment([FromBody] CreateStudentCommentRequest request, CancellationToken ct)
    {
        var studentUserId = (Guid)HttpContext.Items[ContextKeys.StudentUserId]!;
        var studentName = (string)HttpContext.Items[ContextKeys.StudentName]!;

        var result = await mediator.Send(new CreateCommentCommand(
            request.RoutineId, request.DayId, request.ExerciseId,
            studentUserId, AuthorType.Student, studentName, request.Text), ct);

        return Created($"/api/v1/public/my/comments/{result.Id}", result);
    }
}

public sealed record ToggleSetRequest(Guid SetId, Guid RoutineId);
public sealed record UpdateSetDataRequest(Guid SetId, Guid RoutineId, string? Weight, string? Reps, int? Rpe);
public sealed record CreateStudentCommentRequest(Guid RoutineId, Guid DayId, Guid? ExerciseId, string Text);
