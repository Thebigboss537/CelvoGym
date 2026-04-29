using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record AddWeekCommand(Guid ProgramId, Guid TrainerId) : IRequest;

public sealed class AddWeekHandler(IKondixDbContext db) : IRequestHandler<AddWeekCommand>
{
    public async Task Handle(AddWeekCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");
        if (program.Mode == ProgramMode.Loop)
            throw new InvalidOperationException("Loop programs cannot have additional weeks");

        var slotsPerWeek = program.ScheduleType == ProgramScheduleType.Numbered
            ? program.DaysPerWeek!.Value : 7;
        var newIdx = program.Weeks.Count;
        var newWeek = new ProgramWeek { WeekIndex = newIdx, Label = $"Semana {newIdx + 1}", ProgramId = program.Id };
        for (var d = 0; d < slotsPerWeek; d++)
            newWeek.Slots.Add(new ProgramSlot { DayIndex = d, Kind = ProgramSlotKind.Empty });
        db.ProgramWeeks.Add(newWeek);
        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
