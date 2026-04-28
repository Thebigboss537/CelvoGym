using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record FillRestCommand(Guid ProgramId, Guid TrainerId) : IRequest;

public sealed class FillRestHandler(IKondixDbContext db) : IRequestHandler<FillRestCommand>
{
    public async Task Handle(FillRestCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        if (program.ScheduleType == ProgramScheduleType.Numbered)
            throw new InvalidOperationException("Fill-rest is not supported in Numbered mode");

        foreach (var slot in program.Weeks.SelectMany(w => w.Slots).Where(s => s.Kind == ProgramSlotKind.Empty))
            slot.Kind = ProgramSlotKind.Rest;

        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
