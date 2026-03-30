using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using CelvoGym.Domain.Enums;
using MediatR;

namespace CelvoGym.Application.Commands.Comments;

public sealed record CreateCommentCommand(
    Guid RoutineId,
    Guid DayId,
    Guid? ExerciseId,
    Guid AuthorId,
    AuthorType AuthorType,
    string AuthorName,
    string Text) : IRequest<CommentDto>;

public sealed class CreateCommentHandler(ICelvoGymDbContext db)
    : IRequestHandler<CreateCommentCommand, CommentDto>
{
    public async Task<CommentDto> Handle(CreateCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = new Comment
        {
            RoutineId = request.RoutineId,
            DayId = request.DayId,
            ExerciseId = request.ExerciseId,
            AuthorId = request.AuthorId,
            AuthorType = request.AuthorType,
            Text = request.Text
        };

        db.Comments.Add(comment);
        await db.SaveChangesAsync(cancellationToken);

        return new CommentDto(comment.Id, comment.AuthorType,
            request.AuthorName, comment.Text, comment.CreatedAt);
    }
}
