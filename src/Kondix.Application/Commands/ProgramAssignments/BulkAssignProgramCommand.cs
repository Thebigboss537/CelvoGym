using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;

namespace Kondix.Application.Commands.ProgramAssignments;

public sealed record BulkAssignProgramCommand(
    Guid TrainerId,
    Guid ProgramId,
    List<Guid> StudentIds,
    ProgramAssignmentMode Mode,
    List<int>? TrainingDays = null,
    List<FixedScheduleInput>? FixedSchedule = null,
    DateOnly? StartDate = null) : IRequest<List<ProgramAssignmentDto>>;

public sealed class BulkAssignProgramHandler : IRequestHandler<BulkAssignProgramCommand, List<ProgramAssignmentDto>>
{
    public Task<List<ProgramAssignmentDto>> Handle(BulkAssignProgramCommand request, CancellationToken ct) =>
        throw new NotImplementedException("Wired in Phase 6 of Programs v3");
}
