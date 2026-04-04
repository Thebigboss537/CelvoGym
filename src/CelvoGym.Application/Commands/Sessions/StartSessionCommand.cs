using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Sessions;

public sealed record StartSessionCommand(
    Guid StudentId,
    Guid RoutineId,
    Guid DayId) : IRequest<WorkoutSessionDto>;

public sealed class StartSessionHandler(ICelvoGymDbContext db)
    : IRequestHandler<StartSessionCommand, WorkoutSessionDto>
{
    public async Task<WorkoutSessionDto> Handle(StartSessionCommand request, CancellationToken cancellationToken)
    {
        var assignment = await db.RoutineAssignments
            .FirstOrDefaultAsync(ra => ra.RoutineId == request.RoutineId
                && ra.StudentId == request.StudentId
                && ra.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Routine not assigned to this student");

        var dayExists = await db.Days
            .AnyAsync(d => d.Id == request.DayId && d.RoutineId == request.RoutineId, cancellationToken);
        if (!dayExists) throw new InvalidOperationException("Day not found in this routine");

        var activeSession = await db.WorkoutSessions
            .FirstOrDefaultAsync(ws => ws.StudentId == request.StudentId
                && ws.DayId == request.DayId
                && ws.AssignmentId == assignment.Id
                && ws.CompletedAt == null, cancellationToken);

        if (activeSession is not null)
        {
            return new WorkoutSessionDto(activeSession.Id, activeSession.RoutineId,
                activeSession.DayId, activeSession.StartedAt, activeSession.CompletedAt,
                activeSession.Notes);
        }

        var session = new WorkoutSession
        {
            StudentId = request.StudentId,
            AssignmentId = assignment.Id,
            RoutineId = request.RoutineId,
            DayId = request.DayId,
            StartedAt = DateTimeOffset.UtcNow
        };

        db.WorkoutSessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);

        return new WorkoutSessionDto(session.Id, session.RoutineId, session.DayId,
            session.StartedAt, session.CompletedAt, session.Notes);
    }
}
