using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Sessions;

public sealed record CompleteSessionCommand(
    Guid SessionId,
    Guid StudentId,
    string? Notes,
    MoodType? Mood) : IRequest<WorkoutSessionDto>;

public sealed class CompleteSessionHandler(IKondixDbContext db)
    : IRequestHandler<CompleteSessionCommand, WorkoutSessionDto>
{
    public async Task<WorkoutSessionDto> Handle(CompleteSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await db.WorkoutSessions
            .FirstOrDefaultAsync(ws => ws.Id == request.SessionId
                && ws.StudentId == request.StudentId, cancellationToken)
            ?? throw new InvalidOperationException("Session not found");

        var firstCompletion = session.CompletedAt is null;
        if (firstCompletion) session.CompletedAt = DateTimeOffset.UtcNow;

        session.Notes = request.Notes;
        session.Mood = request.Mood;

        // TODO Phase 5: advance rotation index and auto-complete assignment on first completion
        // Removed because ProgramAssignment.Mode, RotationIndex, EndDate, CompletedAt no longer exist in v3.

        await db.SaveChangesAsync(cancellationToken);

        return new WorkoutSessionDto(session.Id, session.RoutineId, session.DayId,
            session.StartedAt, session.CompletedAt, session.Notes);
    }
}
