using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.StudentPortal;

public sealed record GetMyRoutinesQuery(Guid StudentId) : IRequest<List<StudentRoutineListDto>>;

public sealed class GetMyRoutinesHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetMyRoutinesQuery, List<StudentRoutineListDto>>
{
    public async Task<List<StudentRoutineListDto>> Handle(GetMyRoutinesQuery request, CancellationToken cancellationToken)
    {
        var programAssignment = await db.ProgramAssignments
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

        if (programAssignment is null) return [];

        var routineIds = programAssignment.Program.ProgramRoutines.Select(pr => pr.RoutineId).ToList();
        var completedSetIds = await db.SetLogs
            .AsNoTracking()
            .Where(sl => sl.StudentId == request.StudentId
                && routineIds.Contains(sl.RoutineId)
                && sl.Completed && sl.SetId.HasValue)
            .Select(sl => sl.SetId!.Value)
            .ToHashSetAsync(cancellationToken);

        return programAssignment.Program.ProgramRoutines.Select(pr =>
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
    }
}
