using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Routines;

public sealed record GetRoutinesQuery(Guid TrainerId) : IRequest<List<RoutineListDto>>;

public sealed class GetRoutinesHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetRoutinesQuery, List<RoutineListDto>>
{
    public async Task<List<RoutineListDto>> Handle(GetRoutinesQuery request, CancellationToken cancellationToken)
    {
        return await db.Routines
            .AsNoTracking()
            .Where(r => r.TrainerId == request.TrainerId && r.IsActive)
            .OrderBy(r => r.SortOrder)
            .ThenByDescending(r => r.CreatedAt)
            .Select(r => new RoutineListDto(
                r.Id,
                r.Name,
                r.Description,
                r.Days.Count,
                r.Days.SelectMany(d => d.ExerciseGroups)
                    .SelectMany(g => g.Exercises).Count(),
                r.Tags,
                r.Category,
                r.CreatedAt,
                r.UpdatedAt))
            .ToListAsync(cancellationToken);
    }
}
