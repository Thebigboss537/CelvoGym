using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record SetSlotCommand(
    Guid ProgramId,
    Guid TrainerId,
    int WeekIndex,
    int DayIndex,
    ProgramSlotKind Kind) : IRequest;

public sealed class SetSlotHandler(IKondixDbContext db) : IRequestHandler<SetSlotCommand>
{
    public async Task Handle(SetSlotCommand request, CancellationToken ct)
    {
        if (request.Kind == ProgramSlotKind.RoutineDay)
            throw new InvalidOperationException("Use the assign-routine endpoint to place RoutineDay slots");

        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        if (request.Kind == ProgramSlotKind.Rest && program.ScheduleType == ProgramScheduleType.Numbered)
            throw new InvalidOperationException("Rest slots are not allowed in Numbered programs");

        var week = program.Weeks.FirstOrDefault(w => w.WeekIndex == request.WeekIndex)
            ?? throw new InvalidOperationException("Week not found");
        var slot = week.Slots.FirstOrDefault(s => s.DayIndex == request.DayIndex)
            ?? throw new InvalidOperationException("Slot not found");

        slot.Kind = request.Kind;
        slot.RoutineId = null;
        slot.DayId = null;
        slot.BlockId = null;
        program.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}
