using CelvoGym.Domain.Common;

namespace CelvoGym.Domain.Entities;

public class Program : BaseEntity
{
    public Guid TrainerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationWeeks { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset UpdatedAt { get; set; }

    public Trainer Trainer { get; set; } = null!;
    public ICollection<ProgramRoutine> ProgramRoutines { get; set; } = [];
}
