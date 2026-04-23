using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class Exercise : BaseEntity
{
    public Guid BlockId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? Tempo { get; set; }
    public Guid? CatalogExerciseId { get; set; }
    public int SortOrder { get; set; }

    public ExerciseBlock Block { get; set; } = null!;
    public CatalogExercise? CatalogExercise { get; set; }
    public ICollection<ExerciseSet> Sets { get; set; } = [];
}
