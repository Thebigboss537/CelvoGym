using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Routines;

public sealed record GetRoutineByIdQuery(Guid RoutineId, Guid TrainerId) : IRequest<RoutineDetailDto>;

public sealed class GetRoutineByIdHandler(IKondixDbContext db)
    : IRequestHandler<GetRoutineByIdQuery, RoutineDetailDto>
{
    public async Task<RoutineDetailDto> Handle(GetRoutineByIdQuery request, CancellationToken cancellationToken)
    {
        var routine = await db.Routines
            .AsNoTracking()
            .Include(r => r.Days.OrderBy(d => d.SortOrder))
                .ThenInclude(d => d.Blocks.OrderBy(g => g.SortOrder))
                    .ThenInclude(g => g.Exercises.OrderBy(e => e.SortOrder))
                        .ThenInclude(e => e.CatalogExercise)
            .Include(r => r.Days).ThenInclude(d => d.Blocks)
                .ThenInclude(g => g.Exercises).ThenInclude(e => e.Sets.OrderBy(s => s.SortOrder))
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId
                && r.TrainerId == request.TrainerId
                && r.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Routine not found");

        return new RoutineDetailDto(
            routine.Id,
            routine.Name,
            routine.Description,
            routine.Days.Select(d => new DayDto(
                d.Id,
                d.Name,
                d.Blocks.Select(g => new ExerciseBlockDto(
                    g.Id,
                    g.BlockType,
                    g.RestSeconds,
                    g.Exercises.Select(e => new ExerciseDto(
                        e.Id,
                        e.Name,
                        e.Notes,
                        e.Tempo,
                        e.CatalogExerciseId,
                        e.CatalogExercise != null ? e.CatalogExercise.VideoSource : VideoSource.None,
                        e.CatalogExercise?.VideoUrl,
                        e.CatalogExercise?.ImageUrl,
                        e.CatalogExercise?.MuscleGroup,
                        e.Sets.Select(s => new ExerciseSetDto(
                            s.Id,
                            s.SetType,
                            s.TargetReps,
                            s.TargetWeight,
                            s.TargetRpe,
                            s.RestSeconds
                        )).ToList()
                    )).ToList()
                )).ToList()
            )).ToList(),
            routine.Tags,
            routine.Category,
            routine.CreatedAt,
            routine.UpdatedAt);
    }
}
