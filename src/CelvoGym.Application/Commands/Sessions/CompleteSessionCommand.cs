using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Sessions;

public sealed record CompleteSessionCommand(
    Guid SessionId,
    Guid StudentId,
    string? Notes) : IRequest<WorkoutSessionDto>;

public sealed class CompleteSessionHandler(ICelvoGymDbContext db)
    : IRequestHandler<CompleteSessionCommand, WorkoutSessionDto>
{
    public async Task<WorkoutSessionDto> Handle(CompleteSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await db.WorkoutSessions
            .FirstOrDefaultAsync(ws => ws.Id == request.SessionId
                && ws.StudentId == request.StudentId, cancellationToken)
            ?? throw new InvalidOperationException("Session not found");

        if (session.CompletedAt is not null)
            throw new InvalidOperationException("Session already completed");

        session.CompletedAt = DateTimeOffset.UtcNow;
        session.Notes = request.Notes;

        await db.SaveChangesAsync(cancellationToken);

        return new WorkoutSessionDto(session.Id, session.RoutineId, session.DayId,
            session.StartedAt, session.CompletedAt, session.Notes);
    }
}
