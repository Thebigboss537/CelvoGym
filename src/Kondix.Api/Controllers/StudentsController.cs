using Kondix.Api.Extensions;
using Kondix.Application.Commands.Notes;
using Kondix.Application.Commands.Sessions;
using Kondix.Application.Commands.Students;
using Kondix.Application.Queries.Notes;
using Kondix.Application.Queries.Sessions;
using Kondix.Application.Queries.Students;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using QRCoder;
using Analytics = Kondix.Application.Queries.Analytics;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/students")]
public class StudentsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetStudentsQuery(HttpContext.GetTrainerId()), ct);
        return Ok(result);
    }

    [HttpPost("invite")]
    public async Task<IActionResult> Invite([FromBody] InviteStudentRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new InviteStudentCommand(HttpContext.GetTrainerId(), request.Email, request.FirstName), ct);
        return Created($"/api/v1/students/{result.Id}", result);
    }

    [HttpGet("{studentId:guid}/overview")]
    public async Task<IActionResult> GetOverview(Guid studentId, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetStudentOverviewQuery(HttpContext.GetTrainerId(), studentId), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeactivateStudentCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }

    [HttpGet("{studentId:guid}/notes")]
    public async Task<IActionResult> GetNotes(Guid studentId, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetNotesQuery(HttpContext.GetTrainerId(), studentId), ct);
        return Ok(result);
    }

    [HttpPost("{studentId:guid}/notes")]
    public async Task<IActionResult> CreateNote(Guid studentId, [FromBody] CreateNoteRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new CreateNoteCommand(
            HttpContext.GetTrainerId(), studentId, request.Text, request.IsPinned), ct);
        return Created($"/api/v1/students/{studentId}/notes/{result.Id}", result);
    }

    [HttpPut("{studentId:guid}/notes/{noteId:guid}")]
    public async Task<IActionResult> UpdateNote(Guid studentId, Guid noteId, [FromBody] CreateNoteRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new UpdateNoteCommand(noteId, HttpContext.GetTrainerId(), request.Text, request.IsPinned), ct);
        return Ok(result);
    }

    [HttpDelete("{studentId:guid}/notes/{noteId:guid}")]
    public async Task<IActionResult> DeleteNote(Guid studentId, Guid noteId, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeleteNoteCommand(noteId, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }

    [HttpGet("qr")]
    public IActionResult GetQr([FromQuery] string url)
    {
        HttpContext.RequirePermission(Permissions.GymManage);

        if (string.IsNullOrWhiteSpace(url))
            return BadRequest(new { error = "URL is required" });

        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.M);
        using var qrCode = new PngByteQRCode(qrCodeData);
        var pngBytes = qrCode.GetGraphic(10);

        return File(pngBytes, "image/png", "invite-qr.png");
    }

    [HttpGet("{id:guid}/sessions")]
    public async Task<IActionResult> GetSessions(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission("kondix:students:read");
        var result = await mediator.Send(
            new GetStudentSessionsForTrainerQuery(HttpContext.GetTrainerId(), id), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/recent-feedback")]
    public async Task<IActionResult> RecentFeedback(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission("kondix:students:read");
        var result = await mediator.Send(new Analytics.GetRecentFeedbackQuery(HttpContext.GetTrainerId(), id), ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/feedback/mark-read")]
    public async Task<IActionResult> MarkFeedbackRead(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission("kondix:students:read");
        await mediator.Send(new MarkFeedbackReadCommand(HttpContext.GetTrainerId(), id), ct);
        return NoContent();
    }
}

public sealed record InviteStudentRequest(string Email, string? FirstName);
public sealed record CreateNoteRequest(string Text, bool IsPinned = false);
