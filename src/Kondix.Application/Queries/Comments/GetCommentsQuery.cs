using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Comments;

public sealed record GetCommentsQuery(
    Guid RoutineId,
    Guid DayId) : IRequest<List<CommentDto>>;

public sealed class GetCommentsHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetCommentsQuery, List<CommentDto>>
{
    public async Task<List<CommentDto>> Handle(GetCommentsQuery request, CancellationToken cancellationToken)
    {
        var comments = await db.Comments
            .AsNoTracking()
            .Where(c => c.RoutineId == request.RoutineId && c.DayId == request.DayId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        // Resolve author names
        var trainerIds = comments.Where(c => c.AuthorType == AuthorType.Trainer).Select(c => c.AuthorId).Distinct();
        var studentIds = comments.Where(c => c.AuthorType == AuthorType.Student).Select(c => c.AuthorId).Distinct();

        var trainerNames = await db.Trainers
            .AsNoTracking()
            .Where(t => trainerIds.Contains(t.CelvoGuardUserId))
            .ToDictionaryAsync(t => t.CelvoGuardUserId, t => t.DisplayName, cancellationToken);

        var studentNames = await db.Students
            .AsNoTracking()
            .Where(s => studentIds.Contains(s.CelvoGuardUserId))
            .ToDictionaryAsync(s => s.CelvoGuardUserId, s => s.DisplayName, cancellationToken);

        return comments.Select(c => new CommentDto(
            c.Id,
            c.AuthorType,
            c.AuthorType == AuthorType.Trainer
                ? trainerNames.GetValueOrDefault(c.AuthorId, "Entrenador")
                : studentNames.GetValueOrDefault(c.AuthorId, "Alumno"),
            c.Text,
            c.CreatedAt
        )).ToList();
    }
}
