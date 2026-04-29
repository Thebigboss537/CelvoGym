using Kondix.Application.Common.Helpers;
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Analytics;

public sealed record GetStudentOverviewQuery(
    Guid StudentId,
    Guid TrainerId) : IRequest<StudentOverviewDto>;

public sealed class GetStudentOverviewHandler(IKondixDbContext db)
    : IRequestHandler<GetStudentOverviewQuery, StudentOverviewDto>
{
    public async Task<StudentOverviewDto> Handle(GetStudentOverviewQuery request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var weekAgo = now.AddDays(-7);
        var eightWeeksAgo = now.AddDays(-56);

        var sessions = await db.WorkoutSessions
            .AsNoTracking()
            .Where(ws => ws.StudentId == request.StudentId && ws.CompletedAt != null && ws.StartedAt >= eightWeeksAgo)
            .Select(ws => new { ws.Id, ws.StartedAt })
            .ToListAsync(cancellationToken);

        var totalSessions = sessions.Count;
        var sessionsThisWeek = sessions.Count(s => s.StartedAt >= weekAgo);

        // Adherence: sessions per week vs expected (from ProgramAssignment)
        var programAssignment = await db.ProgramAssignments
            .AsNoTracking()
            .Where(pa => pa.StudentId == request.StudentId
                && pa.Status == Domain.Enums.ProgramAssignmentStatus.Active)
            .FirstOrDefaultAsync(cancellationToken);

        // TODO Phase 5: restore expected days per week from v3 ProgramAssignment shape (TrainingDays removed).
        var expectedPerWeek = 3;
        var weeks = Math.Max(1, (int)Math.Ceiling((now - eightWeeksAgo).TotalDays / 7.0));
        var adherence = expectedPerWeek * weeks > 0
            ? Math.Min(100, totalSessions * 100 / (expectedPerWeek * weeks))
            : 0;

        var sessionIds = sessions.Select(s => s.Id).ToList();
        var statsMap = await SetLogStatsHelper.GetEffectiveSetStatsAsync(db, sessionIds, cancellationToken);

        var weeklyVolume = sessions
            .GroupBy(s => StartOfWeek(s.StartedAt))
            .OrderBy(g => g.Key)
            .Select(g => new WeeklyVolumeDto(
                g.Key.ToString("yyyy-MM-dd"),
                g.Count(),
                g.Sum(s => statsMap.TryGetValue(s.Id, out var stats) ? stats.Completed : 0)))
            .ToList();

        return new StudentOverviewDto(totalSessions, sessionsThisWeek, adherence, weeklyVolume);
    }

    private static DateTime StartOfWeek(DateTimeOffset date)
    {
        var d = date.Date;
        var diff = (7 + (d.DayOfWeek - DayOfWeek.Monday)) % 7;
        return d.AddDays(-diff);
    }
}
