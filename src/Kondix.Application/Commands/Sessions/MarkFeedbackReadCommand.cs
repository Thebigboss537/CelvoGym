using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Sessions;

public sealed record MarkFeedbackReadCommand(Guid StudentId) : IRequest;

public sealed class MarkFeedbackReadCommandHandler(IKondixDbContext db)
    : IRequestHandler<MarkFeedbackReadCommand>
{
    public async Task Handle(MarkFeedbackReadCommand request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var sessions = await db.WorkoutSessions
            .Where(s => s.StudentId == request.StudentId
                && s.CompletedAt != null
                && s.FeedbackReviewedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var s in sessions) s.FeedbackReviewedAt = now;
        if (sessions.Count > 0) await db.SaveChangesAsync(cancellationToken);
    }
}
