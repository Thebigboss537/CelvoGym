using CelvoGym.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Students;

public sealed record DeactivateStudentCommand(
    Guid StudentId,
    Guid TrainerId) : IRequest<Unit>;

public sealed class DeactivateStudentHandler(ICelvoGymDbContext db)
    : IRequestHandler<DeactivateStudentCommand, Unit>
{
    public async Task<Unit> Handle(DeactivateStudentCommand request, CancellationToken cancellationToken)
    {
        var link = await db.TrainerStudents
            .FirstOrDefaultAsync(ts => ts.StudentId == request.StudentId
                && ts.TrainerId == request.TrainerId
                && ts.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Student relationship not found");

        link.IsActive = false;

        // Also deactivate all routine assignments for this student from this trainer
        var assignments = await db.RoutineAssignments
            .Where(ra => ra.StudentId == request.StudentId
                && ra.Routine.TrainerId == request.TrainerId
                && ra.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var assignment in assignments)
        {
            assignment.IsActive = false;
            assignment.DeactivatedAt = DateTimeOffset.UtcNow;
        }

        // Clear active trainer if this was their only trainer
        var student = await db.Students.FindAsync([request.StudentId], cancellationToken);
        if (student is not null && student.ActiveTrainerId == request.TrainerId)
            student.ActiveTrainerId = null;

        await db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
