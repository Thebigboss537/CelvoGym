using Kondix.Application.DTOs;
using MediatR;

namespace Kondix.Application.Queries.ProgramAssignments;

public sealed record GetProgramAssignmentsQuery(
    Guid TrainerId,
    Guid? StudentId = null,
    bool ActiveOnly = true) : IRequest<List<ProgramAssignmentDto>>;

public sealed class GetProgramAssignmentsHandler : IRequestHandler<GetProgramAssignmentsQuery, List<ProgramAssignmentDto>>
{
    public Task<List<ProgramAssignmentDto>> Handle(GetProgramAssignmentsQuery request, CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 6 of Programs v3");
}
