using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;

namespace Kondix.Application.Commands.Body;

public sealed record CreateProgressPhotoCommand(
    Guid StudentId,
    DateOnly TakenAt,
    string PhotoUrl,
    PhotoAngle Angle,
    string? Notes) : IRequest<ProgressPhotoDto>;

public sealed class CreateProgressPhotoHandler(IKondixDbContext db)
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
