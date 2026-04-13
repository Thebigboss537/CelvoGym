using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class SetLog : BaseEntity
{
    public Guid SessionId { get; set; }
    public Guid StudentId { get; set; }
    public Guid? SetId { get; set; }
    public Guid RoutineId { get; set; }
    public bool Completed { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public string? ActualWeight { get; set; }
    public string? ActualReps { get; set; }
    public int? ActualRpe { get; set; }
    public string? SnapshotExerciseName { get; set; }
    public string? SnapshotTargetWeight { get; set; }
    public string? SnapshotTargetReps { get; set; }

    public WorkoutSession Session { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public ExerciseSet? Set { get; set; }
}
