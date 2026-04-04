using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Templates;

public sealed record GetTemplatesQuery(
    Guid TrainerId) : IRequest<List<AssignmentTemplateDto>>;

public sealed class GetTemplatesHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetTemplatesQuery, List<AssignmentTemplateDto>>
{
    public async Task<List<AssignmentTemplateDto>> Handle(GetTemplatesQuery request, CancellationToken cancellationToken)
    {
        return await db.AssignmentTemplates
            .AsNoTracking()
            .Where(at => at.TrainerId == request.TrainerId)
            .OrderBy(at => at.Name)
            .Select(at => new AssignmentTemplateDto(
                at.Id, at.Name,
                at.ProgramId, at.Program != null ? at.Program.Name : null,
                at.RoutineId, at.Routine != null ? at.Routine.Name : null,
                at.ScheduledDays, at.DurationWeeks))
            .ToListAsync(cancellationToken);
    }
}
