namespace Kondix.Application.DTOs;

public sealed record UpdateSetDataResponse(SetLogDto SetLog, NewPrDto? NewPr);

public sealed record WorkoutSessionDto(
    Guid Id,
    Guid RoutineId,
    Guid DayId,
    DateTimeOffset StartedAt,
    DateTimeOffset? CompletedAt,
    string? Notes);

public sealed record SessionSummaryDto(
    Guid Id,
    string Date,
    string DayName,
    string Status,
    int CompletedSets,
    int TotalSets,
    int? DurationMinutes);

public sealed record CalendarMonthDto(
    List<CalendarDayDto> Sessions,
    List<int> SuggestedDays,
    ActiveProgramDto? ActiveProgram);

public sealed record CalendarDayDto(
    string Date,
    string DayName,
    string Status,
    Guid SessionId,
    int CompletedSets,
    int TotalSets,
    int? DurationMinutes,
    bool IsRecovery);

public sealed record ActiveProgramDto(
    string Name,
    int CurrentWeek,
    int TotalWeeks,
    string Mode,
    string Status);
