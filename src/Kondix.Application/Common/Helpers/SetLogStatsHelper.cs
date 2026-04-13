using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Common.Helpers;

public static class SetLogStatsHelper
{
    public static async Task<Dictionary<Guid, (int Total, int Completed)>> GetEffectiveSetStatsAsync(
        ICelvoGymDbContext db, List<Guid> sessionIds, CancellationToken ct)
    {
        var stats = await db.SetLogs
            .AsNoTracking()
            .Where(sl => sessionIds.Contains(sl.SessionId) && sl.SetId != null)
            .Join(db.ExerciseSets.AsNoTracking(),
                sl => sl.SetId, es => es.Id,
                (sl, es) => new { sl.SessionId, sl.Completed, es.SetType })
            .Where(x => x.SetType != SetType.Warmup)
            .GroupBy(x => x.SessionId)
            .Select(g => new { SessionId = g.Key, Total = g.Count(), Completed = g.Count(x => x.Completed) })
            .ToListAsync(ct);

        return stats.ToDictionary(s => s.SessionId, s => (s.Total, s.Completed));
    }
}
