using System.Text.Json;
using Kondix.Application.Common.Helpers;
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.StudentPortal;

public sealed record GetNextWorkoutQuery(Guid StudentId) : IRequest<NextWorkoutDto?>;

public sealed class GetNextWorkoutHandler(IKondixDbContext db)
    : IRequestHandler<GetNextWorkoutQuery, NextWorkoutDto?>
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task<NextWorkoutDto?> Handle(GetNextWorkoutQuery request, CancellationToken cancellationToken)
    {
        var assignment = await db.ProgramAssignments
            .AsNoTracking()
            .Include(pa => pa.Program)
                .ThenInclude(p => p.ProgramRoutines.OrderBy(pr => pr.SortOrder))
                    .ThenInclude(pr => pr.Routine)
                        .ThenInclude(r => r.Days.OrderBy(d => d.SortOrder))
            .Where(pa => pa.StudentId == request.StudentId
                && pa.Status == ProgramAssignmentStatus.Active)
            .OrderByDescending(pa => pa.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (assignment is null) return null;

        var programRoutines = assignment.Program.ProgramRoutines.OrderBy(pr => pr.SortOrder).ToList();
        if (programRoutines.Count == 0) return null;

        var currentWeek = ProgramWeekHelper.CalculateCurrentWeek(assignment.StartDate);

        // Flatten (ProgramRoutine, Day) tuples so rotation advances through individual workout days
        // across the program — not only through top-level routines. This matches the trainer's
        // mental model where a routine with N days represents N distinct sessions.
        var allDays = programRoutines
            .SelectMany(pr => pr.Routine.Days
                .OrderBy(d => d.SortOrder)
                .Select(d => (ProgramRoutine: pr, Day: d)))
            .ToList();

        if (allDays.Count == 0) return null;

        Domain.Entities.ProgramRoutine targetPr;
        Domain.Entities.Day targetDay;

        if (assignment.Mode == ProgramAssignmentMode.Rotation)
        {
            var index = assignment.RotationIndex % allDays.Count;
            (targetPr, targetDay) = allDays[index];
        }
        else
        {
            var todayDow = (int)DateTime.UtcNow.DayOfWeek;
            var pr = FindRoutineForDay(assignment.FixedScheduleJson, todayDow, programRoutines);

            if (pr is null)
            {
                for (var offset = 1; offset <= 7; offset++)
                {
                    var nextDow = ((int)DateTime.UtcNow.DayOfWeek + offset) % 7;
                    pr = FindRoutineForDay(assignment.FixedScheduleJson, nextDow, programRoutines);
                    if (pr is not null) break;
                }
            }

            if (pr is null) return null;

            var day = pr.Routine.Days.OrderBy(d => d.SortOrder).FirstOrDefault();
            if (day is null) return null;

            targetPr = pr;
            targetDay = day;
        }

        return new NextWorkoutDto(
            targetPr.Routine.Id, targetPr.Routine.Name,
            targetDay.Id, targetDay.Name,
            assignment.Program.Name,
            currentWeek, assignment.Program.DurationWeeks);
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
