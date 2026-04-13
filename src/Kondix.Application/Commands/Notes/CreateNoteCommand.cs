using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Notes;

public sealed record CreateNoteCommand(
    Guid TrainerId,
    Guid StudentId,
    string Text,
    bool IsPinned) : IRequest<TrainerNoteDto>;

public sealed class CreateNoteHandler(ICelvoGymDbContext db)
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
