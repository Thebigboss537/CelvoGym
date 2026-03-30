using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Routines;

public sealed record UpdateRoutineCommand(
    Guid RoutineId,
    Guid TrainerId,
    string Name,
    string? Description,
    List<CreateDayInput> Days) : IRequest<RoutineDetailDto>;

public sealed class UpdateRoutineHandler(ICelvoGymDbContext db)
    : IRequestHandler<UpdateRoutineCommand, RoutineDetailDto>
{
    public async Task<RoutineDetailDto> Handle(UpdateRoutineCommand request, CancellationToken cancellationToken)
    {
        var routine = await db.Routines
            .Include(r => r.Days)
                .ThenInclude(d => d.ExerciseGroups)
                    .ThenInclude(g => g.Exercises)
                        .ThenInclude(e => e.Sets)
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId
                && r.TrainerId == request.TrainerId
                && r.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Routine not found");

        // Full replace: remove old days (cascade deletes groups, exercises, sets)
        db.Days.RemoveRange(routine.Days);

        routine.Name = request.Name;
        routine.Description = request.Description;
        routine.UpdatedAt = DateTimeOffset.UtcNow;

        var dayDtos = new List<DayDto>();

        for (var di = 0; di < request.Days.Count; di++)
        {
            var dayInput = request.Days[di];
            var day = new Day
            {
                RoutineId = routine.Id,
                Name = dayInput.Name,
                SortOrder = di
            };

            var groupDtos = new List<ExerciseGroupDto>();

            for (var gi = 0; gi < dayInput.Groups.Count; gi++)
            {
                var groupInput = dayInput.Groups[gi];
                var group = new ExerciseGroup
                {
                    GroupType = groupInput.GroupType,
                    RestSeconds = groupInput.RestSeconds,
                    SortOrder = gi
                };

                var exerciseDtos = new List<ExerciseDto>();

                for (var ei = 0; ei < groupInput.Exercises.Count; ei++)
                {
                    var exInput = groupInput.Exercises[ei];
                    var exercise = new Exercise
                    {
                        Name = exInput.Name,
                        Notes = exInput.Notes,
                        VideoSource = exInput.VideoSource,
                        VideoUrl = exInput.VideoUrl,
                        Tempo = exInput.Tempo,
                        SortOrder = ei
                    };

                    var setDtos = new List<ExerciseSetDto>();

                    for (var si = 0; si < exInput.Sets.Count; si++)
                    {
                        var setInput = exInput.Sets[si];
                        var exerciseSet = new ExerciseSet
                        {
                            SetType = setInput.SetType,
                            TargetReps = setInput.TargetReps,
                            TargetWeight = setInput.TargetWeight,
                            TargetRpe = setInput.TargetRpe,
                            RestSeconds = setInput.RestSeconds,
                            SortOrder = si
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

            db.Days.Add(day);
            dayDtos.Add(new DayDto(day.Id, day.Name, groupDtos));
        }

        await db.SaveChangesAsync(cancellationToken);

        return new RoutineDetailDto(routine.Id, routine.Name, routine.Description,
            dayDtos, routine.CreatedAt, routine.UpdatedAt);
    }
}
