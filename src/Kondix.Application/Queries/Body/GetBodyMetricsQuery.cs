using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Body;

public sealed record GetBodyMetricsQuery(
    Guid StudentId) : IRequest<List<BodyMetricDto>>;

public sealed class GetBodyMetricsHandler(IKondixDbContext db)
    : IRequestHandler<GetBodyMetricsQuery, List<BodyMetricDto>>
{
    public async Task<List<BodyMetricDto>> Handle(GetBodyMetricsQuery request, CancellationToken cancellationToken)
    {
        return await db.BodyMetrics
            .AsNoTracking()
            .Include(bm => bm.Measurements)
            .Where(bm => bm.StudentId == request.StudentId)
            .OrderByDescending(bm => bm.RecordedAt)
            .Select(bm => new BodyMetricDto(
                bm.Id, bm.RecordedAt, bm.Weight, bm.BodyFat, bm.Notes,
                bm.Measurements.Select(m => new BodyMeasurementDto(m.Type, m.Value)).ToList()))
            .ToListAsync(cancellationToken);
    }
}
