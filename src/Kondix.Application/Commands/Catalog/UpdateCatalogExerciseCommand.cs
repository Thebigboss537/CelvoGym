using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Catalog;

public sealed record UpdateCatalogExerciseCommand(
    Guid ExerciseId,
    Guid TrainerId,
    string Name,
    string? MuscleGroup,
    VideoSource VideoSource,
    string? VideoUrl,
    string? Notes) : IRequest<CatalogExerciseDto>;

public sealed class UpdateCatalogExerciseHandler(IKondixDbContext db)
    : IRequestHandler<UpdateCatalogExerciseCommand, CatalogExerciseDto>
{
    public async Task<CatalogExerciseDto> Handle(UpdateCatalogExerciseCommand request, CancellationToken cancellationToken)
    {
        var exercise = await db.CatalogExercises
            .FirstOrDefaultAsync(ce => ce.Id == request.ExerciseId
                && ce.TrainerId == request.TrainerId
                && ce.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Exercise not found");

        exercise.Name = request.Name;
        exercise.MuscleGroup = request.MuscleGroup;
        exercise.VideoSource = request.VideoSource;
        exercise.VideoUrl = request.VideoUrl;
        exercise.Notes = request.Notes;
        exercise.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return new CatalogExerciseDto(exercise.Id, exercise.Name, exercise.MuscleGroup,
            exercise.VideoSource, exercise.VideoUrl, exercise.Notes, exercise.UpdatedAt);
    }
}
