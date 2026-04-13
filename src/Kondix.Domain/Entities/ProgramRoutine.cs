using CelvoGym.Domain.Common;

namespace CelvoGym.Domain.Entities;

public class ProgramRoutine : BaseEntity
{
    public Guid ProgramId { get; set; }
    public Guid RoutineId { get; set; }
    public string? Label { get; set; }
    public int SortOrder { get; set; }

    public Program Program { get; set; } = null!;
    public Routine Routine { get; set; } = null!;
}
