using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;

namespace Kondix.Application.Commands.Routines;

public static class RoutineBuilder
{
    public static (List<Day> Entities, List<DayDto> Dtos) BuildDays(List<CreateDayInput> inputs)
    {
        var entities = new List<Day>();
        var dtos = new List<DayDto>();

        for (var di = 0; di < inputs.Count; di++)
        {
            var dayInput = inputs[di];
            var day = new Day { Name = dayInput.Name, SortOrder = di };
            var groupDtos = new List<ExerciseBlockDto>();

            for (var gi = 0; gi < dayInput.Blocks.Count; gi++)
            {
                var groupInput = dayInput.Blocks[gi];
                var group = new ExerciseBlock
                {
                    BlockType = groupInput.BlockType,
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
                        Tempo = exInput.Tempo,
                        CatalogExerciseId = exInput.CatalogExerciseId,
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
                    // Media fields (VideoSource/VideoUrl/ImageUrl) come from the catalog join
                    // on GET — write-paths return nulls. Client merges from its catalog cache.
                    exerciseDtos.Add(new ExerciseDto(exercise.Id, exercise.Name, exercise.Notes,
                        exercise.Tempo, exercise.CatalogExerciseId,
                        VideoSource.None, null, null, setDtos));
                }

                day.Blocks.Add(group);
                groupDtos.Add(new ExerciseBlockDto(group.Id, group.BlockType, group.RestSeconds, exerciseDtos));
            }

            entities.Add(day);
            dtos.Add(new DayDto(day.Id, day.Name, groupDtos));
        }

        return (entities, dtos);
    }
}
