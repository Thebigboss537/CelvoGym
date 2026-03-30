using CelvoGym.Application.Commands.Students;
using CelvoGym.Application.Queries.Students;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CelvoGym.Api.Controllers;

[ApiController]
[Route("api/v1/students")]
public class StudentsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        RequirePermission("gym:manage");
        var trainerId = GetTrainerId();
        var result = await mediator.Send(new GetStudentsQuery(trainerId), ct);
        return Ok(result);
    }

    [HttpPost("invite")]
    public async Task<IActionResult> Invite([FromBody] InviteStudentRequest request, CancellationToken ct)
    {
        RequirePermission("gym:manage");
        var trainerId = GetTrainerId();
        var result = await mediator.Send(new InviteStudentCommand(trainerId, request.Email, request.FirstName), ct);
        return Created($"/api/v1/students/{result.Id}", result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        RequirePermission("gym:manage");
        var trainerId = GetTrainerId();
        await mediator.Send(new DeactivateStudentCommand(id, trainerId), ct);
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

public sealed record InviteStudentRequest(string Email, string? FirstName);
