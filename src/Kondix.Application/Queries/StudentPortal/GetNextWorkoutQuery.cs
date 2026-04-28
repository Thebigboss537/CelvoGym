using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.StudentPortal;

public sealed record NextWorkoutDto(
    string Kind,           // "Routine" | "Rest" | "Empty" | "Numbered" | "Done"
    Guid? AssignmentId = null,
    Guid? RoutineId = null,
    string? RoutineName = null,
    Guid? DayId = null,
    string? DayName = null,
    int? WeekIndex = null,
    int? SlotIndex = null,
    int? PendingCount = null,
    int? CompletedCount = null,
    int? Total = null);

public sealed record GetNextWorkoutQuery(Guid StudentId, DateOnly Today) : IRequest<NextWorkoutDto>;

public sealed class GetNextWorkoutHandler(IKondixDbContext db) : IRequestHandler<GetNextWorkoutQuery, NextWorkoutDto>
{
    public async Task<NextWorkoutDto> Handle(GetNextWorkoutQuery request, CancellationToken ct)
    {
        var assignment = await db.ProgramAssignments
            .Include(a => a.Program).ThenInclude(p => p.Weeks).ThenInclude(w => w.Slots)
                .ThenInclude(s => s.Routine)
            .Include(a => a.Program).ThenInclude(p => p.Weeks).ThenInclude(w => w.Slots)
                .ThenInclude(s => s.Day)
            .Where(a => a.StudentId == request.StudentId && a.Status == ProgramAssignmentStatus.Active)
            .OrderByDescending(a => a.StartDate)
            .FirstOrDefaultAsync(ct);

        if (assignment is null)
            return new NextWorkoutDto("Done");

        var p = assignment.Program;
        var startDay = DateOnly.FromDateTime(assignment.StartDate.UtcDateTime);
        var daysSinceStart = request.Today.DayNumber - startDay.DayNumber;
        if (daysSinceStart < 0) daysSinceStart = 0;

        int currentWeekIdx;
        if (p.Mode == ProgramMode.Loop)
        {
            currentWeekIdx = 0;
        }
        else
        {
            currentWeekIdx = daysSinceStart / 7;
            if (currentWeekIdx >= p.Weeks.Count)
                return new NextWorkoutDto("Done", AssignmentId: assignment.Id);
        }

        var week = p.Weeks.FirstOrDefault(w => w.WeekIndex == currentWeekIdx);
        if (week is null)
            return new NextWorkoutDto("Done", AssignmentId: assignment.Id);

        if (p.ScheduleType == ProgramScheduleType.Numbered)
        {
            // Calendar week boundary (Mon 00:00 UTC).
            var todayDt = request.Today.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var dow = ((int)todayDt.DayOfWeek + 6) % 7;
            var weekStart = new DateTimeOffset(todayDt.AddDays(-dow), TimeSpan.Zero);

            var completedCount = await db.WorkoutSessions
                .Where(s => s.AssignmentId == assignment.Id
                            && s.WeekIndex == currentWeekIdx
                            && s.Status == WorkoutSessionStatus.Completed
                            && s.StartedAt >= weekStart)
                .CountAsync(ct);

            var total = week.Slots.Count(s => s.Kind == ProgramSlotKind.RoutineDay);
            return new NextWorkoutDto(
                Kind: "Numbered",
                AssignmentId: assignment.Id,
                WeekIndex: currentWeekIdx,
                PendingCount: total - completedCount,
                CompletedCount: completedCount,
                Total: total);
        }
        else
        {
            // Week mode: today's weekday.
            var todayDow = ((int)request.Today.DayOfWeek + 6) % 7;
            var slot = week.Slots.FirstOrDefault(s => s.DayIndex == todayDow);
            if (slot is null) return new NextWorkoutDto("Empty", AssignmentId: assignment.Id);

            return slot.Kind switch
            {
                ProgramSlotKind.Empty => new NextWorkoutDto("Empty", AssignmentId: assignment.Id, WeekIndex: currentWeekIdx, SlotIndex: todayDow),
                ProgramSlotKind.Rest  => new NextWorkoutDto("Rest", AssignmentId: assignment.Id, WeekIndex: currentWeekIdx, SlotIndex: todayDow),
                ProgramSlotKind.RoutineDay => new NextWorkoutDto(
                    "Routine",
                    AssignmentId: assignment.Id,
                    RoutineId: slot.RoutineId,
                    RoutineName: slot.Routine?.Name,
                    DayId: slot.DayId,
                    DayName: slot.Day?.Name,
                    WeekIndex: currentWeekIdx,
                    SlotIndex: todayDow),
                _ => new NextWorkoutDto("Empty", AssignmentId: assignment.Id),
            };
        }
    }
}
