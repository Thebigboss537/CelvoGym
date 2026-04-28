using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.StudentPortal;

public sealed record ThisWeekPendingSlot(
    int SlotIndex,
    Guid RoutineId,
    string RoutineName,
    Guid DayId,
    string DayName);

public sealed record ThisWeekDto(
    Guid AssignmentId,
    int WeekIndex,
    int Total,
    int CompletedCount,
    List<ThisWeekPendingSlot> Pending);

public sealed record GetThisWeekQuery(Guid StudentId, DateOnly Today) : IRequest<ThisWeekDto?>;

public sealed class GetThisWeekHandler(IKondixDbContext db) : IRequestHandler<GetThisWeekQuery, ThisWeekDto?>
{
    public async Task<ThisWeekDto?> Handle(GetThisWeekQuery request, CancellationToken ct)
    {
        var assignment = await db.ProgramAssignments
            .Include(a => a.Program).ThenInclude(p => p.Weeks).ThenInclude(w => w.Slots)
                .ThenInclude(s => s.Routine)
            .Include(a => a.Program).ThenInclude(p => p.Weeks).ThenInclude(w => w.Slots)
                .ThenInclude(s => s.Day)
            .Where(a => a.StudentId == request.StudentId && a.Status == ProgramAssignmentStatus.Active)
            .OrderByDescending(a => a.StartDate)
            .FirstOrDefaultAsync(ct);

        if (assignment is null) return null;
        var p = assignment.Program;
        if (p.ScheduleType != ProgramScheduleType.Numbered) return null;

        int currentWeekIdx;
        if (p.Mode == ProgramMode.Loop)
        {
            currentWeekIdx = 0;
        }
        else
        {
            var startDay = DateOnly.FromDateTime(assignment.StartDate.UtcDateTime);
            currentWeekIdx = Math.Max(0, request.Today.DayNumber - startDay.DayNumber) / 7;
            if (currentWeekIdx >= p.Weeks.Count) return null;
        }

        var week = p.Weeks.First(w => w.WeekIndex == currentWeekIdx);

        var todayDt = request.Today.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dow = ((int)todayDt.DayOfWeek + 6) % 7;
        var weekStart = new DateTimeOffset(todayDt.AddDays(-dow), TimeSpan.Zero);

        var completedSlots = await db.WorkoutSessions
            .Where(s => s.AssignmentId == assignment.Id
                        && s.WeekIndex == currentWeekIdx
                        && s.Status == WorkoutSessionStatus.Completed
                        && s.StartedAt >= weekStart)
            .Select(s => s.SlotIndex)
            .ToListAsync(ct);

        var pending = week.Slots
            .Where(s => s.Kind == ProgramSlotKind.RoutineDay && !completedSlots.Contains(s.DayIndex))
            .OrderBy(s => s.DayIndex)
            .Select(s => new ThisWeekPendingSlot(
                s.DayIndex,
                s.RoutineId!.Value,
                s.Routine!.Name,
                s.DayId!.Value,
                s.Day?.Name ?? ""))
            .ToList();

        return new ThisWeekDto(
            assignment.Id, currentWeekIdx,
            week.Slots.Count(s => s.Kind == ProgramSlotKind.RoutineDay),
            completedSlots.Count,
            pending);
    }
}
