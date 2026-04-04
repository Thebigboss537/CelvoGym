using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using CelvoGym.Domain.Enums;
using MediatR;

namespace CelvoGym.Application.Commands.Body;

public sealed record CreateProgressPhotoCommand(
    Guid StudentId,
    DateOnly TakenAt,
    string PhotoUrl,
    PhotoAngle Angle,
    string? Notes) : IRequest<ProgressPhotoDto>;

public sealed class CreateProgressPhotoHandler(ICelvoGymDbContext db)
    : IRequestHandler<CreateProgressPhotoCommand, ProgressPhotoDto>
{
    public async Task<ProgressPhotoDto> Handle(CreateProgressPhotoCommand request, CancellationToken cancellationToken)
    {
        var photo = new ProgressPhoto
        {
            StudentId = request.StudentId,
            TakenAt = request.TakenAt,
            PhotoUrl = request.PhotoUrl,
            Angle = request.Angle,
            Notes = request.Notes
        };

        db.ProgressPhotos.Add(photo);
        await db.SaveChangesAsync(cancellationToken);

        return new ProgressPhotoDto(photo.Id, photo.TakenAt, photo.PhotoUrl, photo.Angle, photo.Notes);
    }
}
