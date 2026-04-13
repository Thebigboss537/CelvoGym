using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Routines;

public sealed record DuplicateRoutineCommand(
    Guid RoutineId,
    Guid TrainerId) : IRequest<RoutineDetailDto>;

public sealed class DuplicateRoutineHandler(ICelvoGymDbContext db)
    : IRequestHandler<DuplicateRoutineCommand, RoutineDetailDto>
{
    public async Task<RoutineDetailDto> Handle(DuplicateRoutineCommand request, CancellationToken cancellationToken)
    {
        var source = await db.Routines
            .AsNoTracking()
            .Include(r => r.Days.OrderBy(d => d.SortOrder))
                .ThenInclude(d => d.ExerciseGroups.OrderBy(g => g.SortOrder))
                    .ThenInclude(g => g.Exercises.OrderBy(e => e.SortOrder))
                        .ThenInclude(e => e.Sets.OrderBy(s => s.SortOrder))
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId
                && r.TrainerId == request.TrainerId
                && r.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Routine not found");

        var now = DateTimeOffset.UtcNow;
        var routine = new Routine
        {
            TrainerId = request.TrainerId,
            Name = $"{source.Name} (copia)",
            Description = source.Description,
            Tags = source.Tags.ToList(),
            Category = source.Category,
            SortOrder = source.SortOrder,
            UpdatedAt = now
        };

        var dayDtos = new List<DayDto>();

        foreach (var sourceDay in source.Days)
        {
            var day = new Day { Name = sourceDay.Name, SortOrder = sourceDay.SortOrder };
            var groupDtos = new List<ExerciseGroupDto>();

            foreach (var sourceGroup in sourceDay.ExerciseGroups)
            {
                var group = new ExerciseGroup
                {
                    GroupType = sourceGroup.GroupType,
                    RestSeconds = sourceGroup.RestSeconds,
                    SortOrder = sourceGroup.SortOrder
                };
                var exerciseDtos = new List<ExerciseDto>();

                foreach (var sourceExercise in sourceGroup.Exercises)
                {
                    var exercise = new Exercise
                    {
                        Name = sourceExercise.Name,
                        Notes = sourceExercise.Notes,
                        VideoSource = sourceExercise.VideoSource,
                        VideoUrl = sourceExercise.VideoUrl,
                        Tempo = sourceExercise.Tempo,
                        SortOrder = sourceExercise.SortOrder
                    };
                    var setDtos = new List<ExerciseSetDto>();

                    foreach (var sourceSet in sourceExercise.Sets)
                    {
                        var exerciseSet = new ExerciseSet
                        {
                            SetType = sourceSet.SetType,
                            TargetReps = sourceSet.TargetReps,
                            TargetWeight = sourceSet.TargetWeight,
                            TargetRpe = sourceSet.TargetRpe,
                            RestSeconds = sourceSet.RestSeconds,
                            SortOrder = sourceSet.SortOrder
                        };
                        exercise.Sets.Add(exerciseSet);
                        setDtos.Add(new ExerciseSetDto(exerciseSet.Id, exerciseSet.SetType,
                            exerciseSet.TargetReps, exerciseSet.TargetWeight,
                            exerciseSet.TargetRpe, exerciseSet.RestSeconds));
                    }

                    group.Exercises.Add(exercise);
                    exerciseDtos.Add(new ExerciseDto(exercise.Id, exercise.Name, exercise.Notes,
                        exercise.VideoSource, exercise.VideoUrl, exercise.Tempo, setDtos));
                }

                day.ExerciseGroups.Add(group);
                groupDtos.Add(new ExerciseGroupDto(group.Id, group.GroupType, group.RestSeconds, exerciseDtos));
            }

            routine.Days.Add(day);
            dayDtos.Add(new DayDto(day.Id, day.Name, groupDtos));
        }

        db.Routines.Add(routine);
        await db.SaveChangesAsync(cancellationToken);

        return new RoutineDetailDto(routine.Id, routine.Name, routine.Description, dayDtos,
            routine.Tags, routine.Category, routine.CreatedAt, routine.UpdatedAt);
    }
}
