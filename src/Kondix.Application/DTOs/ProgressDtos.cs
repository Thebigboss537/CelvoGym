using Kondix.Domain.Enums;

namespace Kondix.Application.DTOs;

public sealed record SetLogDto(
    Guid Id,
    Guid? SetId,
    bool Completed,
    DateTimeOffset? CompletedAt,
    string? ActualWeight,
    string? ActualReps,
    int? ActualRpe);

public sealed record ProgressSummaryDto(
    int TotalEffectiveSets,
    int CompletedEffectiveSets,
    int Percentage);

public sealed record StudentRoutineListDto(
    Guid Id,
    string Name,
    string? Description,
    int DayCount,
    ProgressSummaryDto Progress,
    DateTimeOffset UpdatedAt);

public sealed record StudentRoutineDetailDto(
    Guid Id,
    string Name,
    string? Description,
    List<StudentDayDto> Days,
    ProgressSummaryDto Progress);

public sealed record StudentDayDto(
    Guid Id,
    string Name,
    List<ExerciseGroupDto> Groups,
    List<SetLogDto> SetLogs,
    ProgressSummaryDto Progress);

public sealed record CommentDto(
    Guid Id,
    AuthorType AuthorType,
    string AuthorName,
    string Text,
    DateTimeOffset CreatedAt);
