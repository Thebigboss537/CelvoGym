using CelvoGym.Domain.Common;
using CelvoGym.Domain.Enums;

namespace CelvoGym.Domain.Entities;

public class BodyMeasurement : BaseEntity
{
    public Guid BodyMetricId { get; set; }
    public MeasurementType Type { get; set; }
    public decimal Value { get; set; }

    public BodyMetric BodyMetric { get; set; } = null!;
}
