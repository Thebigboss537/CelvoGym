using Kondix.Application.DTOs;
using MediatR;

namespace Kondix.Application.Queries.StudentPortal;

public sealed record GetNextWorkoutQuery(Guid StudentId) : IRequest<NextWorkoutDto?>;

public sealed class GetNextWorkoutHandler : IRequestHandler<GetNextWorkoutQuery, NextWorkoutDto?>
{
    public Task<NextWorkoutDto?> Handle(GetNextWorkoutQuery request, CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 5 of Programs v3");
}
