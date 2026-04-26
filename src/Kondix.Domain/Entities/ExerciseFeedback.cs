using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class ExerciseFeedback : BaseEntity
{
    public Guid SessionId { get; set; }
    public Guid ExerciseId { get; set; }
    public int ActualRpe { get; set; }
    public string? Notes { get; set; }

    public WorkoutSession Session { get; set; } = null!;
    public Exercise Exercise { get; set; } = null!;
}
