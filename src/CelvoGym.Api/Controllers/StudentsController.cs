using CelvoGym.Api.Extensions;
using CelvoGym.Application.Commands.Students;
using CelvoGym.Application.Queries.Students;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using QRCoder;

namespace CelvoGym.Api.Controllers;

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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeactivateStudentCommand(id, HttpContext.GetTrainerId()), ct);
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
}

public sealed record InviteStudentRequest(string Email, string? FirstName);
