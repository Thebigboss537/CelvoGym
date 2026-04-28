using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.ProgramAssignments;

public sealed record AssignProgramCommand(
    Guid TrainerId,
    Guid StudentId,
    Guid ProgramId,
    DateTimeOffset StartDate) : IRequest<Guid>;

public sealed class AssignProgramHandler(IKondixDbContext db) : IRequestHandler<AssignProgramCommand, Guid>
{
    public async Task<Guid> Handle(AssignProgramCommand request, CancellationToken ct)
    {
        // 1. Verify program belongs to trainer + IsPublished.
        var program = await db.Programs
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId
                && p.TrainerId == request.TrainerId, ct)
            ?? throw new InvalidOperationException("Program not found");
        if (!program.IsPublished)
            throw new InvalidOperationException("Publicá el programa primero");

        // 2. Cancel any prior Active assignment for this student.
        var now = DateTimeOffset.UtcNow;
        var priorActive = await db.ProgramAssignments
            .Where(a => a.StudentId == request.StudentId
                && a.TrainerId == request.TrainerId
                && a.Status == ProgramAssignmentStatus.Active)
            .ToListAsync(ct);
        foreach (var prior in priorActive)
        {
            prior.Status = ProgramAssignmentStatus.Cancelled;
            prior.UpdatedAt = now;
        }

        // 3. Insert new active assignment.
        var assignment = new ProgramAssignment
        {
            TrainerId = request.TrainerId,
            StudentId = request.StudentId,
            ProgramId = request.ProgramId,
            StartDate = request.StartDate,
            Status = ProgramAssignmentStatus.Active,
            UpdatedAt = now,
        };
        db.ProgramAssignments.Add(assignment);
        await db.SaveChangesAsync(ct);
        return assignment.Id;
    }
}
