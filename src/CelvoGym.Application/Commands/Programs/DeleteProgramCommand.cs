using CelvoGym.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Programs;

public sealed record DeleteProgramCommand(
    Guid ProgramId,
    Guid TrainerId) : IRequest<Unit>;

public sealed class DeleteProgramHandler(ICelvoGymDbContext db)
    : IRequestHandler<DeleteProgramCommand, Unit>
{
    public async Task<Unit> Handle(DeleteProgramCommand request, CancellationToken cancellationToken)
    {
        var program = await db.Programs
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId
                && p.TrainerId == request.TrainerId
                && p.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Program not found");

        program.IsActive = false;
        program.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
