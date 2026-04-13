using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using CelvoGym.Domain.Enums;
using MediatR;

namespace CelvoGym.Application.Commands.Catalog;

public sealed record CreateCatalogExerciseCommand(
    Guid TrainerId,
    string Name,
    string? MuscleGroup,
    VideoSource VideoSource,
    string? VideoUrl,
    string? Notes) : IRequest<CatalogExerciseDto>;

public sealed class CreateCatalogExerciseHandler(ICelvoGymDbContext db)
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
            Notes = request.Notes,
            UpdatedAt = now
        };

        db.CatalogExercises.Add(exercise);
        await db.SaveChangesAsync(cancellationToken);

        return new CatalogExerciseDto(exercise.Id, exercise.Name, exercise.MuscleGroup,
            exercise.VideoSource, exercise.VideoUrl, exercise.Notes, exercise.UpdatedAt);
    }
}
