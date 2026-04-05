using System.Text.Json;
using CelvoGym.Application.Common.Helpers;
using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.StudentPortal;

public sealed record GetNextWorkoutQuery(Guid StudentId) : IRequest<NextWorkoutDto?>;

public sealed class GetNextWorkoutHandler(ICelvoGymDbContext db)
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

        Domain.Entities.ProgramRoutine? targetPr;

        if (assignment.Mode == ProgramAssignmentMode.Rotation)
        {
            var index = assignment.RotationIndex % programRoutines.Count;
            targetPr = programRoutines[index];
        }
        else
        {
            var todayDow = (int)DateTime.UtcNow.DayOfWeek;
            targetPr = FindRoutineForDay(assignment.FixedScheduleJson, todayDow, programRoutines);

            if (targetPr is null)
            {
                for (var offset = 1; offset <= 7; offset++)
                {
                    var nextDow = ((int)DateTime.UtcNow.DayOfWeek + offset) % 7;
                    targetPr = FindRoutineForDay(assignment.FixedScheduleJson, nextDow, programRoutines);
                    if (targetPr is not null) break;
                }
            }
        }

        if (targetPr is null) return null;

        var routine = targetPr.Routine;
        var firstDay = routine.Days.OrderBy(d => d.SortOrder).FirstOrDefault();
        if (firstDay is null) return null;

        return new NextWorkoutDto(
            routine.Id, routine.Name,
            firstDay.Id, firstDay.Name,
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
