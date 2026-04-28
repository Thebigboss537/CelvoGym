using Kondix.Application.DTOs;
using MediatR;

namespace Kondix.Application.Queries.StudentPortal;

public sealed record GetMyProgramQuery(Guid StudentId) : IRequest<MyProgramDto?>;

public sealed class GetMyProgramHandler : IRequestHandler<GetMyProgramQuery, MyProgramDto?>
{
    public Task<MyProgramDto?> Handle(GetMyProgramQuery request, CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 6 of Programs v3");
}
