using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Sessions;

public sealed record UpsertExerciseFeedbackCommand(
    Guid StudentId,
    Guid SessionId,
    Guid ExerciseId,
    int ActualRpe,
    string? Notes) : IRequest;

public sealed class UpsertExerciseFeedbackCommandHandler(IKondixDbContext db)
    : IRequestHandler<UpsertExerciseFeedbackCommand>
{
    public async Task Handle(UpsertExerciseFeedbackCommand request, CancellationToken cancellationToken)
    {
        var session = await db.WorkoutSessions
            .FirstOrDefaultAsync(s => s.Id == request.SessionId && s.StudentId == request.StudentId, cancellationToken)
            ?? throw new InvalidOperationException("Session not found");
        if (session.CompletedAt is not null)
            throw new InvalidOperationException("Session not active");

        var existing = await db.ExerciseFeedback.FirstOrDefaultAsync(
            f => f.SessionId == request.SessionId && f.ExerciseId == request.ExerciseId, cancellationToken);

        if (existing is null)
        {
            db.ExerciseFeedback.Add(new ExerciseFeedback
            {
                SessionId = request.SessionId,
                ExerciseId = request.ExerciseId,
                ActualRpe = request.ActualRpe,
                Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            });
        }
        else
        {
            existing.ActualRpe = request.ActualRpe;
            existing.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
