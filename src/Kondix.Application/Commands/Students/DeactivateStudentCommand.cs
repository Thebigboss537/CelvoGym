using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Students;

public sealed record DeactivateStudentCommand(
    Guid StudentId,
    Guid TrainerId) : IRequest<Unit>;

public sealed class DeactivateStudentHandler(IKondixDbContext db)
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

        // Cancel all active program assignments for this student from this trainer
        var programAssignments = await db.ProgramAssignments
            .Where(pa => pa.StudentId == request.StudentId
                && pa.Program.TrainerId == request.TrainerId
                && pa.Status == Domain.Enums.ProgramAssignmentStatus.Active)
            .ToListAsync(cancellationToken);

        foreach (var pa in programAssignments)
        {
            pa.Status = Domain.Enums.ProgramAssignmentStatus.Cancelled;
            pa.UpdatedAt = DateTimeOffset.UtcNow;
        }

        // Clear active trainer if this was their only trainer
        var student = await db.Students.FindAsync([request.StudentId], cancellationToken);
        if (student is not null && student.ActiveTrainerId == request.TrainerId)
            student.ActiveTrainerId = null;

        await db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
