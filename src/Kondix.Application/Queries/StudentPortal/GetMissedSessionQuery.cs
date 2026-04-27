using System.Text.Json;
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.StudentPortal;

public sealed record GetMissedSessionQuery(Guid StudentId) : IRequest<RecoverableSessionDto?>;

public sealed record RecoverableSessionDto(
    DateOnly PlannedDate,
    Guid RoutineId,
    string RoutineName,
    Guid DayId,
    string DayName,
    DateOnly DeadlineDate);

public sealed class GetMissedSessionQueryHandler(IKondixDbContext db)
    : IRequestHandler<GetMissedSessionQuery, RecoverableSessionDto?>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task<RecoverableSessionDto?> Handle(
        GetMissedSessionQuery request,
        CancellationToken cancellationToken)
    {
        var assignment = await db.ProgramAssignments
            .AsNoTracking()
            .Include(a => a.Program)
                .ThenInclude(p => p.ProgramRoutines.OrderBy(pr => pr.SortOrder))
                    .ThenInclude(pr => pr.Routine)
                        .ThenInclude(r => r.Days.OrderBy(d => d.SortOrder))
            .Where(a => a.StudentId == request.StudentId
                && a.Status == ProgramAssignmentStatus.Active)
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (assignment is null) return null;

        var programRoutines = assignment.Program.ProgramRoutines
            .OrderBy(pr => pr.SortOrder)
            .ToList();

        if (programRoutines.Count == 0) return null;

        // Flatten all (ProgramRoutine, Day) pairs — mirrors GetNextWorkoutHandler's allDays.
        var allDays = programRoutines
            .SelectMany(pr => pr.Routine.Days
                .OrderBy(d => d.SortOrder)
                .Select(d => (ProgramRoutine: pr, Day: d)))
            .ToList();

        if (allDays.Count == 0) return null;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        // Check yesterday then 2-days-ago (most recent missed first).
        var window = new[] { today.AddDays(-1), today.AddDays(-2) };

        // Load sessions the student started at or after the oldest window date.
        var windowStart = new DateTimeOffset(
            window[1].ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);

        var sessions = await db.WorkoutSessions
            .AsNoTracking()
            .Where(s => s.StudentId == request.StudentId
                && s.ProgramAssignmentId == assignment.Id
                && s.StartedAt >= windowStart)
            .Select(s => new
            {
                s.IsRecovery,
                Date = DateOnly.FromDateTime(s.StartedAt.UtcDateTime),
            })
            .ToListAsync(cancellationToken);

        foreach (var planned in window)
        {
            var dow = (int)planned.DayOfWeek;
            if (!assignment.TrainingDays.Contains(dow)) continue;

            // Was this day honored via a normal session on that exact date?
            var completedOnDay = sessions.Any(s => !s.IsRecovery && s.Date == planned);
            if (completedOnDay) continue;

            // Was this day honored via a recovery session started on or after the planned date?
            var alreadyRecovered = sessions.Any(s => s.IsRecovery && s.Date >= planned && s.Date <= today);
            if (alreadyRecovered) continue;

            // Pick the routine that was scheduled for this planned date.
            Domain.Entities.ProgramRoutine targetPr;
            Domain.Entities.Day targetDay;

            if (assignment.Mode == ProgramAssignmentMode.Rotation)
            {
                // RotationIndex hasn't advanced for the missed session (it's still pending),
                // so the current index points at what was due.
                var index = assignment.RotationIndex % allDays.Count;
                (targetPr, targetDay) = allDays[index];
            }
            else
            {
                // Fixed mode: look up the routine mapped to the missed weekday.
                var pr = FindRoutineForDay(assignment.FixedScheduleJson, dow, programRoutines);
                if (pr is null) continue;

                var day = pr.Routine.Days.OrderBy(d => d.SortOrder).FirstOrDefault();
                if (day is null) continue;

                targetPr = pr;
                targetDay = day;
            }

            return new RecoverableSessionDto(
                planned,
                targetPr.Routine.Id,
                targetPr.Routine.Name,
                targetDay.Id,
                targetDay.Name,
                planned.AddDays(2));
        }

        return null;
    }

    private static Domain.Entities.ProgramRoutine? FindRoutineForDay(
        string? fixedScheduleJson, int dayOfWeek,
        List<Domain.Entities.ProgramRoutine> programRoutines)
    {
        if (string.IsNullOrEmpty(fixedScheduleJson)) return null;

        var schedule = JsonSerializer.Deserialize<List<FixedScheduleInput>>(fixedScheduleJson, JsonOptions);
        var entry = schedule?.FirstOrDefault(e => e.Days.Contains(dayOfWeek));
        if (entry is null) return null;

        return programRoutines.FirstOrDefault(pr => pr.RoutineId == entry.RoutineId);
    }
}
