using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using MediatR;

namespace Kondix.Application.Commands.Body;

public sealed record CreateBodyMetricCommand(
    Guid StudentId,
    DateOnly RecordedAt,
    decimal? Weight,
    decimal? BodyFat,
    string? Notes,
    List<CreateBodyMeasurementInput> Measurements) : IRequest<BodyMetricDto>;

public sealed class CreateBodyMetricHandler(IKondixDbContext db)
    : IRequestHandler<CreateBodyMetricCommand, BodyMetricDto>
{
    public async Task<BodyMetricDto> Handle(CreateBodyMetricCommand request, CancellationToken cancellationToken)
    {
        var metric = new BodyMetric
        {
            StudentId = request.StudentId,
            RecordedAt = request.RecordedAt,
            Weight = request.Weight,
            BodyFat = request.BodyFat,
            Notes = request.Notes
        };

        foreach (var m in request.Measurements)
        {
            metric.Measurements.Add(new BodyMeasurement
            {
                Type = m.Type,
                Value = m.Value
            });
        }

        db.BodyMetrics.Add(metric);
        await db.SaveChangesAsync(cancellationToken);

        return new BodyMetricDto(metric.Id, metric.RecordedAt, metric.Weight, metric.BodyFat, metric.Notes,
            metric.Measurements.Select(m => new BodyMeasurementDto(m.Type, m.Value)).ToList());
    }
}
