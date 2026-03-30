namespace CelvoGym.Application.DTOs;

public sealed record AssignmentDto(
    Guid Id,
    Guid RoutineId,
    string RoutineName,
    Guid StudentId,
    string StudentName,
    bool IsActive,
    DateTimeOffset CreatedAt);
