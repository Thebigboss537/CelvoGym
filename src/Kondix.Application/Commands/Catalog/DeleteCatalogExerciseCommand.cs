using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Catalog;

public sealed record DeleteCatalogExerciseCommand(
    Guid ExerciseId,
    Guid TrainerId) : IRequest<Unit>;

public sealed class DeleteCatalogExerciseHandler(IKondixDbContext db)
    : IRequestHandler<DeleteCatalogExerciseCommand, Unit>
{
    public async Task<Unit> Handle(DeleteCatalogExerciseCommand request, CancellationToken cancellationToken)
    {
        var exercise = await db.CatalogExercises
            .FirstOrDefaultAsync(ce => ce.Id == request.ExerciseId
                && ce.TrainerId == request.TrainerId
                && ce.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Exercise not found");

        exercise.IsActive = false;
        exercise.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
