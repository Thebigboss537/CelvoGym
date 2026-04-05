using CelvoGym.Api.Extensions;
using CelvoGym.Application.Commands.Templates;
using CelvoGym.Application.Queries.Templates;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CelvoGym.Api.Controllers;

[ApiController]
[Route("api/v1/assignments")]
public class AssignmentsController(IMediator mediator) : ControllerBase
{
    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates(CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetTemplatesQuery(HttpContext.GetTrainerId()), ct);
        return Ok(result);
    }

    [HttpPost("templates")]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new CreateTemplateCommand(
            HttpContext.GetTrainerId(), request.Name, request.ProgramId,
            request.ScheduledDays, request.DurationWeeks, request.Mode), ct);
        return Created($"/api/v1/assignments/templates/{result.Id}", result);
    }

    [HttpDelete("templates/{id:guid}")]
    public async Task<IActionResult> DeleteTemplate(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeleteTemplateCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }
}

public sealed record CreateTemplateRequest(
    string Name,
    Guid ProgramId,
    List<int> ScheduledDays,
    int? DurationWeeks = null,
    string? Mode = null);
