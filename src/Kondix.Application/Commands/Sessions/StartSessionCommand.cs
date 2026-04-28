using Kondix.Application.DTOs;
using MediatR;

namespace Kondix.Application.Commands.Sessions;

public sealed record StartSessionCommand(
    Guid StudentId,
    Guid RoutineId,
    Guid DayId,
    DateOnly? RecoversPlannedDate = null) : IRequest<WorkoutSessionDto>;

public sealed class StartSessionHandler : IRequestHandler<StartSessionCommand, WorkoutSessionDto>
{
    public Task<WorkoutSessionDto> Handle(StartSessionCommand request, CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 5 of Programs v3");
}
