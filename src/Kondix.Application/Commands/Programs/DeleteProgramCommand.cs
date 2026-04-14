using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record DeleteProgramCommand(
    Guid ProgramId,
    Guid TrainerId) : IRequest<Unit>;

public sealed class DeleteProgramHandler(IKondixDbContext db)
    : IRequestHandler<DeleteProgramCommand, Unit>
{
    public async Task<Unit> Handle(DeleteProgramCommand request, CancellationToken cancellationToken)
    {
        var program = await db.Programs
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId
                && p.TrainerId == request.TrainerId
                && p.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Program not found");

        // Cancel all active assignments before soft-deleting
        var activeAssignments = await db.ProgramAssignments
            .Where(pa => pa.ProgramId == request.ProgramId
                && pa.Status == ProgramAssignmentStatus.Active)
            .ToListAsync(cancellationToken);

        foreach (var pa in activeAssignments)
        {
            pa.Status = ProgramAssignmentStatus.Cancelled;
            pa.CompletedAt = DateTimeOffset.UtcNow;
        }

        program.IsActive = false;
        program.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
