namespace CelvoGym.Application.DTOs;

public sealed record ProgramListDto(
    Guid Id,
    string Name,
    string? Description,
    int DurationWeeks,
    int RoutineCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record ProgramDetailDto(
    Guid Id,
    string Name,
    string? Description,
    int DurationWeeks,
    List<ProgramRoutineDto> Routines,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record ProgramRoutineDto(
    Guid Id,
    Guid RoutineId,
    string RoutineName,
    string? Label,
    int SortOrder);

public sealed record CreateProgramRoutineInput(
    Guid RoutineId,
    string? Label);
