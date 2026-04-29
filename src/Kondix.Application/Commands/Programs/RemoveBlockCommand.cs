using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record RemoveBlockCommand(Guid ProgramId, Guid TrainerId, Guid BlockId) : IRequest;

public sealed class RemoveBlockHandler(IKondixDbContext db) : IRequestHandler<RemoveBlockCommand>
{
    public async Task Handle(RemoveBlockCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        foreach (var slot in program.Weeks.SelectMany(w => w.Slots).Where(s => s.BlockId == request.BlockId))
        {
            slot.Kind = ProgramSlotKind.Empty;
            slot.RoutineId = null;
            slot.DayId = null;
            slot.BlockId = null;
        }
        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
