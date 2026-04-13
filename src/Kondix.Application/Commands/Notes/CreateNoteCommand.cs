using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Notes;

public sealed record CreateNoteCommand(
    Guid TrainerId,
    Guid StudentId,
    string Text,
    bool IsPinned) : IRequest<TrainerNoteDto>;

public sealed class CreateNoteHandler(IKondixDbContext db)
    : IRequestHandler<CreateNoteCommand, TrainerNoteDto>
{
    public async Task<TrainerNoteDto> Handle(CreateNoteCommand request, CancellationToken cancellationToken)
    {
        var isLinked = await db.TrainerStudents
            .AnyAsync(ts => ts.TrainerId == request.TrainerId
                && ts.StudentId == request.StudentId
                && ts.IsActive, cancellationToken);
        if (!isLinked) throw new InvalidOperationException("Student not linked to this trainer");

        var now = DateTimeOffset.UtcNow;
        var note = new TrainerNote
        {
            TrainerId = request.TrainerId,
            StudentId = request.StudentId,
            Text = request.Text,
            IsPinned = request.IsPinned,
            UpdatedAt = now
        };

        db.TrainerNotes.Add(note);
        await db.SaveChangesAsync(cancellationToken);

        return new TrainerNoteDto(note.Id, note.Text, note.IsPinned, note.CreatedAt, note.UpdatedAt);
    }
}
