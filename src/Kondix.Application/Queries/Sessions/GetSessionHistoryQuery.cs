using Kondix.Application.Common.Helpers;
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Sessions;

public sealed record GetSessionHistoryQuery(
    Guid StudentId,
    Guid RoutineId,
    Guid DayId) : IRequest<List<SessionSummaryDto>>;

public sealed class GetSessionHistoryHandler(IKondixDbContext db)
    : IRequestHandler<GetSessionHistoryQuery, List<SessionSummaryDto>>
{
    public async Task<List<SessionSummaryDto>> Handle(GetSessionHistoryQuery request, CancellationToken cancellationToken)
    {
        var dayName = await db.Days
            .AsNoTracking()
            .Where(d => d.Id == request.DayId)
            .Select(d => d.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? "";

        var sessions = await db.WorkoutSessions
            .AsNoTracking()
            .Where(ws => ws.StudentId == request.StudentId
                && ws.RoutineId == request.RoutineId
                && ws.DayId == request.DayId)
            .OrderByDescending(ws => ws.StartedAt)
            .ToListAsync(cancellationToken);

        var sessionIds = sessions.Select(s => s.Id).ToList();

        var statsMap = await SetLogStatsHelper.GetEffectiveSetStatsAsync(db, sessionIds, cancellationToken);

        return sessions.Select(s =>
        {
            statsMap.TryGetValue(s.Id, out var stats);
            var durationMinutes = s.CompletedAt.HasValue
                ? (int)(s.CompletedAt.Value - s.StartedAt).TotalMinutes
                : (int?)null;

            return new SessionSummaryDto(
                s.Id,
                s.StartedAt.ToString("yyyy-MM-dd"),
                dayName,
                s.CompletedAt.HasValue ? "completed" : "in_progress",
                stats.Completed,
                stats.Total,
                durationMinutes);
        }).ToList();
    }
}
