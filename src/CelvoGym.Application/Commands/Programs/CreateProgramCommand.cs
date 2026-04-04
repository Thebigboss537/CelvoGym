using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Programs;

public sealed record CreateProgramCommand(
    Guid TrainerId,
    string Name,
    string? Description,
    int DurationWeeks,
    List<CreateProgramRoutineInput> Routines) : IRequest<ProgramDetailDto>;

public sealed class CreateProgramHandler(ICelvoGymDbContext db)
    : IRequestHandler<CreateProgramCommand, ProgramDetailDto>
{
    public async Task<ProgramDetailDto> Handle(CreateProgramCommand request, CancellationToken cancellationToken)
    {
        if (request.Routines.Count == 0)
            throw new InvalidOperationException("A program must have at least one routine");

        // Verify all routines belong to trainer
        var routineIds = request.Routines.Select(r => r.RoutineId).ToList();
        var routines = await db.Routines
            .AsNoTracking()
            .Where(r => routineIds.Contains(r.Id) && r.TrainerId == request.TrainerId && r.IsActive)
            .ToDictionaryAsync(r => r.Id, cancellationToken);

        if (routines.Count != routineIds.Distinct().Count())
            throw new InvalidOperationException("One or more routines not found");

        var now = DateTimeOffset.UtcNow;
        var program = new Program
        {
            TrainerId = request.TrainerId,
            Name = request.Name,
            Description = request.Description,
            DurationWeeks = request.DurationWeeks,
            UpdatedAt = now
        };

        var routineDtos = new List<ProgramRoutineDto>();

        for (var i = 0; i < request.Routines.Count; i++)
        {
            var input = request.Routines[i];
            var pr = new ProgramRoutine
            {
                RoutineId = input.RoutineId,
                Label = input.Label,
                SortOrder = i
            };
            program.ProgramRoutines.Add(pr);

            var routine = routines[input.RoutineId];
            routineDtos.Add(new ProgramRoutineDto(pr.Id, pr.RoutineId, routine.Name, pr.Label, pr.SortOrder));
        }

        db.Programs.Add(program);
        await db.SaveChangesAsync(cancellationToken);

        return new ProgramDetailDto(program.Id, program.Name, program.Description,
            program.DurationWeeks, routineDtos, program.CreatedAt, program.UpdatedAt);
    }
}
