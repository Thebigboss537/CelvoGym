using CelvoGym.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Routines;

public sealed record DeleteRoutineCommand(
    Guid RoutineId,
    Guid TrainerId) : IRequest<Unit>;

public sealed class DeleteRoutineHandler(ICelvoGymDbContext db)
    : IRequestHandler<DeleteRoutineCommand, Unit>
{
    public async Task<Unit> Handle(DeleteRoutineCommand request, CancellationToken cancellationToken)
    {
        var routine = await db.Routines
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId
                && r.TrainerId == request.TrainerId
                && r.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Routine not found");

        routine.IsActive = false;
        routine.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
