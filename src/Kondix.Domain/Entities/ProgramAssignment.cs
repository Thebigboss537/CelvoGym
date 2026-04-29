using Kondix.Domain.Common;
using Kondix.Domain.Enums;

namespace Kondix.Domain.Entities;

public class ProgramAssignment : BaseEntity, IAuditableEntity
{
    public Guid TrainerId { get; set; }
    public Guid StudentId { get; set; }
    public Guid ProgramId { get; set; }
    public DateTimeOffset StartDate { get; set; }
    public ProgramAssignmentStatus Status { get; set; } = ProgramAssignmentStatus.Active;
    public DateTimeOffset UpdatedAt { get; set; }

    public Trainer Trainer { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Program Program { get; set; } = null!;
}
