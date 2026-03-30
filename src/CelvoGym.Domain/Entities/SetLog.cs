using CelvoGym.Domain.Common;

namespace CelvoGym.Domain.Entities;

public class SetLog : BaseEntity
{
    public Guid StudentId { get; set; }
    public Guid SetId { get; set; }
    public Guid RoutineId { get; set; }
    public bool Completed { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public string? ActualWeight { get; set; }
    public string? ActualReps { get; set; }
    public int? ActualRpe { get; set; }

    public Student Student { get; set; } = null!;
    public ExerciseSet Set { get; set; } = null!;
}
