using CelvoGym.Application.Common.Helpers;
using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Sessions;

public sealed record GetCalendarQuery(
    Guid StudentId,
    int Year,
    int Month) : IRequest<CalendarMonthDto>;

public sealed class GetCalendarHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetCalendarQuery, CalendarMonthDto>
{
    public async Task<CalendarMonthDto> Handle(GetCalendarQuery request, CancellationToken cancellationToken)
    {
        var monthStart = new DateTimeOffset(request.Year, request.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var monthEnd = monthStart.AddMonths(1);

        // Get active assignment with scheduled days
        var assignment = await db.RoutineAssignments
            .AsNoTracking()
            .Where(ra => ra.StudentId == request.StudentId && ra.IsActive)
            .OrderByDescending(ra => ra.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var suggestedDays = assignment?.ScheduledDays ?? [];

        // Get all sessions in the month
        var sessions = await db.WorkoutSessions
            .AsNoTracking()
            .Include(ws => ws.Day)
            .Where(ws => ws.StudentId == request.StudentId
                && ws.StartedAt >= monthStart
                && ws.StartedAt < monthEnd)
            .OrderBy(ws => ws.StartedAt)
            .ToListAsync(cancellationToken);

        var sessionIds = sessions.Select(s => s.Id).ToList();

        var statsMap = await SetLogStatsHelper.GetEffectiveSetStatsAsync(db, sessionIds, cancellationToken);

        var calendarDays = sessions.Select(s =>
        {
            statsMap.TryGetValue(s.Id, out var stats);
            var durationMinutes = s.CompletedAt.HasValue
                ? (int)(s.CompletedAt.Value - s.StartedAt).TotalMinutes
                : (int?)null;

            return new CalendarDayDto(
                s.StartedAt.ToString("yyyy-MM-dd"),
                s.Day.Name,
                s.CompletedAt.HasValue ? "completed" : "in_progress",
                s.Id,
                stats.Completed,
                stats.Total,
                durationMinutes);
        }).ToList();

        // Program info
        ActiveProgramDto? activeProgram = null;
        if (assignment?.ProgramId is not null && assignment.StartDate.HasValue)
        {
            var program = await db.Programs
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == assignment.ProgramId && p.IsActive, cancellationToken);

            if (program is not null)
            {
                var daysSinceStart = DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - assignment.StartDate.Value.DayNumber;
                var currentWeek = Math.Max(1, (int)Math.Ceiling((daysSinceStart + 1) / 7.0));
                activeProgram = new ActiveProgramDto(program.Name, currentWeek, program.DurationWeeks);
            }
        }

        return new CalendarMonthDto(calendarDays, suggestedDays, activeProgram);
    }
}
