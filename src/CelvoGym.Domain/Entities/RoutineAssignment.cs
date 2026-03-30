using CelvoGym.Domain.Common;

namespace CelvoGym.Domain.Entities;

public class RoutineAssignment : BaseEntity
{
    public Guid RoutineId { get; set; }
    public Guid StudentId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? DeactivatedAt { get; set; }

    public Routine Routine { get; set; } = null!;
    public Student Student { get; set; } = null!;
}
