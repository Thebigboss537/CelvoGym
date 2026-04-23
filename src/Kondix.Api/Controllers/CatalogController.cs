using Kondix.Api.Extensions;
using Kondix.Application.Commands.Catalog;
using Kondix.Application.Queries.Catalog;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/catalog")]
public class CatalogController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? q, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new SearchCatalogQuery(HttpContext.GetTrainerId(), q), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CatalogExerciseRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new CreateCatalogExerciseCommand(
            HttpContext.GetTrainerId(), request.Name, request.MuscleGroup,
            request.VideoSource, request.VideoUrl, request.ImageUrl, request.Notes), ct);
        return Created($"/api/v1/catalog/{result.Id}", result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CatalogExerciseRequest request, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new UpdateCatalogExerciseCommand(
            id, HttpContext.GetTrainerId(), request.Name, request.MuscleGroup,
            request.VideoSource, request.VideoUrl, request.ImageUrl, request.Notes), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await mediator.Send(new DeleteCatalogExerciseCommand(id, HttpContext.GetTrainerId()), ct);
        return NoContent();
    }
}

public sealed record CatalogExerciseRequest(
    string Name,
    string? MuscleGroup,
    VideoSource VideoSource = VideoSource.None,
    string? VideoUrl = null,
    string? ImageUrl = null,
    string? Notes = null);
