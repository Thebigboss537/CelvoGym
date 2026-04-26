using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Trainers;

public sealed record ListPendingTrainersQuery() : IRequest<List<PendingTrainerDto>>;

public sealed record PendingTrainerDto(
    Guid TrainerId,
    string DisplayName,
    Guid CelvoGuardUserId,
    DateTimeOffset RegisteredAt);

public sealed class ListPendingTrainersQueryHandler(IKondixDbContext db)
    : IRequestHandler<ListPendingTrainersQuery, List<PendingTrainerDto>>
{
    public async Task<List<PendingTrainerDto>> Handle(
        ListPendingTrainersQuery request, CancellationToken cancellationToken) =>
        await db.Trainers
            .AsNoTracking()
            .Where(t => !t.IsApproved)
            .OrderBy(t => t.CreatedAt)
            .Select(t => new PendingTrainerDto(t.Id, t.DisplayName, t.CelvoGuardUserId, t.CreatedAt))
            .ToListAsync(cancellationToken);
}
