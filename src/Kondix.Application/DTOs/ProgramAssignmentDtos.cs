using Kondix.Domain.Enums;

namespace Kondix.Application.DTOs;

// Phase 6 will rewrite assignment DTOs for v3 shape
public sealed record ProgramAssignmentSummaryDto(
    Guid Id,
    Guid StudentId,
    string StudentName,
    Guid ProgramId,
    string ProgramName,
    DateTimeOffset StartDate,
    ProgramAssignmentStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

// Kept for backward compat with handlers not yet stubbed (Phase 5/6 will replace)
public sealed record ProgramAssignmentDto(
    Guid Id,
    Guid ProgramId,
    string ProgramName,
    Guid StudentId,
    string StudentName,
    string Mode,
    string Status,
    List<int> TrainingDays,
    string StartDate,
    string EndDate,
    int CurrentWeek,
    int TotalWeeks,
    DateTimeOffset CreatedAt);

public sealed record FixedScheduleEntryDto(
    Guid RoutineId,
    string RoutineName,
    List<int> Days);

public sealed record FixedScheduleInput(
    Guid RoutineId,
    List<int> Days);

public sealed record MyProgramDto(
    Guid ProgramId,
    string ProgramName,
    string? Description,
    string Mode,
    string Status,
    int CurrentWeek,
    int TotalWeeks,
    List<StudentRoutineListDto> Routines,
    string StartDate,
    string EndDate);
