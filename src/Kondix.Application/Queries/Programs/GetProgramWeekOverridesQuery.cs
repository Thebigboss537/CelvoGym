using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Programs;

public sealed record GetProgramWeekOverridesQuery(Guid ProgramId, Guid TrainerId) : IRequest<List<ProgramWeekOverrideDto>>;

public sealed record ProgramWeekOverrideDto(int WeekIndex, string Notes);

public sealed class GetProgramWeekOverridesQueryHandler(IKondixDbContext db)
    : IRequestHandler<GetProgramWeekOverridesQuery, List<ProgramWeekOverrideDto>>
{
    public async Task<List<ProgramWeekOverrideDto>> Handle(GetProgramWeekOverridesQuery request, CancellationToken cancellationToken)
    {
        var owns = await db.Programs.AnyAsync(
            p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId,
            cancellationToken);
        if (!owns) throw new InvalidOperationException("Program not found");

        return await db.ProgramWeekOverrides
            .AsNoTracking()
            .Where(o => o.ProgramId == request.ProgramId)
            .OrderBy(o => o.WeekIndex)
            .Select(o => new ProgramWeekOverrideDto(o.WeekIndex, o.Notes))
            .ToListAsync(cancellationToken);
    }
}
