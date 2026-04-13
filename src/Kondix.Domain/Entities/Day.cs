using CelvoGym.Domain.Common;

namespace CelvoGym.Domain.Entities;

public class Day : BaseEntity
{
    public Guid RoutineId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public Routine Routine { get; set; } = null!;
    public ICollection<ExerciseGroup> ExerciseGroups { get; set; } = [];
}
