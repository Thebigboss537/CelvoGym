using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record DeleteProgramCommand(Guid ProgramId, Guid TrainerId) : IRequest;

public sealed class DeleteProgramHandler(IKondixDbContext db) : IRequestHandler<DeleteProgramCommand>
{
    public async Task Handle(DeleteProgramCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Assignments)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        foreach (var a in program.Assignments.Where(a => a.Status == ProgramAssignmentStatus.Active))
        {
            a.Status = ProgramAssignmentStatus.Cancelled;
            a.UpdatedAt = DateTimeOffset.UtcNow;
        }

        db.Programs.Remove(program);
        await db.SaveChangesAsync(ct);
    }
}
