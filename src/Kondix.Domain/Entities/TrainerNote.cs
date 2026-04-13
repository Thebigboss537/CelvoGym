using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class TrainerNote : BaseEntity
{
    public Guid TrainerId { get; set; }
    public Guid StudentId { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsPinned { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Trainer Trainer { get; set; } = null!;
    public Student Student { get; set; } = null!;
}
