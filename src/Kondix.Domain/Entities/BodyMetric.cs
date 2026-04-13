using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class BodyMetric : BaseEntity
{
    public Guid StudentId { get; set; }
    public DateOnly RecordedAt { get; set; }
    public decimal? Weight { get; set; }
    public decimal? BodyFat { get; set; }
    public string? Notes { get; set; }

    public Student Student { get; set; } = null!;
    public ICollection<BodyMeasurement> Measurements { get; set; } = [];
}
