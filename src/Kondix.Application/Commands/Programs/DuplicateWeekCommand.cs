using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record DuplicateWeekCommand(Guid ProgramId, Guid TrainerId, int WeekIndex) : IRequest;

public sealed class DuplicateWeekHandler(IKondixDbContext db) : IRequestHandler<DuplicateWeekCommand>
{
    public async Task Handle(DuplicateWeekCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");
        if (program.Mode == ProgramMode.Loop)
            throw new InvalidOperationException("Loop programs cannot duplicate weeks");

        var src = program.Weeks.FirstOrDefault(w => w.WeekIndex == request.WeekIndex)
            ?? throw new InvalidOperationException("Week not found");

        // Shift WeekIndex of all weeks > source by +1.
        foreach (var w in program.Weeks.Where(w => w.WeekIndex > src.WeekIndex))
            w.WeekIndex += 1;

        var copy = new ProgramWeek { WeekIndex = src.WeekIndex + 1, Label = "", ProgramId = program.Id };
        foreach (var s in src.Slots.OrderBy(x => x.DayIndex))
        {
            copy.Slots.Add(new ProgramSlot
            {
                DayIndex = s.DayIndex,
                Kind = s.Kind,
                RoutineId = s.RoutineId,
                DayId = s.DayId,
                BlockId = s.BlockId
            });
        }
        db.ProgramWeeks.Add(copy);

        // Renumber labels sequentially to "Semana N".
        foreach (var w in program.Weeks.Concat([copy]).OrderBy(w => w.WeekIndex))
            w.Label = $"Semana {w.WeekIndex + 1}";

        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
