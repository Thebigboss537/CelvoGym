using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class PersonalRecord : BaseEntity
{
    public Guid StudentId { get; set; }
    public string ExerciseName { get; set; } = string.Empty;
    public string Weight { get; set; } = string.Empty;
    public string? Reps { get; set; }
    public DateTimeOffset AchievedAt { get; set; }
    public Guid SessionId { get; set; }

    public Student Student { get; set; } = null!;
    public WorkoutSession Session { get; set; } = null!;
}
