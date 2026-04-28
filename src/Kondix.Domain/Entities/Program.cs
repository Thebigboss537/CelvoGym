using Kondix.Domain.Common;
using Kondix.Domain.Enums;

namespace Kondix.Domain.Entities;

public class Program : BaseEntity, IAuditableEntity
{
    public Guid TrainerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public ProgramObjective Objective { get; set; } = ProgramObjective.Otro;
    public ProgramLevel Level { get; set; } = ProgramLevel.Todos;
    public ProgramMode Mode { get; set; } = ProgramMode.Fixed;
    public ProgramScheduleType ScheduleType { get; set; } = ProgramScheduleType.Week;
    public int? DaysPerWeek { get; set; }
    public bool IsPublished { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Trainer Trainer { get; set; } = null!;
    public ICollection<ProgramWeek> Weeks { get; set; } = [];
    public ICollection<ProgramAssignment> Assignments { get; set; } = [];
}
