using CelvoGym.Domain.Common;
using CelvoGym.Domain.Enums;

namespace CelvoGym.Domain.Entities;

public class ExerciseGroup : BaseEntity
{
    public Guid DayId { get; set; }
    public GroupType GroupType { get; set; } = GroupType.Single;
    public int RestSeconds { get; set; }
    public int SortOrder { get; set; }

    public Day Day { get; set; } = null!;
    public ICollection<Exercise> Exercises { get; set; } = [];
}
