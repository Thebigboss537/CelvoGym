using CelvoGym.Application.Common.Helpers;
using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.StudentPortal;

public sealed record GetMyProgramQuery(Guid StudentId) : IRequest<MyProgramDto?>;

public sealed class GetMyProgramHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetMyProgramQuery, MyProgramDto?>
{
    public async Task<MyProgramDto?> Handle(GetMyProgramQuery request, CancellationToken cancellationToken)
    {
        var assignment = await db.ProgramAssignments
            .AsNoTracking()
            .Include(pa => pa.Program)
                .ThenInclude(p => p.ProgramRoutines.OrderBy(pr => pr.SortOrder))
                    .ThenInclude(pr => pr.Routine)
                        .ThenInclude(r => r.Days)
                            .ThenInclude(d => d.ExerciseGroups)
                                .ThenInclude(g => g.Exercises)
                                    .ThenInclude(e => e.Sets)
            .Where(pa => pa.StudentId == request.StudentId
                && pa.Status == ProgramAssignmentStatus.Active)
            .OrderByDescending(pa => pa.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (assignment is null) return null;

        var currentWeek = ProgramWeekHelper.CalculateCurrentWeek(assignment.StartDate);

        var routineIds = assignment.Program.ProgramRoutines.Select(pr => pr.RoutineId).ToList();
        var completedSetIds = await db.SetLogs
            .AsNoTracking()
            .Where(sl => sl.StudentId == request.StudentId
                && routineIds.Contains(sl.RoutineId)
                && sl.Completed && sl.SetId.HasValue)
            .Select(sl => sl.SetId!.Value)
            .ToHashSetAsync(cancellationToken);

        var routines = assignment.Program.ProgramRoutines.Select(pr =>
        {
            var routine = pr.Routine;
            var allSets = routine.Days
                .SelectMany(d => d.ExerciseGroups)
                .SelectMany(g => g.Exercises)
                .SelectMany(e => e.Sets)
                .ToList();

            var effectiveSets = allSets.Where(s => s.SetType != SetType.Warmup).ToList();
            var completedEffective = effectiveSets.Count(s => completedSetIds.Contains(s.Id));
            var percentage = effectiveSets.Count > 0 ? completedEffective * 100 / effectiveSets.Count : 0;

            return new StudentRoutineListDto(
                routine.Id, routine.Name, routine.Description,
                routine.Days.Count,
                new ProgressSummaryDto(effectiveSets.Count, completedEffective, percentage),
                routine.UpdatedAt);
        }).ToList();

        return new MyProgramDto(
            assignment.ProgramId, assignment.Program.Name, assignment.Program.Description,
            assignment.Mode.ToString(), assignment.Status.ToString(),
            currentWeek, assignment.Program.DurationWeeks,
            routines,
            assignment.StartDate.ToString("yyyy-MM-dd"),
            assignment.EndDate.ToString("yyyy-MM-dd"));
    }
}
