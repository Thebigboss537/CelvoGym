using CelvoGym.Domain.Common;

namespace CelvoGym.Domain.Entities;

public class Trainer : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid CelvoGuardUserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsApproved { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<TrainerStudent> TrainerStudents { get; set; } = [];
    public ICollection<Routine> Routines { get; set; } = [];
    public ICollection<StudentInvitation> Invitations { get; set; } = [];
}
