using Kondix.Application.DTOs;
using MediatR;

namespace Kondix.Application.Queries.Routines;

public sealed record GetRoutineUsageQuery(Guid RoutineId, Guid TrainerId) : IRequest<RoutineUsageDto>;

public sealed class GetRoutineUsageHandler : IRequestHandler<GetRoutineUsageQuery, RoutineUsageDto>
{
    public Task<RoutineUsageDto> Handle(GetRoutineUsageQuery request, CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 6 of Programs v3");
}
