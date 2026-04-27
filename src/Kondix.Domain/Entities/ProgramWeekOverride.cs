using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class ProgramWeekOverride : BaseEntity
{
    public Guid ProgramId { get; set; }
    public int WeekIndex { get; set; }      // 1-based
    public string Notes { get; set; } = string.Empty;

    public Program Program { get; set; } = null!;
}
