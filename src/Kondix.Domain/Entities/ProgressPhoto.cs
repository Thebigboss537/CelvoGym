using CelvoGym.Domain.Common;
using CelvoGym.Domain.Enums;

namespace CelvoGym.Domain.Entities;

public class ProgressPhoto : BaseEntity
{
    public Guid StudentId { get; set; }
    public DateOnly TakenAt { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    public PhotoAngle Angle { get; set; }
    public string? Notes { get; set; }

    public Student Student { get; set; } = null!;
}
