using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Notes;

public sealed record GetNotesQuery(
    Guid TrainerId,
    Guid StudentId) : IRequest<List<TrainerNoteDto>>;

public sealed class GetNotesHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetNotesQuery, List<TrainerNoteDto>>
{
    public async Task<List<TrainerNoteDto>> Handle(GetNotesQuery request, CancellationToken cancellationToken)
    {
        return await db.TrainerNotes
            .AsNoTracking()
            .Where(n => n.TrainerId == request.TrainerId && n.StudentId == request.StudentId)
            .OrderByDescending(n => n.IsPinned)
            .ThenByDescending(n => n.UpdatedAt)
            .Select(n => new TrainerNoteDto(n.Id, n.Text, n.IsPinned, n.CreatedAt, n.UpdatedAt))
            .ToListAsync(cancellationToken);
    }
}
