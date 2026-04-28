using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record DuplicateProgramCommand(Guid ProgramId, Guid TrainerId) : IRequest<Guid>;

public sealed class DuplicateProgramHandler(IKondixDbContext db) : IRequestHandler<DuplicateProgramCommand, Guid>
{
    public async Task<Guid> Handle(DuplicateProgramCommand request, CancellationToken ct)
    {
        var src = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (src is null) throw new InvalidOperationException("Program not found");

        var now = DateTimeOffset.UtcNow;
        var blockIdMap = new Dictionary<Guid, Guid>();

        var copy = new Program
        {
            TrainerId = src.TrainerId,
            Name = $"{src.Name} (copia)",
            Description = src.Description,
            Notes = src.Notes,
            Objective = src.Objective,
            Level = src.Level,
            Mode = src.Mode,
            ScheduleType = src.ScheduleType,
            DaysPerWeek = src.DaysPerWeek,
            IsPublished = false,
            UpdatedAt = now
        };

        foreach (var w in src.Weeks.OrderBy(x => x.WeekIndex))
        {
            var newWeek = new ProgramWeek { WeekIndex = w.WeekIndex, Label = w.Label };
            foreach (var s in w.Slots.OrderBy(x => x.DayIndex))
            {
                Guid? newBlockId = null;
                if (s.BlockId.HasValue)
                {
                    if (!blockIdMap.TryGetValue(s.BlockId.Value, out var mapped))
                    {
                        mapped = Guid.NewGuid();
                        blockIdMap[s.BlockId.Value] = mapped;
                    }
                    newBlockId = mapped;
                }
                newWeek.Slots.Add(new ProgramSlot
                {
                    DayIndex = s.DayIndex,
                    Kind = s.Kind,
                    RoutineId = s.RoutineId,
                    DayId = s.DayId,
                    BlockId = newBlockId
                });
            }
            copy.Weeks.Add(newWeek);
        }

        db.Programs.Add(copy);
        await db.SaveChangesAsync(ct);
        return copy.Id;
    }
}
