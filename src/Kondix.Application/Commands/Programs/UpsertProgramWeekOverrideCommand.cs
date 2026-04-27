using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record UpsertProgramWeekOverrideCommand(Guid ProgramId, Guid TrainerId, int WeekIndex, string Notes) : IRequest;

public sealed class UpsertProgramWeekOverrideCommandHandler(IKondixDbContext db)
    : IRequestHandler<UpsertProgramWeekOverrideCommand>
{
    public async Task Handle(UpsertProgramWeekOverrideCommand request, CancellationToken cancellationToken)
    {
        var owns = await db.Programs.AnyAsync(
            p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId,
            cancellationToken);
        if (!owns) throw new InvalidOperationException("Program not found");

        var existing = await db.ProgramWeekOverrides
            .FirstOrDefaultAsync(o => o.ProgramId == request.ProgramId && o.WeekIndex == request.WeekIndex, cancellationToken);
        var trimmed = request.Notes?.Trim() ?? "";

        if (string.IsNullOrEmpty(trimmed))
        {
            if (existing is not null) db.ProgramWeekOverrides.Remove(existing);
        }
        else if (existing is null)
        {
            db.ProgramWeekOverrides.Add(new ProgramWeekOverride
            {
                ProgramId = request.ProgramId,
                WeekIndex = request.WeekIndex,
                Notes = trimmed,
            });
        }
        else
        {
            existing.Notes = trimmed;
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
