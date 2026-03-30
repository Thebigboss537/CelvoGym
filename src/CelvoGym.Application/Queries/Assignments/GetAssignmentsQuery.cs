using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Assignments;

public sealed record GetAssignmentsQuery(Guid TrainerId) : IRequest<List<AssignmentDto>>;

public sealed class GetAssignmentsHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetAssignmentsQuery, List<AssignmentDto>>
{
    public async Task<List<AssignmentDto>> Handle(GetAssignmentsQuery request, CancellationToken cancellationToken)
    {
        return await db.RoutineAssignments
            .AsNoTracking()
            .Where(ra => ra.Routine.TrainerId == request.TrainerId && ra.IsActive)
            .Select(ra => new AssignmentDto(
                ra.Id,
                ra.RoutineId,
                ra.Routine.Name,
                ra.StudentId,
                ra.Student.DisplayName,
                ra.IsActive,
                ra.CreatedAt))
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
