using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Routines;

public sealed record DeleteRoutineCommand(
    Guid RoutineId,
    Guid TrainerId) : IRequest<Unit>;

public sealed class DeleteRoutineHandler(IKondixDbContext db)
    : IRequestHandler<DeleteRoutineCommand, Unit>
{
    public async Task<Unit> Handle(DeleteRoutineCommand request, CancellationToken cancellationToken)
    {
        var routine = await db.Routines
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId
                && r.TrainerId == request.TrainerId
                && r.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Routine not found");

        // Reset any program slots referencing this routine to Empty before the soft-delete,
        // so we never have Kind=RoutineDay with a stale RoutineId.
        var affectedSlots = await db.ProgramSlots
            .Where(s => s.RoutineId == request.RoutineId && s.Kind == ProgramSlotKind.RoutineDay)
            .ToListAsync(cancellationToken);

        foreach (var slot in affectedSlots)
        {
            slot.Kind = ProgramSlotKind.Empty;
            slot.RoutineId = null;
            slot.DayId = null;
            slot.BlockId = null;
        }

        routine.IsActive = false;
        routine.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
