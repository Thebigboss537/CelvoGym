using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.ProgramAssignments;

public sealed record CompleteProgramAssignmentCommand(
    Guid Id,
    Guid TrainerId) : IRequest;

public sealed class CompleteProgramAssignmentHandler(IKondixDbContext db)
    : IRequestHandler<CompleteProgramAssignmentCommand>
{
    public async Task Handle(CompleteProgramAssignmentCommand request, CancellationToken cancellationToken)
    {
        var assignment = await db.ProgramAssignments
            .Include(pa => pa.Program)
            .FirstOrDefaultAsync(pa => pa.Id == request.Id
                && pa.Program.TrainerId == request.TrainerId
                && pa.Status == ProgramAssignmentStatus.Active, cancellationToken)
            ?? throw new InvalidOperationException("Assignment not found");

        assignment.Status = ProgramAssignmentStatus.Completed;
        assignment.CompletedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
    }
}
