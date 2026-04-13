using CelvoGym.Application.Common.Helpers;
using static CelvoGym.Application.Common.Helpers.ProgramWeekHelper;
using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Enums;
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

        // Get active ProgramAssignment
        var assignment = await db.ProgramAssignments
            .AsNoTracking()
            .Include(pa => pa.Program)
            .Where(pa => pa.StudentId == request.StudentId
                && pa.Status == ProgramAssignmentStatus.Active)
            .OrderByDescending(pa => pa.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var suggestedDays = assignment?.TrainingDays ?? [];

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
        if (assignment is not null)
        {
            var currentWeek = CalculateCurrentWeek(assignment.StartDate);
            activeProgram = new ActiveProgramDto(
                assignment.Program.Name, currentWeek, assignment.Program.DurationWeeks,
                assignment.Mode.ToString(), assignment.Status.ToString());
        }

        return new CalendarMonthDto(calendarDays, suggestedDays, activeProgram);
    }
}
