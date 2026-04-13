using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class Student : BaseEntity
{
    public Guid CelvoGuardUserId { get; set; }
    public Guid? ActiveTrainerId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset UpdatedAt { get; set; }

    public Trainer? ActiveTrainer { get; set; }
    public ICollection<TrainerStudent> TrainerStudents { get; set; } = [];
    public ICollection<ProgramAssignment> ProgramAssignments { get; set; } = [];
    public ICollection<WorkoutSession> WorkoutSessions { get; set; } = [];
    public ICollection<SetLog> SetLogs { get; set; } = [];
}
