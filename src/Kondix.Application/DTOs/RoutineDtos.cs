using Kondix.Domain.Enums;

namespace Kondix.Application.DTOs;

public sealed record RoutineListDto(
    Guid Id,
    string Name,
    string? Description,
    int DayCount,
    int ExerciseCount,
    List<string> Tags,
    string? Category,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record RoutineDetailDto(
    Guid Id,
    string Name,
    string? Description,
    List<DayDto> Days,
    List<string> Tags,
    string? Category,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record DayDto(
    Guid Id,
    string Name,
    List<ExerciseGroupDto> Groups);

public sealed record ExerciseGroupDto(
    Guid Id,
    GroupType GroupType,
    int RestSeconds,
    List<ExerciseDto> Exercises);

public sealed record ExerciseDto(
    Guid Id,
    string Name,
    string? Notes,
    VideoSource VideoSource,
    string? VideoUrl,
    string? Tempo,
    List<ExerciseSetDto> Sets);

public sealed record ExerciseSetDto(
    Guid Id,
    SetType SetType,
    string? TargetReps,
    string? TargetWeight,
    int? TargetRpe,
    int? RestSeconds);
