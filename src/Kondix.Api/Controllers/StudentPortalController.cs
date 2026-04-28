using Kondix.Api.Extensions;
using Kondix.Application.Commands.Comments;
using Kondix.Application.Commands.Progress;
using Kondix.Application.Commands.Body;
using Kondix.Application.Commands.Sessions;
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Application.Queries.Analytics;
using Kondix.Application.Queries.Body;
using Kondix.Application.Queries.Comments;
using Kondix.Application.Commands.PersonalRecords;
using Kondix.Application.Queries.PersonalRecords;
using Kondix.Application.Queries.Sessions;
using Kondix.Application.Queries.StudentPortal;
using Kondix.Domain.Enums;
using MediatR;
using static Kondix.Domain.Enums.MeasurementType;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/public/my")]
public class StudentPortalController(IMediator mediator, IKondixDbContext db) : ControllerBase
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
        var result = await mediator.Send(new StartSessionCommand(studentId, request.RoutineId, request.DayId, request.RecoversPlannedDate), ct);
        return Ok(result);
    }

    [HttpPost("sessions/{id:guid}/complete")]
    public async Task<IActionResult> CompleteSession(Guid id, [FromBody] CompleteSessionRequest? request, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new CompleteSessionCommand(id, studentId, request?.Notes, request?.Mood), ct);
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
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var result = await mediator.Send(new GetNextWorkoutQuery(studentId, today), ct);
        return Ok(result);
    }

    [HttpGet("missed-sessions")]
    public async Task<IActionResult> GetMissedSession(CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        var result = await mediator.Send(new GetMissedSessionQuery(studentId), ct);
        return result is null ? NoContent() : Ok(result);
    }

    [HttpGet("comments")]
    public async Task<IActionResult> GetComments(
        [FromQuery] Guid routineId,
        [FromQuery] Guid dayId,
        CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        // TODO Phase 5: restore ProgramRoutines ownership check via v3 ProgramSlot structure.
        var hasAssignment = await db.ProgramAssignments
            .AnyAsync(pa => pa.StudentId == studentId
                && pa.Status == Domain.Enums.ProgramAssignmentStatus.Active, ct);
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

    [HttpPatch("sets/{setLogId:guid}/note")]
    public async Task<IActionResult> UpdateSetNote(Guid setLogId, [FromBody] UpdateSetNoteRequest request, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        await mediator.Send(new UpdateSetNoteCommand(studentId, setLogId, request.Note), ct);
        return NoContent();
    }

    [HttpPost("sessions/{id:guid}/exercise-feedback")]
    public async Task<IActionResult> UpsertExerciseFeedback(Guid id, [FromBody] UpsertExerciseFeedbackRequest request, CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();
        await mediator.Send(new UpsertExerciseFeedbackCommand(studentId, id, request.ExerciseId, request.ActualRpe, request.Notes), ct);
        return NoContent();
    }
}

public sealed record StartSessionRequest(Guid RoutineId, Guid DayId, DateOnly? RecoversPlannedDate = null);
public sealed record CompleteSessionRequest(string? Notes, MoodType? Mood);
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
public sealed record UpdateSetNoteRequest(string? Note);
public sealed record UpsertExerciseFeedbackRequest(Guid ExerciseId, int ActualRpe, string? Notes);
