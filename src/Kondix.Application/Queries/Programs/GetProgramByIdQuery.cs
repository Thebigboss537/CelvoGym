using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Programs;

public sealed record GetProgramByIdQuery(
    Guid ProgramId,
    Guid TrainerId) : IRequest<ProgramDetailDto>;

public sealed class GetProgramByIdHandler(IKondixDbContext db)
    : IRequestHandler<GetProgramByIdQuery, ProgramDetailDto>
{
    public async Task<ProgramDetailDto> Handle(GetProgramByIdQuery request, CancellationToken cancellationToken)
    {
        var program = await db.Programs
            .AsNoTracking()
            .Include(p => p.ProgramRoutines.OrderBy(pr => pr.SortOrder))
                .ThenInclude(pr => pr.Routine)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId
                && p.TrainerId == request.TrainerId
                && p.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Program not found");

        var routineDtos = program.ProgramRoutines.Select(pr =>
            new ProgramRoutineDto(pr.Id, pr.RoutineId, pr.Routine.Name, pr.Label, pr.SortOrder)
        ).ToList();

        return new ProgramDetailDto(program.Id, program.Name, program.Description,
            program.DurationWeeks, routineDtos, program.CreatedAt, program.UpdatedAt);
    }
}
