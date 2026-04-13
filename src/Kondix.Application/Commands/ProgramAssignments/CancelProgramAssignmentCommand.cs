using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.ProgramAssignments;

public sealed record CancelProgramAssignmentCommand(
    Guid Id,
    Guid TrainerId) : IRequest;

public sealed class CancelProgramAssignmentHandler(IKondixDbContext db)
    : IRequestHandler<CancelProgramAssignmentCommand>
{
    public async Task Handle(CancelProgramAssignmentCommand request, CancellationToken cancellationToken)
    {
        var assignment = await db.ProgramAssignments
            .Include(pa => pa.Program)
            .FirstOrDefaultAsync(pa => pa.Id == request.Id
                && pa.Program.TrainerId == request.TrainerId
                && pa.Status == ProgramAssignmentStatus.Active, cancellationToken)
            ?? throw new InvalidOperationException("Assignment not found");

        assignment.Status = ProgramAssignmentStatus.Cancelled;
        assignment.CompletedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
    }
}
