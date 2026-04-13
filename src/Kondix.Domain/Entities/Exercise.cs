using Kondix.Domain.Common;
using Kondix.Domain.Enums;

namespace Kondix.Domain.Entities;

public class Exercise : BaseEntity
{
    public Guid GroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public VideoSource VideoSource { get; set; } = VideoSource.None;
    public string? VideoUrl { get; set; }
    public string? Tempo { get; set; }
    public Guid? CatalogExerciseId { get; set; }
    public int SortOrder { get; set; }

    public ExerciseGroup Group { get; set; } = null!;
    public CatalogExercise? CatalogExercise { get; set; }
    public ICollection<ExerciseSet> Sets { get; set; } = [];
}
