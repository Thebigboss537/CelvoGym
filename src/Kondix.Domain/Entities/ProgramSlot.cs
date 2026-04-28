using Kondix.Domain.Common;
using Kondix.Domain.Enums;

namespace Kondix.Domain.Entities;

public class ProgramSlot : BaseEntity
{
    public Guid WeekId { get; set; }
    public int DayIndex { get; set; }
    public ProgramSlotKind Kind { get; set; } = ProgramSlotKind.Empty;
    public Guid? RoutineId { get; set; }
    public Guid? DayId { get; set; }
    public Guid? BlockId { get; set; }

    public ProgramWeek Week { get; set; } = null!;
    public Routine? Routine { get; set; }
    public Day? Day { get; set; }
}
