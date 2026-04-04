using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Programs;

public sealed record UpdateProgramCommand(
    Guid ProgramId,
    Guid TrainerId,
    string Name,
    string? Description,
    int DurationWeeks,
    List<CreateProgramRoutineInput> Routines) : IRequest<ProgramDetailDto>;

public sealed class UpdateProgramHandler(ICelvoGymDbContext db)
    : IRequestHandler<UpdateProgramCommand, ProgramDetailDto>
{
    public async Task<ProgramDetailDto> Handle(UpdateProgramCommand request, CancellationToken cancellationToken)
    {
        var program = await db.Programs
            .Include(p => p.ProgramRoutines)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId
                && p.TrainerId == request.TrainerId
                && p.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Program not found");

        if (request.Routines.Count == 0)
            throw new InvalidOperationException("A program must have at least one routine");

        var routineIds = request.Routines.Select(r => r.RoutineId).ToList();
        var routines = await db.Routines
            .AsNoTracking()
            .Where(r => routineIds.Contains(r.Id) && r.TrainerId == request.TrainerId && r.IsActive)
            .ToDictionaryAsync(r => r.Id, cancellationToken);

        if (routines.Count != routineIds.Distinct().Count())
            throw new InvalidOperationException("One or more routines not found");

        program.Name = request.Name;
        program.Description = request.Description;
        program.DurationWeeks = request.DurationWeeks;
        program.UpdatedAt = DateTimeOffset.UtcNow;

        // Replace program routines
        db.ProgramRoutines.RemoveRange(program.ProgramRoutines);

        var routineDtos = new List<ProgramRoutineDto>();
        for (var i = 0; i < request.Routines.Count; i++)
        {
            var input = request.Routines[i];
            var pr = new ProgramRoutine
            {
                ProgramId = program.Id,
                RoutineId = input.RoutineId,
                Label = input.Label,
                SortOrder = i
            };
            db.ProgramRoutines.Add(pr);

            var routine = routines[input.RoutineId];
            routineDtos.Add(new ProgramRoutineDto(pr.Id, pr.RoutineId, routine.Name, pr.Label, pr.SortOrder));
        }

        await db.SaveChangesAsync(cancellationToken);

        return new ProgramDetailDto(program.Id, program.Name, program.Description,
            program.DurationWeeks, routineDtos, program.CreatedAt, program.UpdatedAt);
    }
}
