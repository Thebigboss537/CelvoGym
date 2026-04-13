using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Catalog;

public sealed record SearchCatalogQuery(
    Guid TrainerId,
    string? SearchTerm = null) : IRequest<List<CatalogExerciseDto>>;

public sealed class SearchCatalogHandler(ICelvoGymDbContext db)
    : IRequestHandler<SearchCatalogQuery, List<CatalogExerciseDto>>
{
    public async Task<List<CatalogExerciseDto>> Handle(SearchCatalogQuery request, CancellationToken cancellationToken)
    {
        var query = db.CatalogExercises
            .AsNoTracking()
            .Where(ce => ce.TrainerId == request.TrainerId && ce.IsActive);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(ce => ce.Name.ToLower().Contains(term)
                || (ce.MuscleGroup != null && ce.MuscleGroup.ToLower().Contains(term)));
        }

        return await query
            .OrderBy(ce => ce.Name)
            .Take(50)
            .Select(ce => new CatalogExerciseDto(ce.Id, ce.Name, ce.MuscleGroup,
                ce.VideoSource, ce.VideoUrl, ce.Notes, ce.UpdatedAt))
            .ToListAsync(cancellationToken);
    }
}
