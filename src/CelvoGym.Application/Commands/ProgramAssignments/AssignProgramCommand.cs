using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using CelvoGym.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.ProgramAssignments;

public sealed record AssignProgramCommand(
    Guid TrainerId,
    Guid ProgramId,
    Guid StudentId,
    ProgramAssignmentMode Mode,
    List<int>? TrainingDays = null,
    List<FixedScheduleInput>? FixedSchedule = null,
    DateOnly? StartDate = null) : IRequest<ProgramAssignmentDto>;

public sealed record FixedScheduleInput(Guid RoutineId, List<int> Days);

public sealed class AssignProgramHandler(ICelvoGymDbContext db)
    : IRequestHandler<AssignProgramCommand, ProgramAssignmentDto>
{
    public async Task<ProgramAssignmentDto> Handle(AssignProgramCommand request, CancellationToken cancellationToken)
    {
        var program = await db.Programs
            .AsNoTracking()
            .Include(p => p.ProgramRoutines)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId
                && p.TrainerId == request.TrainerId
                && p.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Program not found");

        var trainerStudent = await db.TrainerStudents
            .Include(ts => ts.Student)
            .FirstOrDefaultAsync(ts => ts.StudentId == request.StudentId
                && ts.TrainerId == request.TrainerId
                && ts.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Student not found or not linked to this trainer");

        var existingActive = await db.ProgramAssignments
            .AnyAsync(pa => pa.ProgramId == request.ProgramId
                && pa.StudentId == request.StudentId
                && pa.Status == ProgramAssignmentStatus.Active, cancellationToken);

        if (existingActive)
            throw new InvalidOperationException("This program is already assigned to this student");

        if (request.Mode == ProgramAssignmentMode.Rotation && (request.TrainingDays is null || request.TrainingDays.Count == 0))
            throw new FluentValidation.ValidationException("Training days are required for rotation mode");

        if (request.Mode == ProgramAssignmentMode.Fixed)
        {
            if (request.FixedSchedule is null || request.FixedSchedule.Count == 0)
                throw new FluentValidation.ValidationException("Fixed schedule is required for fixed mode");

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

        var assignment = new ProgramAssignment
        {
            ProgramId = request.ProgramId,
            StudentId = request.StudentId,
            Mode = request.Mode,
            TrainingDays = trainingDays,
            FixedScheduleJson = fixedJson,
            StartDate = startDate,
            EndDate = endDate
        };

        db.ProgramAssignments.Add(assignment);
        await db.SaveChangesAsync(cancellationToken);

        var currentWeek = CalculateCurrentWeek(startDate);

        return new ProgramAssignmentDto(
            assignment.Id, program.Id, program.Name,
            trainerStudent.StudentId, trainerStudent.Student.DisplayName,
            assignment.Mode.ToString(), assignment.Status.ToString(),
            assignment.TrainingDays, startDate.ToString("yyyy-MM-dd"),
            endDate.ToString("yyyy-MM-dd"), currentWeek, program.DurationWeeks,
            assignment.CreatedAt);
    }

    internal static int CalculateCurrentWeek(DateOnly startDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var daysSinceStart = today.DayNumber - startDate.DayNumber;
        return daysSinceStart < 0 ? 1 : Math.Max(1, (int)Math.Ceiling((daysSinceStart + 1) / 7.0));
    }
}
