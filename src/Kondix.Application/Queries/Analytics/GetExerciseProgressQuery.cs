using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Analytics;

public sealed record GetExerciseProgressQuery(
    Guid StudentId,
    string ExerciseName) : IRequest<ExerciseProgressDto>;

public sealed class GetExerciseProgressHandler(IKondixDbContext db)
    : IRequestHandler<GetExerciseProgressQuery, ExerciseProgressDto>
{
    public async Task<ExerciseProgressDto> Handle(GetExerciseProgressQuery request, CancellationToken cancellationToken)
    {
        var logs = await db.SetLogs
            .AsNoTracking()
            .Where(sl => sl.StudentId == request.StudentId
                && sl.SnapshotExerciseName == request.ExerciseName
                && sl.Completed)
            .Join(db.WorkoutSessions.AsNoTracking(),
                sl => sl.SessionId,
                ws => ws.Id,
                (sl, ws) => new { ws.StartedAt, sl.ActualWeight, sl.ActualReps })
            .OrderBy(x => x.StartedAt)
            .ToListAsync(cancellationToken);

        var grouped = logs
            .GroupBy(l => l.StartedAt.Date)
            .Select(g => new ExerciseDataPointDto(
                g.Key.ToString("yyyy-MM-dd"),
                g.Max(x => x.ActualWeight),
                g.Sum(x => ParseInt(x.ActualReps)).ToString(),
                g.Count()))
            .ToList();

        return new ExerciseProgressDto(request.ExerciseName, grouped);
    }

    private static int ParseInt(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return 0;
        var cleaned = new string(value.TakeWhile(c => char.IsDigit(c)).ToArray());
        return int.TryParse(cleaned, out var result) ? result : 0;
    }
}
