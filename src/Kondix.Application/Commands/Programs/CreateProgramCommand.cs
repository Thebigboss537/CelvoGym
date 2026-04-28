using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;

namespace Kondix.Application.Commands.Programs;

public sealed record CreateProgramCommand(
    Guid TrainerId,
    string Name,
    string? Description,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode,
    ProgramScheduleType ScheduleType,
    int? DaysPerWeek,
    int DurationWeeks) : IRequest<Guid>;

public sealed class CreateProgramHandler(IKondixDbContext db) : IRequestHandler<CreateProgramCommand, Guid>
{
    public Task<Guid> Handle(CreateProgramCommand request, CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 2");
}
