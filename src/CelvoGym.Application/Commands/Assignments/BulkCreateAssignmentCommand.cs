using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Assignments;

public sealed record BulkCreateAssignmentCommand(
    Guid TrainerId,
    Guid RoutineId,
    List<Guid> StudentIds,
    List<int>? ScheduledDays = null,
    Guid? ProgramId = null,
    DateOnly? StartDate = null) : IRequest<List<AssignmentDto>>;

public sealed class BulkCreateAssignmentHandler(ICelvoGymDbContext db)
    : IRequestHandler<BulkCreateAssignmentCommand, List<AssignmentDto>>
{
    public async Task<List<AssignmentDto>> Handle(BulkCreateAssignmentCommand request, CancellationToken cancellationToken)
    {
        var routine = await db.Routines
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId
                && r.TrainerId == request.TrainerId
                && r.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Routine not found");

        var linkedStudents = await db.TrainerStudents
            .Include(ts => ts.Student)
            .Where(ts => request.StudentIds.Contains(ts.StudentId)
                && ts.TrainerId == request.TrainerId
                && ts.IsActive)
            .ToDictionaryAsync(ts => ts.StudentId, cancellationToken);

        var existing = await db.RoutineAssignments
            .Where(ra => ra.RoutineId == request.RoutineId
                && request.StudentIds.Contains(ra.StudentId))
            .ToDictionaryAsync(ra => ra.StudentId, cancellationToken);

        // Calculate EndDate from program if applicable
        DateOnly? endDate = null;
        if (request.ProgramId.HasValue && request.StartDate.HasValue)
        {
            var program = await db.Programs
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.IsActive, cancellationToken);
            if (program is not null)
                endDate = request.StartDate.Value.AddDays(program.DurationWeeks * 7);
        }

        var results = new List<AssignmentDto>();

        foreach (var studentId in request.StudentIds)
        {
            if (!linkedStudents.TryGetValue(studentId, out var ts)) continue;

            if (existing.TryGetValue(studentId, out var ex))
            {
                if (ex.IsActive) continue; // Skip already assigned
                ex.IsActive = true;
                ex.DeactivatedAt = null;
                ex.ScheduledDays = request.ScheduledDays ?? [];
                ex.ProgramId = request.ProgramId;
                ex.StartDate = request.StartDate;
                ex.EndDate = endDate;
            }
            else
            {
                ex = new RoutineAssignment
                {
                    RoutineId = request.RoutineId,
                    StudentId = studentId,
                    ProgramId = request.ProgramId,
                    StartDate = request.StartDate,
                    EndDate = endDate,
                    ScheduledDays = request.ScheduledDays ?? []
                };
                db.RoutineAssignments.Add(ex);
            }

            results.Add(new AssignmentDto(ex.Id, routine.Id, routine.Name,
                ts.Student.Id, ts.Student.DisplayName, true, ex.CreatedAt));
        }

        await db.SaveChangesAsync(cancellationToken);
        return results;
    }
}
