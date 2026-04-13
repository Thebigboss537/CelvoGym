using CelvoGym.Domain.Common;
using CelvoGym.Domain.Enums;

namespace CelvoGym.Domain.Entities;

public class ProgramAssignment : BaseEntity
{
    public Guid ProgramId { get; set; }
    public Guid StudentId { get; set; }
    public ProgramAssignmentMode Mode { get; set; }
    public List<int> TrainingDays { get; set; } = [];
    public string? FixedScheduleJson { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public ProgramAssignmentStatus Status { get; set; } = ProgramAssignmentStatus.Active;
    public DateTimeOffset? CompletedAt { get; set; }
    public int RotationIndex { get; set; }

    public Program Program { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public ICollection<WorkoutSession> WorkoutSessions { get; set; } = [];
}
