using CelvoGym.Domain.Common;
using CelvoGym.Domain.Enums;

namespace CelvoGym.Domain.Entities;

public class Comment : BaseEntity
{
    public Guid RoutineId { get; set; }
    public Guid DayId { get; set; }
    public Guid? ExerciseId { get; set; }
    public Guid AuthorId { get; set; }
    public AuthorType AuthorType { get; set; }
    public string Text { get; set; } = string.Empty;
}
