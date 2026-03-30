namespace CelvoGym.Application.DTOs;

public sealed record TrainerDto(
    Guid Id,
    string DisplayName,
    string? Bio,
    string? AvatarUrl,
    bool IsApproved,
    DateTimeOffset CreatedAt);
