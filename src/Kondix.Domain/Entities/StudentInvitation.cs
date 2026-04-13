using CelvoGym.Domain.Common;

namespace CelvoGym.Domain.Entities;

public class StudentInvitation : BaseEntity
{
    public Guid TrainerId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? AcceptedAt { get; set; }
    public Guid? AcceptedByStudentId { get; set; }

    public Trainer Trainer { get; set; } = null!;
}
