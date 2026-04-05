using CelvoGym.Application.Common.Helpers;
using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using CelvoGym.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.ProgramAssignments;

public sealed record BulkAssignProgramCommand(
    Guid TrainerId,
    Guid ProgramId,
    List<Guid> StudentIds,
    ProgramAssignmentMode Mode,
    List<int>? TrainingDays = null,
    List<FixedScheduleInput>? FixedSchedule = null,
    DateOnly? StartDate = null) : IRequest<List<ProgramAssignmentDto>>;

public sealed class BulkAssignProgramHandler(ICelvoGymDbContext db)
    : IRequestHandler<BulkAssignProgramCommand, List<ProgramAssignmentDto>>
{
    public async Task<List<ProgramAssignmentDto>> Handle(BulkAssignProgramCommand request, CancellationToken cancellationToken)
    {
        var program = await db.Programs
            .AsNoTracking()
            .Include(p => p.ProgramRoutines)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId
                && p.TrainerId == request.TrainerId
                && p.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Program not found");

        var linkedStudents = await db.TrainerStudents
            .Include(ts => ts.Student)
            .Where(ts => ts.TrainerId == request.TrainerId
                && ts.IsActive
                && request.StudentIds.Contains(ts.StudentId))
            .ToListAsync(cancellationToken);

        var alreadyAssigned = await db.ProgramAssignments
            .Where(pa => pa.ProgramId == request.ProgramId
                && request.StudentIds.Contains(pa.StudentId)
                && pa.Status == ProgramAssignmentStatus.Active)
            .Select(pa => pa.StudentId)
            .ToHashSetAsync(cancellationToken);

        if (request.Mode == ProgramAssignmentMode.Fixed && request.FixedSchedule is not null)
        {
            var programRoutineIds = program.ProgramRoutines.Select(pr => pr.RoutineId).ToHashSet();
            var invalidRoutines = request.FixedSchedule.Where(fs => !programRoutineIds.Contains(fs.RoutineId)).ToList();
            if (invalidRoutines.Count > 0)
                throw new InvalidOperationException("Some routines in the schedule don't belong to this program");
        }

        var startDate = request.StartDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var endDate = startDate.AddDays(program.DurationWeeks * 7);

        string? fixedJson = null;
        var trainingDays = request.TrainingDays ?? [];

        if (request.Mode == ProgramAssignmentMode.Fixed && request.FixedSchedule is not null)
        {
            fixedJson = System.Text.Json.JsonSerializer.Serialize(request.FixedSchedule);
            trainingDays = request.FixedSchedule.SelectMany(fs => fs.Days).Distinct().OrderBy(d => d).ToList();
        }

        var results = new List<ProgramAssignmentDto>();
        var currentWeek = ProgramWeekHelper.CalculateCurrentWeek(startDate);

        foreach (var ts in linkedStudents)
        {
            if (alreadyAssigned.Contains(ts.StudentId)) continue;

            var assignment = new ProgramAssignment
            {
                ProgramId = request.ProgramId,
                StudentId = ts.StudentId,
                Mode = request.Mode,
                TrainingDays = trainingDays,
                FixedScheduleJson = fixedJson,
                StartDate = startDate,
                EndDate = endDate
            };

            db.ProgramAssignments.Add(assignment);

            results.Add(new ProgramAssignmentDto(
                assignment.Id, program.Id, program.Name,
                ts.StudentId, ts.Student.DisplayName,
                assignment.Mode.ToString(), assignment.Status.ToString(),
                assignment.TrainingDays, startDate.ToString("yyyy-MM-dd"),
                endDate.ToString("yyyy-MM-dd"), currentWeek, program.DurationWeeks,
                assignment.CreatedAt));
        }

        await db.SaveChangesAsync(cancellationToken);
        return results;
    }
}
