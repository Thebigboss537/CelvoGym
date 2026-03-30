using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using CelvoGym.Domain.Enums;
using MediatR;

namespace CelvoGym.Application.Commands.Routines;

public sealed record CreateRoutineCommand(
    Guid TrainerId,
    string Name,
    string? Description,
    List<CreateDayInput> Days) : IRequest<RoutineDetailDto>;

public sealed record CreateDayInput(
    string Name,
    List<CreateExerciseGroupInput> Groups);

public sealed record CreateExerciseGroupInput(
    GroupType GroupType,
    int RestSeconds,
    List<CreateExerciseInput> Exercises);

public sealed record CreateExerciseInput(
    string Name,
    string? Notes,
    VideoSource VideoSource,
    string? VideoUrl,
    string? Tempo,
    List<CreateExerciseSetInput> Sets);

public sealed record CreateExerciseSetInput(
    SetType SetType,
    string? TargetReps,
    string? TargetWeight,
    int? TargetRpe,
    int? RestSeconds);

public sealed class CreateRoutineHandler(ICelvoGymDbContext db)
    : IRequestHandler<CreateRoutineCommand, RoutineDetailDto>
{
    public async Task<RoutineDetailDto> Handle(CreateRoutineCommand request, CancellationToken cancellationToken)
    {
        var routine = new Routine
        {
            TrainerId = request.TrainerId,
            Name = request.Name,
            Description = request.Description,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var dayDtos = new List<DayDto>();

        for (var di = 0; di < request.Days.Count; di++)
        {
            var dayInput = request.Days[di];
            var day = new Day
            {
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

            routine.Days.Add(day);
            dayDtos.Add(new DayDto(day.Id, day.Name, groupDtos));
        }

        db.Routines.Add(routine);
        await db.SaveChangesAsync(cancellationToken);

        return new RoutineDetailDto(routine.Id, routine.Name, routine.Description,
            dayDtos, routine.CreatedAt, routine.UpdatedAt);
    }
}
