using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Body;

public sealed record GetProgressPhotosQuery(
    Guid StudentId) : IRequest<List<ProgressPhotoDto>>;

public sealed class GetProgressPhotosHandler(IKondixDbContext db)
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
