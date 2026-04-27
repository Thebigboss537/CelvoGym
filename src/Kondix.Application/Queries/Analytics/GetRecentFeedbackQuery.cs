using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Analytics;

public sealed record GetRecentFeedbackQuery(Guid TrainerId, Guid StudentId) : IRequest<RecentFeedbackDto>;

public sealed record RecentFeedbackSessionDto(
    Guid SessionId,
    string RoutineName,
    DateTimeOffset CompletedAt,
    string? Mood,
    bool HasNotes);

public sealed record RecentFeedbackDto(int UnreadCount, List<RecentFeedbackSessionDto> Sessions);

public sealed class GetRecentFeedbackQueryHandler(IKondixDbContext db)
    : IRequestHandler<GetRecentFeedbackQuery, RecentFeedbackDto>
{
    public async Task<RecentFeedbackDto> Handle(GetRecentFeedbackQuery request, CancellationToken cancellationToken)
    {
        // Verify trainer-student relationship
        var hasAccess = await db.TrainerStudents
            .AnyAsync(ts => ts.TrainerId == request.TrainerId
                && ts.StudentId == request.StudentId
                && ts.IsActive, cancellationToken);

        if (!hasAccess)
            throw new InvalidOperationException("Student not found");

        var unread = db.WorkoutSessions
            .AsNoTracking()
            .Where(s => s.StudentId == request.StudentId
                && s.CompletedAt != null
                && s.FeedbackReviewedAt == null
                && (s.Mood != null
                    || s.Notes != null
                    || db.ExerciseFeedback.Any(f => f.SessionId == s.Id)
                    || db.SetLogs.Any(sl => sl.SessionId == s.Id && sl.Notes != null)));

        var count = await unread.CountAsync(cancellationToken);

        var sessions = await unread
            .OrderByDescending(s => s.CompletedAt)
            .Take(5)
            .Select(s => new RecentFeedbackSessionDto(
                s.Id,
                s.Routine.Name,
                s.CompletedAt!.Value,
                s.Mood == null ? null : s.Mood.ToString(),
                s.Notes != null))
            .ToListAsync(cancellationToken);

        return new RecentFeedbackDto(count, sessions);
    }
}
