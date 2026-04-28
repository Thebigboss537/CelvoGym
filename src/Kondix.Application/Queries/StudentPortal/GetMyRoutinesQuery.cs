using Kondix.Application.DTOs;
using MediatR;

namespace Kondix.Application.Queries.StudentPortal;

public sealed record GetMyRoutinesQuery(Guid StudentId) : IRequest<List<StudentRoutineListDto>>;

public sealed class GetMyRoutinesHandler : IRequestHandler<GetMyRoutinesQuery, List<StudentRoutineListDto>>
{
    public Task<List<StudentRoutineListDto>> Handle(GetMyRoutinesQuery request, CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 6 of Programs v3");
}
