using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Programs;

public sealed record GetProgramsQuery(
    Guid TrainerId,
    ProgramObjective? Objective = null,
    ProgramLevel? Level = null,
    bool? IsPublished = null,
    string? Query = null) : IRequest<List<ProgramSummaryDto>>;

public sealed class GetProgramsHandler(IKondixDbContext db)
    : IRequestHandler<GetProgramsQuery, List<ProgramSummaryDto>>
{
    public async Task<List<ProgramSummaryDto>> Handle(GetProgramsQuery request, CancellationToken ct)
    {
        var q = db.Programs.AsNoTracking().Where(p => p.TrainerId == request.TrainerId);

        if (request.Objective.HasValue) q = q.Where(p => p.Objective == request.Objective.Value);
        if (request.Level.HasValue)     q = q.Where(p => p.Level == request.Level.Value);
        if (request.IsPublished.HasValue) q = q.Where(p => p.IsPublished == request.IsPublished.Value);
        if (!string.IsNullOrWhiteSpace(request.Query))
        {
            var like = $"%{request.Query.Trim()}%";
            q = q.Where(p => EF.Functions.ILike(p.Name, like));
        }

        return await q
            .OrderByDescending(p => p.UpdatedAt)
            .Select(p => new ProgramSummaryDto(
                p.Id, p.Name, p.Description,
                p.Objective, p.Level, p.Mode, p.ScheduleType, p.DaysPerWeek,
                p.Weeks.Count,
                p.Weeks.SelectMany(w => w.Slots).Count(s => s.Kind == ProgramSlotKind.RoutineDay),
                p.Assignments.Count(a => a.Status == ProgramAssignmentStatus.Active),
                p.IsPublished,
                p.CreatedAt, p.UpdatedAt))
            .ToListAsync(ct);
    }
}
