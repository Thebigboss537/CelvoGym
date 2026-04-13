using Kondix.Api.Extensions;
using Kondix.Application.Queries.Analytics;
using Kondix.Application.Queries.Body;
using Kondix.Application.Queries.PersonalRecords;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/analytics")]
public class AnalyticsController(IMediator mediator) : ControllerBase
{
    [HttpGet("student/{studentId:guid}/overview")]
    public async Task<IActionResult> GetStudentOverview(Guid studentId, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetStudentOverviewQuery(studentId, HttpContext.GetTrainerId()), ct);
        return Ok(result);
    }

    [HttpGet("student/{studentId:guid}/exercise")]
    public async Task<IActionResult> GetExerciseProgress(Guid studentId, [FromQuery] string name, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetExerciseProgressQuery(studentId, name), ct);
        return Ok(result);
    }

    [HttpGet("student/{studentId:guid}/records")]
    public async Task<IActionResult> GetStudentRecords(Guid studentId, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetPersonalRecordsQuery(studentId), ct);
        return Ok(result);
    }

    [HttpGet("student/{studentId:guid}/body-metrics")]
    public async Task<IActionResult> GetStudentBodyMetrics(Guid studentId, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetBodyMetricsQuery(studentId), ct);
        return Ok(result);
    }

    [HttpGet("student/{studentId:guid}/progress-photos")]
    public async Task<IActionResult> GetStudentProgressPhotos(Guid studentId, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        var result = await mediator.Send(new GetProgressPhotosQuery(studentId), ct);
        return Ok(result);
    }
}
