namespace Kondix.Domain.Common;

public interface IAuditableEntity
{
    DateTimeOffset UpdatedAt { get; set; }
}
