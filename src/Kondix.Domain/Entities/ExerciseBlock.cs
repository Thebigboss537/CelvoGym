using Kondix.Domain.Common;
using Kondix.Domain.Enums;

namespace Kondix.Domain.Entities;

public class ExerciseBlock : BaseEntity
{
    public Guid DayId { get; set; }
    // null => single-exercise block (implicit "Individual"); Superset/Triset/
    // Circuit are only set when the block actually groups 2+ exercises.
    public BlockType? BlockType { get; set; }
    public int RestSeconds { get; set; }
    public int SortOrder { get; set; }

    public Day Day { get; set; } = null!;
    public ICollection<Exercise> Exercises { get; set; } = [];
}
