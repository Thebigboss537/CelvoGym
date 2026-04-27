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
    Guid DayId,
    DateOnly? RecoversPlannedDate = null) : IRequest<WorkoutSessionDto>;

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

        // Recovery-flow validations
        bool isRecovery = false;
        if (request.RecoversPlannedDate is not null)
        {
            var plannedDate = request.RecoversPlannedDate.Value;
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // Validate planned date is within the 2-day recovery window [today-2, today-1]
            var daysDiff = today.DayNumber - plannedDate.DayNumber;
            if (daysDiff < 1 || daysDiff > 2)
                throw new InvalidOperationException(
                    $"Recovery planned date {plannedDate} is outside the 2-day recovery window. " +
                    "Only yesterday or 2 days ago are eligible.");

            // Validate the planned date's weekday is a configured training day
            var dow = (int)plannedDate.DayOfWeek;
            if (!programAssignment.TrainingDays.Contains(dow))
                throw new InvalidOperationException(
                    $"The planned date {plannedDate} (weekday {dow}) is not a configured training day for this assignment.");

            // Load recent sessions (from plannedDate onwards) to check for honoring
            var windowStart = new DateTimeOffset(
                plannedDate.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);

            var recentSessions = await db.WorkoutSessions
                .AsNoTracking()
                .Where(s => s.StudentId == request.StudentId
                    && s.ProgramAssignmentId == programAssignment.Id
                    && s.StartedAt >= windowStart)
                .Select(s => new
                {
                    s.IsRecovery,
                    s.CompletedAt,
                    Date = DateOnly.FromDateTime(s.StartedAt.UtcDateTime),
                })
                .ToListAsync(cancellationToken);

            // Verify no completed normal session exists for that planned date
            var alreadyCompleted = recentSessions.Any(s => !s.IsRecovery && s.Date == plannedDate && s.CompletedAt != null);
            if (alreadyCompleted)
                throw new InvalidOperationException(
                    $"A session was already completed on {plannedDate}. Recovery is not needed.");

            // Verify no recovery session already covers that planned date
            // (mirrors GetMissedSessionQuery's "honored" check: IsRecovery && Date >= plannedDate && Date <= today)
            var alreadyRecovered = recentSessions.Any(s => s.IsRecovery && s.Date >= plannedDate && s.Date <= today);
            if (alreadyRecovered)
                throw new InvalidOperationException(
                    $"A recovery session has already been started for the planned date {plannedDate}.");

            isRecovery = true;
        }

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
            StartedAt = DateTimeOffset.UtcNow,
            IsRecovery = isRecovery,
            // RecoversSessionId stays null — there is no real session row for a missed-but-never-started day.
        };

        db.WorkoutSessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);

        return new WorkoutSessionDto(session.Id, session.RoutineId, session.DayId,
            session.StartedAt, session.CompletedAt, session.Notes);
    }
}
