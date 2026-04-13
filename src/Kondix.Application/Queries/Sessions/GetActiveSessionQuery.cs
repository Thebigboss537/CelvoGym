using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Sessions;

public sealed record GetActiveSessionQuery(
    Guid StudentId) : IRequest<WorkoutSessionDto?>;

public sealed class GetActiveSessionHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetActiveSessionQuery, WorkoutSessionDto?>
{
    public async Task<WorkoutSessionDto?> Handle(GetActiveSessionQuery request, CancellationToken cancellationToken)
    {
        var session = await db.WorkoutSessions
            .AsNoTracking()
            .Where(ws => ws.StudentId == request.StudentId && ws.CompletedAt == null)
            .OrderByDescending(ws => ws.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (session is null) return null;

        return new WorkoutSessionDto(session.Id, session.RoutineId, session.DayId,
            session.StartedAt, session.CompletedAt, session.Notes);
    }
}
