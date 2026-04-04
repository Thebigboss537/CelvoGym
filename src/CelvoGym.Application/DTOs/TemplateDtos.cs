namespace CelvoGym.Application.DTOs;

public sealed record AssignmentTemplateDto(
    Guid Id,
    string Name,
    Guid? ProgramId,
    string? ProgramName,
    Guid? RoutineId,
    string? RoutineName,
    List<int> ScheduledDays,
    int? DurationWeeks);
