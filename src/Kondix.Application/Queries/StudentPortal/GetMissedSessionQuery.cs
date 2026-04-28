using MediatR;

namespace Kondix.Application.Queries.StudentPortal;

public sealed record GetMissedSessionQuery(Guid StudentId) : IRequest<RecoverableSessionDto?>;

public sealed record RecoverableSessionDto(
    DateOnly PlannedDate,
    Guid RoutineId,
    string RoutineName,
    Guid DayId,
    string DayName,
    DateOnly DeadlineDate);

public sealed class GetMissedSessionQueryHandler : IRequestHandler<GetMissedSessionQuery, RecoverableSessionDto?>
{
    public Task<RecoverableSessionDto?> Handle(
        GetMissedSessionQuery request,
        CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 5 of Programs v3");
}
