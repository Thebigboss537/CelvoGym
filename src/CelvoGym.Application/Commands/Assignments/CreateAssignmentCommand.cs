using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Assignments;

public sealed record CreateAssignmentCommand(
    Guid TrainerId,
    Guid RoutineId,
    Guid StudentId) : IRequest<AssignmentDto>;

public sealed class CreateAssignmentHandler(ICelvoGymDbContext db)
    : IRequestHandler<CreateAssignmentCommand, AssignmentDto>
{
    public async Task<AssignmentDto> Handle(CreateAssignmentCommand request, CancellationToken cancellationToken)
    {
        // Verify routine belongs to trainer
        var routine = await db.Routines
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId
                && r.TrainerId == request.TrainerId
                && r.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Routine not found");

        // Verify student is linked to trainer
        var trainerStudent = await db.TrainerStudents
            .Include(ts => ts.Student)
            .FirstOrDefaultAsync(ts => ts.StudentId == request.StudentId
                && ts.TrainerId == request.TrainerId
                && ts.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Student not found or not linked to this trainer");

        // Check if assignment already exists
        var existing = await db.RoutineAssignments
            .FirstOrDefaultAsync(ra => ra.RoutineId == request.RoutineId
                && ra.StudentId == request.StudentId, cancellationToken);

        if (existing is not null)
        {
            if (existing.IsActive)
                throw new InvalidOperationException("Routine already assigned to this student");

            // Reactivate
            existing.IsActive = true;
            existing.DeactivatedAt = null;
        }
        else
        {
            existing = new RoutineAssignment
            {
                RoutineId = request.RoutineId,
                StudentId = request.StudentId
            };
            db.RoutineAssignments.Add(existing);
        }

        await db.SaveChangesAsync(cancellationToken);

        return new AssignmentDto(existing.Id, routine.Id, routine.Name,
            trainerStudent.Student.Id, trainerStudent.Student.DisplayName,
            existing.IsActive, existing.CreatedAt);
    }
}
