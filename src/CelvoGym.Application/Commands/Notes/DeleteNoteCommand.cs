using CelvoGym.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Notes;

public sealed record DeleteNoteCommand(
    Guid NoteId,
    Guid TrainerId) : IRequest<Unit>;

public sealed class DeleteNoteHandler(ICelvoGymDbContext db)
    : IRequestHandler<DeleteNoteCommand, Unit>
{
    public async Task<Unit> Handle(DeleteNoteCommand request, CancellationToken cancellationToken)
    {
        var note = await db.TrainerNotes
            .FirstOrDefaultAsync(n => n.Id == request.NoteId
                && n.TrainerId == request.TrainerId, cancellationToken)
            ?? throw new InvalidOperationException("Note not found");

        db.TrainerNotes.Remove(note);
        await db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
