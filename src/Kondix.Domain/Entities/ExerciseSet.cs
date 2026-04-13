using Kondix.Domain.Common;
using Kondix.Domain.Enums;

namespace Kondix.Domain.Entities;

public class ExerciseSet : BaseEntity
{
    public Guid ExerciseId { get; set; }
    public SetType SetType { get; set; } = SetType.Effective;
    public string? TargetReps { get; set; }
    public string? TargetWeight { get; set; }
    public int? TargetRpe { get; set; }
    public int? RestSeconds { get; set; }
    public int SortOrder { get; set; }

    public Exercise Exercise { get; set; } = null!;
    public ICollection<SetLog> SetLogs { get; set; } = [];
}
