using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.StudentPortal;

public sealed record GetMyRoutineDetailQuery(
    Guid RoutineId,
    Guid StudentId) : IRequest<StudentRoutineDetailDto>;

public sealed class GetMyRoutineDetailHandler(IKondixDbContext db)
    : IRequestHandler<GetMyRoutineDetailQuery, StudentRoutineDetailDto>
{
    public async Task<StudentRoutineDetailDto> Handle(GetMyRoutineDetailQuery request, CancellationToken cancellationToken)
    {
        var hasAssignment = await db.ProgramAssignments
            .AnyAsync(pa => pa.StudentId == request.StudentId
                && pa.Status == Domain.Enums.ProgramAssignmentStatus.Active
                && pa.Program.ProgramRoutines.Any(pr => pr.RoutineId == request.RoutineId),
                cancellationToken);

        if (!hasAssignment)
            throw new InvalidOperationException("Routine not assigned to this student");

        var routine = await db.Routines
            .AsNoTracking()
            .Include(r => r.Days.OrderBy(d => d.SortOrder))
                .ThenInclude(d => d.ExerciseGroups.OrderBy(g => g.SortOrder))
                    .ThenInclude(g => g.Exercises.OrderBy(e => e.SortOrder))
                        .ThenInclude(e => e.Sets.OrderBy(s => s.SortOrder))
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId && r.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Routine not found");

        var setLogs = await db.SetLogs
            .AsNoTracking()
            .Where(sl => sl.StudentId == request.StudentId && sl.RoutineId == request.RoutineId)
            .ToListAsync(cancellationToken);

        var setLogMap = setLogs.Where(sl => sl.SetId.HasValue).ToDictionary(sl => sl.SetId!.Value);

        var allEffectiveSets = 0;
        var allCompletedEffective = 0;

        var dayDtos = routine.Days.Select(d =>
        {
            var daySetLogs = new List<SetLogDto>();
            var dayEffective = 0;
            var dayCompleted = 0;

            foreach (var group in d.ExerciseGroups)
            foreach (var exercise in group.Exercises)
            foreach (var set in exercise.Sets)
            {
                if (setLogMap.TryGetValue(set.Id, out var log))
                {
                    daySetLogs.Add(new SetLogDto(log.Id, log.SetId, log.Completed,
                        log.CompletedAt, log.ActualWeight, log.ActualReps, log.ActualRpe));

                    if (set.SetType != SetType.Warmup)
                    {
                        dayEffective++;
                        if (log.Completed) dayCompleted++;
                    }
                }
                else if (set.SetType != SetType.Warmup)
                {
                    dayEffective++;
                }
            }

            allEffectiveSets += dayEffective;
            allCompletedEffective += dayCompleted;

            var dayPercentage = dayEffective > 0 ? dayCompleted * 100 / dayEffective : 0;

            return new StudentDayDto(
                d.Id,
                d.Name,
                d.ExerciseGroups.Select(g => new ExerciseGroupDto(
                    g.Id, g.GroupType, g.RestSeconds,
                    g.Exercises.Select(e => new ExerciseDto(
                        e.Id, e.Name, e.Notes, e.VideoSource, e.VideoUrl, e.Tempo,
                        e.Sets.Select(s => new ExerciseSetDto(
                            s.Id, s.SetType, s.TargetReps, s.TargetWeight, s.TargetRpe, s.RestSeconds
                        )).ToList()
                    )).ToList()
                )).ToList(),
                daySetLogs,
                new ProgressSummaryDto(dayEffective, dayCompleted, dayPercentage));
        }).ToList();

        var totalPercentage = allEffectiveSets > 0 ? allCompletedEffective * 100 / allEffectiveSets : 0;

        return new StudentRoutineDetailDto(
            routine.Id, routine.Name, routine.Description, dayDtos,
            new ProgressSummaryDto(allEffectiveSets, allCompletedEffective, totalPercentage));
    }
}
