using Kondix.Domain.Common;
using Kondix.Domain.Enums;

namespace Kondix.Domain.Entities;

public class CatalogExercise : BaseEntity
{
    public Guid TrainerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? MuscleGroup { get; set; }
    public VideoSource VideoSource { get; set; } = VideoSource.None;
    public string? VideoUrl { get; set; }
    public string? ImageUrl { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset UpdatedAt { get; set; }

    public Trainer Trainer { get; set; } = null!;
}
