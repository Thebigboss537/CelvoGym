namespace CelvoGym.Application.DTOs;

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

public sealed record ProgramAssignmentDetailDto(
    Guid Id,
    Guid ProgramId,
    string ProgramName,
    string Mode,
    string Status,
    List<int> TrainingDays,
    List<FixedScheduleEntryDto>? FixedSchedule,
    string StartDate,
    string EndDate,
    int CurrentWeek,
    int TotalWeeks,
    List<ProgramRoutineDto> Routines,
    DateTimeOffset CreatedAt);

public sealed record FixedScheduleEntryDto(
    Guid RoutineId,
    string RoutineName,
    List<int> Days);

public sealed record NextWorkoutDto(
    Guid RoutineId,
    string RoutineName,
    Guid DayId,
    string DayName,
    string ProgramName,
    int CurrentWeek,
    int TotalWeeks);

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
