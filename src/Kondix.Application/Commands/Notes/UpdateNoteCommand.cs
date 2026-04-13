using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Notes;

public sealed record UpdateNoteCommand(
    Guid NoteId,
    Guid TrainerId,
    string Text,
    bool IsPinned) : IRequest<TrainerNoteDto>;

public sealed class UpdateNoteHandler(IKondixDbContext db)
    : IRequestHandler<UpdateNoteCommand, TrainerNoteDto>
{
    public async Task<TrainerNoteDto> Handle(UpdateNoteCommand request, CancellationToken cancellationToken)
    {
        var note = await db.TrainerNotes
            .FirstOrDefaultAsync(n => n.Id == request.NoteId
                && n.TrainerId == request.TrainerId, cancellationToken)
            ?? throw new InvalidOperationException("Note not found");

        note.Text = request.Text;
        note.IsPinned = request.IsPinned;
        note.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return new TrainerNoteDto(note.Id, note.Text, note.IsPinned, note.CreatedAt, note.UpdatedAt);
    }
}
