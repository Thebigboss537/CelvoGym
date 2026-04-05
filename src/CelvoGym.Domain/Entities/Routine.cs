using CelvoGym.Domain.Common;

namespace CelvoGym.Domain.Entities;

public class Routine : BaseEntity
{
    public Guid TrainerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public List<string> Tags { get; set; } = [];
    public string? Category { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Trainer Trainer { get; set; } = null!;
    public ICollection<Day> Days { get; set; } = [];
}
