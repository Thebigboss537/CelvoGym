using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Sessions;

public sealed record UpdateSetNoteCommand(Guid StudentId, Guid SetLogId, string? Note) : IRequest;

public sealed class UpdateSetNoteCommandHandler(IKondixDbContext db)
    : IRequestHandler<UpdateSetNoteCommand>
{
    public async Task Handle(UpdateSetNoteCommand request, CancellationToken cancellationToken)
    {
        var setLog = await db.SetLogs
            .Include(s => s.Session)
            .FirstOrDefaultAsync(s => s.Id == request.SetLogId && s.StudentId == request.StudentId, cancellationToken)
            ?? throw new InvalidOperationException("Set log not found");

        if (setLog.Session.CompletedAt is not null)
            throw new InvalidOperationException("Session not active");

        setLog.Notes = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        await db.SaveChangesAsync(cancellationToken);
    }
}
