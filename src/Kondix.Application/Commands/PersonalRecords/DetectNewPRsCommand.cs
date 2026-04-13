using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.PersonalRecords;

public sealed record DetectNewPRsCommand(
    Guid StudentId,
    Guid SessionId) : IRequest<List<NewPrDto>>;

public sealed class DetectNewPRsCommandHandler(IKondixDbContext db)
    : IRequestHandler<DetectNewPRsCommand, List<NewPrDto>>
{
    public async Task<List<NewPrDto>> Handle(DetectNewPRsCommand request, CancellationToken cancellationToken)
    {
        var sessionLogs = await db.SetLogs
            .AsNoTracking()
            .Where(sl => sl.SessionId == request.SessionId && sl.Completed && sl.ActualWeight != null)
            .Select(sl => new { sl.SnapshotExerciseName, sl.ActualWeight })
            .ToListAsync(cancellationToken);

        if (sessionLogs.Count == 0) return [];

        var exerciseMaxes = sessionLogs
            .Where(sl => sl.SnapshotExerciseName != null)
            .GroupBy(sl => sl.SnapshotExerciseName!)
            .Select(g => new { ExerciseName = g.Key, MaxWeight = g.Max(x => ParseWeight(x.ActualWeight)), RawWeight = g.OrderByDescending(x => ParseWeight(x.ActualWeight)).First().ActualWeight })
            .Where(x => x.MaxWeight > 0)
            .ToList();

        if (exerciseMaxes.Count == 0) return [];

        var exerciseNames = exerciseMaxes.Select(e => e.ExerciseName).ToList();
        var existingPRs = await db.PersonalRecords
            .Where(pr => pr.StudentId == request.StudentId && exerciseNames.Contains(pr.ExerciseName))
            .ToDictionaryAsync(pr => pr.ExerciseName, cancellationToken);

        var newPRs = new List<NewPrDto>();
        var now = DateTimeOffset.UtcNow;

        foreach (var ex in exerciseMaxes)
        {
            var currentMax = ex.MaxWeight;
            string? previousWeight = null;

            if (existingPRs.TryGetValue(ex.ExerciseName, out var existing))
            {
                var existingMax = ParseWeight(existing.Weight);
                if (currentMax <= existingMax) continue;

                previousWeight = existing.Weight;
                existing.Weight = ex.RawWeight!;
                existing.AchievedAt = now;
                existing.SessionId = request.SessionId;
            }
            else
            {
                db.PersonalRecords.Add(new PersonalRecord
                {
                    StudentId = request.StudentId,
                    ExerciseName = ex.ExerciseName,
                    Weight = ex.RawWeight!,
                    AchievedAt = now,
                    SessionId = request.SessionId
                });
            }

            newPRs.Add(new NewPrDto(ex.ExerciseName, ex.RawWeight!, previousWeight));
        }

        if (newPRs.Count > 0)
            await db.SaveChangesAsync(cancellationToken);

        return newPRs;
    }

    private static decimal ParseWeight(string? weight)
    {
        if (string.IsNullOrWhiteSpace(weight)) return 0;
        var cleaned = new string(weight.Where(c => char.IsDigit(c) || c == '.' || c == ',').ToArray())
            .Replace(',', '.');
        return decimal.TryParse(cleaned, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var result) ? result : 0;
    }
}
