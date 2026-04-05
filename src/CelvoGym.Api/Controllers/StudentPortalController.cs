using CelvoGym.Api.Extensions;
using CelvoGym.Application.Commands.Comments;
using CelvoGym.Application.Commands.Progress;
using CelvoGym.Application.Commands.Body;
using CelvoGym.Application.Commands.Sessions;
using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Application.Queries.Analytics;
using CelvoGym.Application.Queries.Body;
using CelvoGym.Application.Queries.Comments;
using CelvoGym.Application.Commands.PersonalRecords;
using CelvoGym.Application.Queries.PersonalRecords;
using CelvoGym.Application.Queries.Sessions;
using CelvoGym.Application.Queries.StudentPortal;
using CelvoGym.Domain.Enums;
using MediatR;
using static CelvoGym.Domain.Enums.MeasurementType;
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

    [HttpPost("sessions/start")]
    public async Task<IActionResult> StartSession([FromBody] StartSessionRequest request, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new StartSessionCommand(studentId, request.RoutineId, request.DayId), ct);
        return Ok(result);
    }

    [HttpPost("sessions/{id:guid}/complete")]
    public async Task<IActionResult> CompleteSession(Guid id, [FromBody] CompleteSessionRequest? request, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new CompleteSessionCommand(id, studentId, request?.Notes), ct);
        return Ok(result);
    }

    [HttpGet("sessions/active")]
    public async Task<IActionResult> GetActiveSession(CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new GetActiveSessionQuery(studentId), ct);
        return result is not null ? Ok(result) : NoContent();
    }

    [HttpGet("sessions/history")]
    public async Task<IActionResult> GetSessionHistory(
        [FromQuery] Guid routineId, [FromQuery] Guid dayId, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new GetSessionHistoryQuery(studentId, routineId, dayId), ct);
        return Ok(result);
    }

    [HttpGet("calendar")]
    public async Task<IActionResult> GetCalendar(
        [FromQuery] int year, [FromQuery] int month, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new GetCalendarQuery(studentId, year, month), ct);
        return Ok(result);
    }

    [HttpGet("records")]
    public async Task<IActionResult> GetRecords(CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new GetPersonalRecordsQuery(studentId), ct);
        return Ok(result);
    }

    [HttpGet("records/detect")]
    public async Task<IActionResult> DetectNewPRs([FromQuery] Guid sessionId, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new DetectNewPRsCommand(studentId, sessionId), ct);
        return Ok(result);
    }

    [HttpGet("body-metrics")]
    public async Task<IActionResult> GetBodyMetrics(CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new GetBodyMetricsQuery(studentId), ct);
        return Ok(result);
    }

    [HttpPost("body-metrics")]
    public async Task<IActionResult> CreateBodyMetric([FromBody] CreateBodyMetricRequest request, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new CreateBodyMetricCommand(
            studentId, request.RecordedAt, request.Weight, request.BodyFat, request.Notes,
            request.Measurements.Select(m => new CreateBodyMeasurementInput(m.Type, m.Value)).ToList()), ct);
        return Created($"/api/v1/public/my/body-metrics/{result.Id}", result);
    }

    [HttpGet("progress-photos")]
    public async Task<IActionResult> GetProgressPhotos(CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new GetProgressPhotosQuery(studentId), ct);
        return Ok(result);
    }

    [HttpGet("analytics/exercise")]
    public async Task<IActionResult> GetExerciseProgress([FromQuery] string name, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new GetExerciseProgressQuery(studentId, name), ct);
        return Ok(result);
    }

    [HttpPost("sets/toggle")]
    public async Task<IActionResult> ToggleSet([FromBody] ToggleSetRequest request, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new ToggleSetCommand(studentId, request.SessionId, request.SetId, request.RoutineId), ct);
        return Ok(result);
    }

    [HttpPost("sets/update")]
    public async Task<IActionResult> UpdateSetData([FromBody] UpdateSetDataRequest request, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new UpdateSetDataCommand(
            studentId, request.SessionId, request.SetId, request.RoutineId,
            request.Weight, request.Reps, request.Rpe), ct);
        return Ok(result);
    }

    [HttpGet("program")]
    public async Task<IActionResult> GetMyProgram(CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new GetMyProgramQuery(studentId), ct);
        return result is not null ? Ok(result) : NoContent();
    }

    [HttpGet("next-workout")]
    public async Task<IActionResult> GetNextWorkout(CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new GetNextWorkoutQuery(studentId), ct);
        return result is not null ? Ok(result) : NoContent();
    }

    [HttpGet("comments")]
    public async Task<IActionResult> GetComments(
        [FromQuery] Guid routineId,
        [FromQuery] Guid dayId,
        CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var hasAssignment = await db.ProgramAssignments
            .AnyAsync(pa => pa.StudentId == studentId
                && pa.Status == Domain.Enums.ProgramAssignmentStatus.Active
                && pa.Program.ProgramRoutines.Any(pr => pr.RoutineId == routineId), ct);
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

public sealed record StartSessionRequest(Guid RoutineId, Guid DayId);
public sealed record CompleteSessionRequest(string? Notes);
public sealed record ToggleSetRequest(Guid SessionId, Guid SetId, Guid RoutineId);
public sealed record UpdateSetDataRequest(Guid SessionId, Guid SetId, Guid RoutineId, string? Weight, string? Reps, int? Rpe);
public sealed record CreateStudentCommentRequest(Guid RoutineId, Guid DayId, Guid? ExerciseId, string Text);
public sealed record CreateBodyMetricRequest(
    DateOnly RecordedAt,
    decimal? Weight,
    decimal? BodyFat,
    string? Notes,
    List<BodyMeasurementRequest> Measurements);
public sealed record BodyMeasurementRequest(MeasurementType Type, decimal Value);
