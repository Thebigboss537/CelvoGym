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
    int? WeekIndex = null,
    int? SlotIndex = null,
    DateOnly? RecoversPlannedDate = null) : IRequest<WorkoutSessionDto>;

public sealed class StartSessionHandler(IKondixDbContext db) : IRequestHandler<StartSessionCommand, WorkoutSessionDto>
{
    public async Task<WorkoutSessionDto> Handle(StartSessionCommand request, CancellationToken ct)
    {
        // 1. If there's already an InProgress session for this student, return it (idempotent).
        var active = await db.WorkoutSessions
            .Where(s => s.StudentId == request.StudentId
                        && s.Status == WorkoutSessionStatus.InProgress)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(ct);
        if (active is not null)
        {
            return new WorkoutSessionDto(active.Id, active.RoutineId, active.DayId,
                active.StartedAt, active.CompletedAt, active.Notes);
        }

        // 2. Resolve the active assignment with weeks + slots.
        var assignment = await db.ProgramAssignments
            .Include(a => a.Program).ThenInclude(p => p.Weeks).ThenInclude(w => w.Slots)
            .Where(a => a.StudentId == request.StudentId && a.Status == ProgramAssignmentStatus.Active)
            .OrderByDescending(a => a.StartDate)
            .FirstOrDefaultAsync(ct);
        if (assignment is null)
            throw new InvalidOperationException("No active program assignment");

        // 3. Compute current week index (Loop=0, Fixed=daysSinceStart/7).
        var p = assignment.Program;
        int currentWeekIdx;
        if (p.Mode == ProgramMode.Loop)
        {
            currentWeekIdx = 0;
        }
        else
        {
            var startDay = DateOnly.FromDateTime(assignment.StartDate.UtcDateTime);
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var daysSinceStart = Math.Max(0, today.DayNumber - startDay.DayNumber);
            currentWeekIdx = daysSinceStart / 7;
            if (currentWeekIdx >= p.Weeks.Count)
                throw new InvalidOperationException("Program has ended");
        }

        // 4. Resolve target slot. Prefer (weekIndex, slotIndex) if supplied. Otherwise, find a slot in the
        //    current week matching (routineId, dayId).
        int weekIdx = request.WeekIndex ?? currentWeekIdx;
        var week = p.Weeks.FirstOrDefault(w => w.WeekIndex == weekIdx)
            ?? throw new InvalidOperationException($"Week {weekIdx} not found");

        ProgramSlot? slot;
        if (request.SlotIndex is int slotIdx)
        {
            slot = week.Slots.FirstOrDefault(s => s.DayIndex == slotIdx
                && s.Kind == ProgramSlotKind.RoutineDay
                && s.RoutineId == request.RoutineId
                && s.DayId == request.DayId);
        }
        else
        {
            slot = week.Slots.FirstOrDefault(s => s.Kind == ProgramSlotKind.RoutineDay
                && s.RoutineId == request.RoutineId
                && s.DayId == request.DayId);
        }
        if (slot is null)
            throw new InvalidOperationException("Routine/day not assigned to current week");

        // 5. Create the session.
        var now = DateTimeOffset.UtcNow;
        var session = new WorkoutSession
        {
            StudentId = request.StudentId,
            AssignmentId = assignment.Id,
            ProgramId = p.Id,
            RoutineId = slot.RoutineId!.Value,
            DayId = slot.DayId!.Value,
            WeekIndex = weekIdx,
            SlotIndex = slot.DayIndex,
            StartedAt = now,
            Status = WorkoutSessionStatus.InProgress,
            IsRecovery = request.RecoversPlannedDate.HasValue,
            RecoversPlannedDate = request.RecoversPlannedDate,
            UpdatedAt = now,
        };
        db.WorkoutSessions.Add(session);
        await db.SaveChangesAsync(ct);

        return new WorkoutSessionDto(session.Id, session.RoutineId, session.DayId,
            session.StartedAt, session.CompletedAt, session.Notes);
    }
}
