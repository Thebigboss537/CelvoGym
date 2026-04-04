using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Programs;

public sealed record GetProgramsQuery(
    Guid TrainerId) : IRequest<List<ProgramListDto>>;

public sealed class GetProgramsHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetProgramsQuery, List<ProgramListDto>>
{
    public async Task<List<ProgramListDto>> Handle(GetProgramsQuery request, CancellationToken cancellationToken)
    {
        return await db.Programs
            .AsNoTracking()
            .Where(p => p.TrainerId == request.TrainerId && p.IsActive)
            .OrderByDescending(p => p.UpdatedAt)
            .Select(p => new ProgramListDto(
                p.Id, p.Name, p.Description, p.DurationWeeks,
                p.ProgramRoutines.Count,
                p.CreatedAt, p.UpdatedAt))
            .ToListAsync(cancellationToken);
    }
}
