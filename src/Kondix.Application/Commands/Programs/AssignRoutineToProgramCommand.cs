using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

/// <summary>
/// Mapping (Week mode): Dictionary&lt;DayId, WeekdayIdx 0..6&gt;.
/// DayIds (Numbered mode): ordered list of routine day IDs to place in slots 0..N-1.
/// Exactly one of Mapping or DayIds is required, depending on program.ScheduleType.
/// Returns the BlockId generated for the placed slots.
/// </summary>
public sealed record AssignRoutineToProgramCommand(
    Guid ProgramId,
    Guid TrainerId,
    Guid RoutineId,
    IReadOnlyList<int> Weeks,
    IReadOnlyDictionary<Guid, int>? Mapping,
    IReadOnlyList<Guid>? DayIds) : IRequest<Guid>;

public sealed class AssignRoutineToProgramHandler(IKondixDbContext db)
    : IRequestHandler<AssignRoutineToProgramCommand, Guid>
{
    public async Task<Guid> Handle(AssignRoutineToProgramCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        var routine = await db.Routines
            .Include(r => r.Days)
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId && r.TrainerId == request.TrainerId, ct);
        if (routine is null) throw new InvalidOperationException("Routine not found");

        if (request.Weeks.Count == 0)
            throw new InvalidOperationException("At least one target week is required");
        var validWeeks = program.Weeks.Select(w => w.WeekIndex).ToHashSet();
        if (request.Weeks.Any(w => !validWeeks.Contains(w)))
            throw new InvalidOperationException("One or more target weeks are out of range");

        var blockId = Guid.NewGuid();

        if (program.ScheduleType == ProgramScheduleType.Week)
        {
            if (request.Mapping is null || request.Mapping.Count == 0)
                throw new InvalidOperationException("mapping required for Week mode");
            var routineDayIds = routine.Days.Select(d => d.Id).ToHashSet();
            if (request.Mapping.Keys.Any(id => !routineDayIds.Contains(id)))
                throw new InvalidOperationException("mapping references unknown routine day");
            if (request.Mapping.Values.Distinct().Count() != request.Mapping.Count)
                throw new InvalidOperationException("Two routine days mapped to the same weekday");
            if (request.Mapping.Values.Any(v => v < 0 || v > 6))
                throw new InvalidOperationException("weekday out of range");

            var routineDayById = routine.Days.ToDictionary(d => d.Id);

            foreach (var weekIdx in request.Weeks)
            {
                var week = program.Weeks.First(w => w.WeekIndex == weekIdx);
                foreach (var (dayId, weekdayIdx) in request.Mapping)
                {
                    var slot = week.Slots.First(s => s.DayIndex == weekdayIdx);
                    var rd = routineDayById[dayId];
                    slot.Kind = ProgramSlotKind.RoutineDay;
                    slot.RoutineId = routine.Id;
                    slot.DayId = rd.Id;
                    slot.BlockId = blockId;
                }
            }
        }
        else // Numbered
        {
            if (request.DayIds is null || request.DayIds.Count == 0)
                throw new InvalidOperationException("dayIds required for Numbered mode");
            if (request.DayIds.Count > program.DaysPerWeek)
                throw new InvalidOperationException(
                    $"dayIds length ({request.DayIds.Count}) exceeds program.DaysPerWeek ({program.DaysPerWeek})");
            var routineDayIds = routine.Days.Select(d => d.Id).ToHashSet();
            if (request.DayIds.Any(id => !routineDayIds.Contains(id)))
                throw new InvalidOperationException("dayIds reference unknown routine day");

            foreach (var weekIdx in request.Weeks)
            {
                var week = program.Weeks.First(w => w.WeekIndex == weekIdx);
                for (var i = 0; i < request.DayIds.Count; i++)
                {
                    var slot = week.Slots.First(s => s.DayIndex == i);
                    slot.Kind = ProgramSlotKind.RoutineDay;
                    slot.RoutineId = routine.Id;
                    slot.DayId = request.DayIds[i];
                    slot.BlockId = blockId;
                }
            }
        }

        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return blockId;
    }
}
