using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Body;

public sealed record GetProgressPhotosQuery(
    Guid StudentId) : IRequest<List<ProgressPhotoDto>>;

public sealed class GetProgressPhotosHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetProgressPhotosQuery, List<ProgressPhotoDto>>
{
    public async Task<List<ProgressPhotoDto>> Handle(GetProgressPhotosQuery request, CancellationToken cancellationToken)
    {
        return await db.ProgressPhotos
            .AsNoTracking()
            .Where(pp => pp.StudentId == request.StudentId)
            .OrderByDescending(pp => pp.TakenAt)
            .Select(pp => new ProgressPhotoDto(pp.Id, pp.TakenAt, pp.PhotoUrl, pp.Angle, pp.Notes))
            .ToListAsync(cancellationToken);
    }
}
