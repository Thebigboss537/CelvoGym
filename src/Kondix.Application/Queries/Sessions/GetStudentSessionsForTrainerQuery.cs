using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Sessions;

// ─── DTOs ──────────────────────────────────────────────────────────────────

public sealed record TrainerSessionSetDto(
    string Weight,
    int Reps,
    bool IsPR,
    string? Note,
    string SetType);

public sealed record TrainerSessionExerciseDto(
    Guid ExerciseId,
    string Name,
    string? MuscleGroup,
    string? ImageUrl,
    int? ActualRpe,
    string? Notes,
    List<TrainerSessionSetDto> Sets);

public sealed record TrainerSessionDto(
    Guid SessionId,
    string RoutineName,
    string DayName,
    DateTimeOffset StartedAt,
    DateTimeOffset? CompletedAt,
    string? Mood,
    string? Notes,
    string Status,
    List<TrainerSessionExerciseDto> Exercises);

// ─── Query ─────────────────────────────────────────────────────────────────

public sealed record GetStudentSessionsForTrainerQuery(
    Guid TrainerId,
    Guid StudentId) : IRequest<List<TrainerSessionDto>>;

public sealed class GetStudentSessionsForTrainerHandler(IKondixDbContext db)
    : IRequestHandler<GetStudentSessionsForTrainerQuery, List<TrainerSessionDto>>
{
    private const int MaxSessions = 30;

    public async Task<List<TrainerSessionDto>> Handle(
        GetStudentSessionsForTrainerQuery request,
        CancellationToken cancellationToken)
    {
        // Verify trainer-student relationship
        var hasAccess = await db.TrainerStudents
            .AnyAsync(ts => ts.TrainerId == request.TrainerId
                && ts.StudentId == request.StudentId
                && ts.IsActive, cancellationToken);

        if (!hasAccess)
            throw new InvalidOperationException("Student not found");

        // Fetch sessions (last 30, ordered DESC)
        var sessions = await db.WorkoutSessions
            .AsNoTracking()
            .Where(ws => ws.StudentId == request.StudentId)
            .OrderByDescending(ws => ws.StartedAt)
            .Take(MaxSessions)
            .Select(ws => new
            {
                ws.Id,
                RoutineName = ws.Routine.Name,
                DayName = ws.Day.Name,
                ws.StartedAt,
                ws.CompletedAt,
                ws.Mood,
                ws.Notes,
            })
            .ToListAsync(cancellationToken);

        if (sessions.Count == 0)
            return [];

        var sessionIds = sessions.Select(s => s.Id).ToList();

        // Fetch all COMPLETED set logs for these sessions
        var setLogs = await db.SetLogs
            .AsNoTracking()
            .Where(sl => sessionIds.Contains(sl.SessionId) && sl.Completed)
            .Select(sl => new
            {
                sl.SessionId,
                sl.SnapshotExerciseName,
                sl.ActualWeight,
                sl.ActualReps,
                sl.Notes,
                SetType = sl.Set != null ? sl.Set.SetType.ToString() : "Effective",
                ExerciseId = sl.Set != null ? sl.Set.ExerciseId : (Guid?)null,
            })
            .ToListAsync(cancellationToken);

        // Fetch exercise feedback (RPE + notes per exercise per session)
        var feedbacks = await db.ExerciseFeedback
            .AsNoTracking()
            .Where(f => sessionIds.Contains(f.SessionId))
            .Select(f => new
            {
                f.SessionId,
                f.ExerciseId,
                f.ActualRpe,
                f.Notes,
            })
            .ToListAsync(cancellationToken);

        // Collect all exercise IDs to fetch in one query
        var exerciseIdsFromLogs = setLogs
            .Where(sl => sl.ExerciseId.HasValue)
            .Select(sl => sl.ExerciseId!.Value);
        var exerciseIdsFromFeedback = feedbacks.Select(f => f.ExerciseId);
        var allExerciseIds = exerciseIdsFromLogs.Union(exerciseIdsFromFeedback).Distinct().ToList();

        // Fetch exercise details including catalog info for muscleGroup + imageUrl
        var exercises = await db.Exercises
            .AsNoTracking()
            .Where(e => allExerciseIds.Contains(e.Id))
            .Select(e => new
            {
                e.Id,
                e.Name,
                MuscleGroup = e.CatalogExercise != null ? e.CatalogExercise.MuscleGroup : null,
                ImageUrl = e.CatalogExercise != null ? e.CatalogExercise.ImageUrl : null,
            })
            .ToListAsync(cancellationToken);

        var exerciseMap = exercises.ToDictionary(e => e.Id);

        // Fetch personal records for PR detection
        // Dictionary: exerciseName → best weight (decimal, InvariantCulture)
        var personalRecords = await db.PersonalRecords
            .AsNoTracking()
            .Where(pr => pr.StudentId == request.StudentId)
            .Select(pr => new { pr.ExerciseName, pr.Weight })
            .ToListAsync(cancellationToken);

        var prByName = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        foreach (var pr in personalRecords)
        {
            if (decimal.TryParse(pr.Weight, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var w))
            {
                if (!prByName.TryGetValue(pr.ExerciseName, out var existing) || w > existing)
                    prByName[pr.ExerciseName] = w;
            }
        }

        // Build lookups
        var logsBySession = setLogs.ToLookup(sl => sl.SessionId);
        var feedbackBySession = feedbacks.ToLookup(f => f.SessionId);
        var feedbackBySessionExercise = feedbacks
            .GroupBy(f => (f.SessionId, f.ExerciseId))
            .ToDictionary(g => g.Key, g => g.First());

        // Project each session
        var result = new List<TrainerSessionDto>(sessions.Count);

        foreach (var s in sessions)
        {
            // Status rule (MVP): "completed" if CompletedAt has value, else "partial"
            // (no time-based "missed" threshold — an uncompleted session stays "partial")
            var status = s.CompletedAt.HasValue ? "completed" : "partial";

            var sessionLogs = logsBySession[s.Id].ToList();

            // Group logs by exerciseId (as string key) or fall back to snapshot name
            var byExercise = sessionLogs
                .GroupBy(sl => sl.ExerciseId.HasValue
                    ? sl.ExerciseId.Value.ToString()
                    : (sl.SnapshotExerciseName ?? "Unknown"))
                .ToList();

            var exerciseDtos = new List<TrainerSessionExerciseDto>();
            var coveredExerciseIds = new HashSet<Guid>();

            foreach (var group in byExercise)
            {
                // Resolve exercise ID and metadata
                Guid? exId = Guid.TryParse(group.Key, out var parsedId) ? parsedId : null;

                string exName;
                string? exMuscleGroup;
                string? exImageUrl;

                if (exId.HasValue && exerciseMap.TryGetValue(exId.Value, out var exInfo))
                {
                    exName = exInfo.Name;
                    exMuscleGroup = exInfo.MuscleGroup;
                    exImageUrl = exInfo.ImageUrl;
                    coveredExerciseIds.Add(exId.Value);
                }
                else
                {
                    exName = group.First().SnapshotExerciseName ?? "Ejercicio";
                    exMuscleGroup = null;
                    exImageUrl = null;
                }

                // Get feedback for this (session, exercise)
                int? actualRpe = null;
                string? exFeedbackNotes = null;
                if (exId.HasValue && feedbackBySessionExercise.TryGetValue((s.Id, exId.Value), out var fb))
                {
                    actualRpe = fb.ActualRpe;
                    exFeedbackNotes = fb.Notes;
                }

                // PR detection:
                // 1. Parse each set's weight.
                // 2. Find the max weight in this exercise group for this session.
                // 3. If that max weight >= the student's overall PR for this exercise name,
                //    mark the FIRST set with that max weight as isPR=true (only one per group).
                var snapshotName = group.First().SnapshotExerciseName ?? exName;
                var setsWithWeights = group.Select(sl =>
                {
                    decimal.TryParse(sl.ActualWeight,
                        System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture,
                        out var w);
                    return (sl, weight: w);
                }).ToList();

                var maxWeightInGroup = setsWithWeights.Count > 0
                    ? setsWithWeights.Max(x => x.weight)
                    : 0m;

                var hasPr = maxWeightInGroup > 0
                    && prByName.TryGetValue(snapshotName, out var prWeight)
                    && maxWeightInGroup >= prWeight;

                bool prMarked = false;
                var setDtos = setsWithWeights.Select(x =>
                {
                    var isPR = hasPr && !prMarked && x.weight == maxWeightInGroup;
                    if (isPR) prMarked = true;

                    int.TryParse(x.sl.ActualReps,
                        System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture,
                        out var reps);

                    return new TrainerSessionSetDto(
                        Weight: x.sl.ActualWeight ?? "—",
                        Reps: reps,
                        IsPR: isPR,
                        Note: x.sl.Notes,
                        SetType: x.sl.SetType);
                }).ToList();

                exerciseDtos.Add(new TrainerSessionExerciseDto(
                    ExerciseId: exId ?? Guid.Empty,
                    Name: exName,
                    MuscleGroup: exMuscleGroup,
                    ImageUrl: exImageUrl,
                    ActualRpe: actualRpe,
                    Notes: exFeedbackNotes,
                    Sets: setDtos));
            }

            // Append feedback-only exercises (feedback exists but no set logs were logged)
            foreach (var fb2 in feedbackBySession[s.Id].Where(f => !coveredExerciseIds.Contains(f.ExerciseId)))
            {
                exerciseMap.TryGetValue(fb2.ExerciseId, out var exInfo2);
                exerciseDtos.Add(new TrainerSessionExerciseDto(
                    ExerciseId: fb2.ExerciseId,
                    Name: exInfo2?.Name ?? "Ejercicio",
                    MuscleGroup: exInfo2?.MuscleGroup,
                    ImageUrl: exInfo2?.ImageUrl,
                    ActualRpe: fb2.ActualRpe,
                    Notes: fb2.Notes,
                    Sets: []));
            }

            result.Add(new TrainerSessionDto(
                SessionId: s.Id,
                RoutineName: s.RoutineName,
                DayName: s.DayName,
                StartedAt: s.StartedAt,
                CompletedAt: s.CompletedAt,
                Mood: s.Mood?.ToString(),
                Notes: s.Notes,
                Status: status,
                Exercises: exerciseDtos));
        }

        return result;
    }
}
