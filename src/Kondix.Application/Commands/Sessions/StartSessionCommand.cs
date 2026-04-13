using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Sessions;

public sealed record StartSessionCommand(
    Guid StudentId,
    Guid RoutineId,
    Guid DayId) : IRequest<WorkoutSessionDto>;

public sealed class StartSessionHandler(IKondixDbContext db)
    : IRequestHandler<StartSessionCommand, WorkoutSessionDto>
{
    public async Task<WorkoutSessionDto> Handle(StartSessionCommand request, CancellationToken cancellationToken)
    {
        // Find active ProgramAssignment that contains this routine
        var programAssignment = await db.ProgramAssignments
            .AsNoTracking()
            .FirstOrDefaultAsync(pa => pa.StudentId == request.StudentId
                && pa.Status == ProgramAssignmentStatus.Active
                && pa.Program.ProgramRoutines.Any(pr => pr.RoutineId == request.RoutineId),
                cancellationToken)
            ?? throw new InvalidOperationException("Routine not assigned to this student");

        var dayExists = await db.Days
            .AnyAsync(d => d.Id == request.DayId && d.RoutineId == request.RoutineId, cancellationToken);
        if (!dayExists) throw new InvalidOperationException("Day not found in this routine");

        // Check for existing active session for this day
        var activeSession = await db.WorkoutSessions
            .FirstOrDefaultAsync(ws => ws.StudentId == request.StudentId
                && ws.DayId == request.DayId
                && ws.ProgramAssignmentId == programAssignment.Id
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
            ProgramAssignmentId = programAssignment.Id,
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
