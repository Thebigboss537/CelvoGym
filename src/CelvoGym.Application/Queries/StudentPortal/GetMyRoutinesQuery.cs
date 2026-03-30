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
        var assignments = await db.RoutineAssignments
            .AsNoTracking()
            .Where(ra => ra.StudentId == request.StudentId && ra.IsActive)
            .Include(ra => ra.Routine)
                .ThenInclude(r => r.Days)
                    .ThenInclude(d => d.ExerciseGroups)
                        .ThenInclude(g => g.Exercises)
                            .ThenInclude(e => e.Sets)
            .ToListAsync(cancellationToken);

        var routineIds = assignments.Select(a => a.RoutineId).ToList();
        var setLogs = await db.SetLogs
            .AsNoTracking()
            .Where(sl => sl.StudentId == request.StudentId && routineIds.Contains(sl.RoutineId))
            .ToListAsync(cancellationToken);

        var completedSetIds = setLogs.Where(sl => sl.Completed).Select(sl => sl.SetId).ToHashSet();

        return assignments.Select(a =>
        {
            var allSets = a.Routine.Days
                .SelectMany(d => d.ExerciseGroups)
                .SelectMany(g => g.Exercises)
                .SelectMany(e => e.Sets)
                .ToList();

            var effectiveSets = allSets.Where(s => s.SetType != SetType.Warmup).ToList();
            var completedEffective = effectiveSets.Count(s => completedSetIds.Contains(s.Id));
            var percentage = effectiveSets.Count > 0 ? completedEffective * 100 / effectiveSets.Count : 0;

            return new StudentRoutineListDto(
                a.Routine.Id,
                a.Routine.Name,
                a.Routine.Description,
                a.Routine.Days.Count,
                new ProgressSummaryDto(effectiveSets.Count, completedEffective, percentage),
                a.Routine.UpdatedAt);
        }).ToList();
    }
}
