using Kondix.Domain.Common;
using Kondix.Domain.Enums;

namespace Kondix.Domain.Entities;

public class WorkoutSession : BaseEntity
{
    public Guid StudentId { get; set; }
    public Guid? ProgramAssignmentId { get; set; }
    public Guid RoutineId { get; set; }
    public Guid DayId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public string? Notes { get; set; }
    public MoodType? Mood { get; set; }
    public DateTimeOffset? FeedbackReviewedAt { get; set; }
    public bool IsRecovery { get; set; } = false;
    public Guid? RecoversSessionId { get; set; }
    public WorkoutSession? RecoversSession { get; set; }

    public Student Student { get; set; } = null!;
    public ProgramAssignment? ProgramAssignment { get; set; }
    public Routine Routine { get; set; } = null!;
    public Day Day { get; set; } = null!;
    public ICollection<SetLog> SetLogs { get; set; } = [];
}
