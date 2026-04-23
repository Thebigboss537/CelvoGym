using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class Day : BaseEntity
{
    public Guid RoutineId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public Routine Routine { get; set; } = null!;
    public ICollection<ExerciseBlock> Blocks { get; set; } = [];
}
