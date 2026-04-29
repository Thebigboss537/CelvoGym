using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record PublishProgramCommand(Guid ProgramId, Guid TrainerId) : IRequest;

public sealed class PublishProgramHandler(IKondixDbContext db) : IRequestHandler<PublishProgramCommand>
{
    public async Task Handle(PublishProgramCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        if (program.IsPublished) return;
        program.IsPublished = true;
        program.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }
}
