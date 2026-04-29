using Kondix.Domain.Common;

namespace Kondix.Domain.Entities;

public class ProgramWeek : BaseEntity
{
    public Guid ProgramId { get; set; }
    public int WeekIndex { get; set; }
    public string Label { get; set; } = string.Empty;

    public Program Program { get; set; } = null!;
    public ICollection<ProgramSlot> Slots { get; set; } = [];
}
