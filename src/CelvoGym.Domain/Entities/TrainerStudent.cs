using CelvoGym.Domain.Common;

namespace CelvoGym.Domain.Entities;

public class TrainerStudent : BaseEntity
{
    public Guid TrainerId { get; set; }
    public Guid StudentId { get; set; }
    public bool IsActive { get; set; } = true;

    public Trainer Trainer { get; set; } = null!;
    public Student Student { get; set; } = null!;
}
