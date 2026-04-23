using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;

namespace Kondix.Application.Commands.Catalog;

public sealed record CreateCatalogExerciseCommand(
    Guid TrainerId,
    string Name,
    string? MuscleGroup,
    VideoSource VideoSource,
    string? VideoUrl,
    string? ImageUrl,
    string? Notes) : IRequest<CatalogExerciseDto>;

public sealed class CreateCatalogExerciseHandler(IKondixDbContext db)
    : IRequestHandler<CreateCatalogExerciseCommand, CatalogExerciseDto>
{
    public async Task<CatalogExerciseDto> Handle(CreateCatalogExerciseCommand request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var exercise = new CatalogExercise
        {
            TrainerId = request.TrainerId,
            Name = request.Name,
            MuscleGroup = request.MuscleGroup,
            VideoSource = request.VideoSource,
            VideoUrl = request.VideoUrl,
            ImageUrl = request.ImageUrl,
            Notes = request.Notes,
            UpdatedAt = now
        };

        db.CatalogExercises.Add(exercise);
        await db.SaveChangesAsync(cancellationToken);

        return new CatalogExerciseDto(exercise.Id, exercise.Name, exercise.MuscleGroup,
            exercise.VideoSource, exercise.VideoUrl, exercise.ImageUrl, exercise.Notes, exercise.UpdatedAt);
    }
}
