using Kondix.Domain.Enums;

namespace Kondix.Application.DTOs;

public sealed record ProgramSummaryDto(
    Guid Id,
    string Name,
    string? Description,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode,
    ProgramScheduleType ScheduleType,
    int? DaysPerWeek,
    int WeeksCount,
    int SessionsCount,
    int AssignedCount,
    bool IsPublished,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record ProgramDetailDto(
    Guid Id,
    string Name,
    string? Description,
    string? Notes,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode,
    ProgramScheduleType ScheduleType,
    int? DaysPerWeek,
    bool IsPublished,
    int AssignedCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    List<ProgramWeekDto> Weeks);

public sealed record ProgramWeekDto(
    Guid Id,
    int WeekIndex,
    string Label,
    List<ProgramSlotDto> Slots);

public sealed record ProgramSlotDto(
    Guid Id,
    int DayIndex,
    ProgramSlotKind Kind,
    Guid? RoutineId,
    string? RoutineName,
    Guid? DayId,
    string? DayName,
    Guid? BlockId);
