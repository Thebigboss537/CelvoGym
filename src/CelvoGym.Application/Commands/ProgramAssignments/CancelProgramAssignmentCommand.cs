using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.ProgramAssignments;

public sealed record CancelProgramAssignmentCommand(
    Guid Id,
    Guid TrainerId) : IRequest;

public sealed class CancelProgramAssignmentHandler(ICelvoGymDbContext db)
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
