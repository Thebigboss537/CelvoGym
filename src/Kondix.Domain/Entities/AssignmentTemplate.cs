using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class AssignmentTemplate : BaseEntity
{
    public Guid TrainerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? ProgramId { get; set; }
    public List<int> ScheduledDays { get; set; } = [];
    public int? DurationWeeks { get; set; }

    public Trainer Trainer { get; set; } = null!;
    public Program? Program { get; set; }
}
