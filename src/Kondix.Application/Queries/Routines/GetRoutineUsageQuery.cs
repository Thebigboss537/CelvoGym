using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Routines;

public sealed record GetRoutineUsageQuery(Guid RoutineId, Guid TrainerId) : IRequest<RoutineUsageDto>;

public sealed class GetRoutineUsageHandler(IKondixDbContext db)
    : IRequestHandler<GetRoutineUsageQuery, RoutineUsageDto>
{
    public async Task<RoutineUsageDto> Handle(GetRoutineUsageQuery request, CancellationToken cancellationToken)
    {
        var routine = await db.Routines
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId
                && r.TrainerId == request.TrainerId
                && r.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Routine not found");

        var activeProgramIds = await db.ProgramRoutines
            .AsNoTracking()
            .Where(pr => pr.RoutineId == request.RoutineId)
            .Join(db.Programs.Where(p => p.IsActive),
                pr => pr.ProgramId, p => p.Id,
                (pr, p) => p.Id)
            .Distinct()
            .ToListAsync(cancellationToken);

        var activeAssignmentCount = activeProgramIds.Count > 0
            ? await db.ProgramAssignments
                .CountAsync(pa => activeProgramIds.Contains(pa.ProgramId)
                    && pa.Status == ProgramAssignmentStatus.Active, cancellationToken)
            : 0;

        var hasSessions = await db.WorkoutSessions
            .AnyAsync(ws => ws.RoutineId == request.RoutineId, cancellationToken);

        return new RoutineUsageDto(activeProgramIds.Count, activeAssignmentCount, hasSessions);
    }
}
