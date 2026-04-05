namespace CelvoGym.Application.DTOs;

public sealed record AssignmentTemplateDto(
    Guid Id,
    string Name,
    Guid? ProgramId,
    string? ProgramName,
    List<int> ScheduledDays,
    int? DurationWeeks);
