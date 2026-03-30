using CelvoGym.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Assignments;

public sealed record DeactivateAssignmentCommand(
    Guid AssignmentId,
    Guid TrainerId) : IRequest<Unit>;

public sealed class DeactivateAssignmentHandler(ICelvoGymDbContext db)
    : IRequestHandler<DeactivateAssignmentCommand, Unit>
{
    public async Task<Unit> Handle(DeactivateAssignmentCommand request, CancellationToken cancellationToken)
    {
        var assignment = await db.RoutineAssignments
            .Include(ra => ra.Routine)
            .FirstOrDefaultAsync(ra => ra.Id == request.AssignmentId
                && ra.Routine.TrainerId == request.TrainerId
                && ra.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Assignment not found");

        assignment.IsActive = false;
        assignment.DeactivatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
