using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;

namespace Kondix.Application.Commands.ProgramAssignments;

public sealed record AssignProgramCommand(
    Guid TrainerId,
    Guid ProgramId,
    Guid StudentId,
    ProgramAssignmentMode Mode,
    List<int>? TrainingDays = null,
    List<FixedScheduleInput>? FixedSchedule = null,
    DateOnly? StartDate = null) : IRequest<ProgramAssignmentDto>;

public sealed class AssignProgramHandler : IRequestHandler<AssignProgramCommand, ProgramAssignmentDto>
{
    public Task<ProgramAssignmentDto> Handle(AssignProgramCommand request, CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 6 of Programs v3");
}
