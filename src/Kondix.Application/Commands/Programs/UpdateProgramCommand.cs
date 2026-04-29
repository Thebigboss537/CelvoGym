using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record UpdateProgramCommand(
    Guid ProgramId,
    Guid TrainerId,
    string Name,
    string? Description,
    string? Notes,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode) : IRequest;

public sealed class UpdateProgramHandler(IKondixDbContext db) : IRequestHandler<UpdateProgramCommand>
{
    public async Task Handle(UpdateProgramCommand request, CancellationToken ct)
    {
        var program = await db.Programs
            .Include(p => p.Weeks)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId, ct);
        if (program is null) throw new InvalidOperationException("Program not found");

        if (request.Mode == ProgramMode.Loop && program.Weeks.Count > 1)
            throw new InvalidOperationException("Cannot switch to Loop with multiple weeks; collapse first");

        program.Name = request.Name;
        program.Description = request.Description;
        program.Notes = request.Notes;
        program.Objective = request.Objective;
        program.Level = request.Level;
        program.Mode = request.Mode;
        program.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}
