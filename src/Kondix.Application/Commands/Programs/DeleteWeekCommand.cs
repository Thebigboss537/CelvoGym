using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record DeleteWeekCommand(Guid ProgramId, Guid TrainerId, int WeekIndex) : IRequest;

public sealed class DeleteWeekHandler(IKondixDbContext db) : IRequestHandler<DeleteWeekCommand>
{
    public async Task Handle(DeleteWeekCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");
        if (program.Weeks.Count <= 1)
            throw new InvalidOperationException("Program must have at least one week");

        var target = program.Weeks.FirstOrDefault(w => w.WeekIndex == request.WeekIndex)
            ?? throw new InvalidOperationException("Week not found");

        program.Weeks.Remove(target);
        db.ProgramWeeks.Remove(target);

        var idx = 0;
        foreach (var w in program.Weeks.OrderBy(w => w.WeekIndex))
        {
            w.WeekIndex = idx++;
            w.Label = $"Semana {w.WeekIndex + 1}";
        }
        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
