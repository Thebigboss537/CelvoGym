using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Programs;

public sealed record GetProgramWeekOverridesQuery(Guid ProgramId) : IRequest<List<ProgramWeekOverrideDto>>;

public sealed record ProgramWeekOverrideDto(int WeekIndex, string Notes);

public sealed class GetProgramWeekOverridesQueryHandler(IKondixDbContext db)
    : IRequestHandler<GetProgramWeekOverridesQuery, List<ProgramWeekOverrideDto>>
{
    public async Task<List<ProgramWeekOverrideDto>> Handle(GetProgramWeekOverridesQuery request, CancellationToken cancellationToken) =>
        await db.ProgramWeekOverrides
            .AsNoTracking()
            .Where(o => o.ProgramId == request.ProgramId)
            .OrderBy(o => o.WeekIndex)
            .Select(o => new ProgramWeekOverrideDto(o.WeekIndex, o.Notes))
            .ToListAsync(cancellationToken);
}
