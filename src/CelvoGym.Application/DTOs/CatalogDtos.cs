using CelvoGym.Domain.Enums;

namespace CelvoGym.Application.DTOs;

public sealed record CatalogExerciseDto(
    Guid Id,
    string Name,
    string? MuscleGroup,
    VideoSource VideoSource,
    string? VideoUrl,
    string? Notes,
    DateTimeOffset UpdatedAt);
