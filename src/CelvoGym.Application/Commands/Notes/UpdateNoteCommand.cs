using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Notes;

public sealed record UpdateNoteCommand(
    Guid NoteId,
    Guid TrainerId,
    string Text,
    bool IsPinned) : IRequest<TrainerNoteDto>;

public sealed class UpdateNoteHandler(ICelvoGymDbContext db)
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
