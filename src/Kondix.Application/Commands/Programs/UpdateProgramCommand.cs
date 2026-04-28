using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;

namespace Kondix.Application.Commands.Programs;

public sealed record UpdateProgramCommand(
    Guid ProgramId,
    Guid TrainerId,
    string Name,
    string? Description,
    string? Notes,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode) : IRequest;

public sealed class UpdateProgramHandler(IKondixDbContext db) : IRequestHandler<UpdateProgramCommand>
{
    public Task Handle(UpdateProgramCommand request, CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 2");
}
