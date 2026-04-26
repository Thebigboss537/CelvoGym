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
    List<ExerciseBlockDto> Blocks);

public sealed record ExerciseBlockDto(
    Guid Id,
    BlockType? BlockType,
    int RestSeconds,
    List<ExerciseDto> Exercises);

public sealed record ExerciseDto(
    Guid Id,
    string Name,
    string? Notes,
    string? Tempo,
    Guid? CatalogExerciseId,
    // Media below is projected from the linked catalog entry when served via
    // GET — write paths return nulls here; the client already has the catalog
    // loaded and can merge if needed.
    VideoSource VideoSource,
    string? VideoUrl,
    string? ImageUrl,
    string? MuscleGroup,
    List<ExerciseSetDto> Sets);

public sealed record ExerciseSetDto(
    Guid Id,
    SetType SetType,
    string? TargetReps,
    string? TargetWeight,
    int? TargetRpe,
    int? RestSeconds);

public sealed record RoutineUsageDto(
    int ActiveProgramCount,
    int ActiveAssignmentCount,
    bool HasSessions);
