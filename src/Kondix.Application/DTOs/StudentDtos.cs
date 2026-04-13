namespace Kondix.Application.DTOs;

public sealed record StudentDto(
    Guid Id,
    string DisplayName,
    string? AvatarUrl,
    bool IsActive,
    DateTimeOffset CreatedAt);

public sealed record StudentInvitationDto(
    Guid Id,
    string Email,
    string? FirstName,
    string Token,
    DateTimeOffset ExpiresAt,
    bool IsAccepted,
    DateTimeOffset CreatedAt);

public sealed record InvitationInfoDto(
    string TrainerName,
    string? TrainerAvatarUrl,
    string Email,
    Guid TenantId);
