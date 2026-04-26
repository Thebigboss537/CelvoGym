using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Routines;

public static class RoutineBuilder
{
    /// <summary>
    /// Builds the Day/Block/Exercise/Set entity tree from wizard input and
    /// returns matching DTOs for the response. Unlinked exercise names get
    /// auto-upserted into the trainer's catalog so every routine-exercise
    /// ends up linked to a catalog entry — keeps media + metrics unified.
    /// </summary>
    public static async Task<(List<Day> Entities, List<DayDto> Dtos)> BuildDaysAsync(
        List<CreateDayInput> inputs, IKondixDbContext db, Guid trainerId, CancellationToken ct)
    {
        var entities = new List<Day>();
        var dtos = new List<DayDto>();

        for (var di = 0; di < inputs.Count; di++)
        {
            var dayInput = inputs[di];
            var day = new Day { Name = dayInput.Name, SortOrder = di };
            var blockDtos = new List<ExerciseBlockDto>();

            for (var bi = 0; bi < dayInput.Blocks.Count; bi++)
            {
                var blockInput = dayInput.Blocks[bi];
                var block = new ExerciseBlock
                {
                    BlockType = blockInput.BlockType,
                    RestSeconds = blockInput.RestSeconds,
                    SortOrder = bi
                };
                var exerciseDtos = new List<ExerciseDto>();

                for (var ei = 0; ei < blockInput.Exercises.Count; ei++)
                {
                    var exInput = blockInput.Exercises[ei];
                    var catalogId = await EnsureCatalogEntryAsync(
                        db, trainerId, exInput.Name, exInput.CatalogExerciseId, ct);

                    var exercise = new Exercise
                    {
                        Name = exInput.Name,
                        Notes = exInput.Notes,
                        Tempo = exInput.Tempo,
                        CatalogExerciseId = catalogId,
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

                    block.Exercises.Add(exercise);
                    // Media fields (VideoSource/VideoUrl/ImageUrl/MuscleGroup) come from the catalog join
                    // on GET — write-paths return nulls. Client merges from its catalog cache.
                    exerciseDtos.Add(new ExerciseDto(exercise.Id, exercise.Name, exercise.Notes,
                        exercise.Tempo, exercise.CatalogExerciseId,
                        VideoSource.None, null, null, null, setDtos));
                }

                day.Blocks.Add(block);
                blockDtos.Add(new ExerciseBlockDto(block.Id, block.BlockType, block.RestSeconds, exerciseDtos));
            }

            entities.Add(day);
            dtos.Add(new DayDto(day.Id, day.Name, blockDtos));
        }

        return (entities, dtos);
    }

    /// <summary>
    /// Returns the linked catalog id if already set; otherwise looks up the
    /// trainer's catalog by a case-insensitive name match and returns that id;
    /// otherwise creates a new catalog entry and returns its id. The entry is
    /// Add'ed to the context — the outer SaveChangesAsync persists it.
    /// </summary>
    private static async Task<Guid?> EnsureCatalogEntryAsync(
        IKondixDbContext db, Guid trainerId, string name, Guid? catalogExerciseId,
        CancellationToken ct)
    {
        if (catalogExerciseId is Guid existing) return existing;

        var trimmed = name.Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;

        var lowered = trimmed.ToLowerInvariant();
        var match = await db.CatalogExercises
            .Where(c => c.TrainerId == trainerId && c.IsActive && c.Name.ToLower() == lowered)
            .Select(c => (Guid?)c.Id)
            .FirstOrDefaultAsync(ct);
        if (match is Guid found) return found;

        var entity = new CatalogExercise
        {
            TrainerId = trainerId,
            Name = trimmed,
            IsActive = true,
            UpdatedAt = DateTimeOffset.UtcNow,
            VideoSource = VideoSource.None,
        };
        db.CatalogExercises.Add(entity);
        return entity.Id;
    }
}
