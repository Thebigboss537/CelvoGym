using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record UpdateProgramCommand(
    Guid ProgramId,
    Guid TrainerId,
    string Name,
    string? Description,
    int DurationWeeks,
    List<CreateProgramRoutineInput> Routines) : IRequest<ProgramDetailDto>;

public sealed class UpdateProgramHandler(IKondixDbContext db)
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

        // Guard: if routines changed, check for active assignments
        var oldRoutineIds = program.ProgramRoutines
            .OrderBy(pr => pr.SortOrder)
            .Select(pr => pr.RoutineId)
            .ToList();
        var newRoutineIds = request.Routines
            .Select(r => r.RoutineId)
            .ToList();

        // SequenceEqual is intentional: reordering routines changes which routine
        // RotationIndex % count resolves to, so order matters — do NOT change to set comparison.
        var routinesChanged = !oldRoutineIds.SequenceEqual(newRoutineIds);

        if (routinesChanged)
        {
            var activeCount = await db.ProgramAssignments
                .CountAsync(pa => pa.ProgramId == request.ProgramId
                    && pa.Status == ProgramAssignmentStatus.Active, cancellationToken);

            if (activeCount > 0)
                throw new InvalidOperationException(
                    $"No se pueden modificar las rutinas: {activeCount} alumno(s) asignado(s). Cancela las asignaciones primero.");
        }

        program.Name = request.Name;
        program.Description = request.Description;
        program.DurationWeeks = request.DurationWeeks;
        program.UpdatedAt = DateTimeOffset.UtcNow;

        // Only replace routines if they changed
        if (routinesChanged)
        {
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

        await db.SaveChangesAsync(cancellationToken);

        // Return current routines (unchanged)
        var currentDtos = program.ProgramRoutines
            .OrderBy(pr => pr.SortOrder)
            .Select(pr => new ProgramRoutineDto(pr.Id, pr.RoutineId, routines[pr.RoutineId].Name, pr.Label, pr.SortOrder))
            .ToList();

        return new ProgramDetailDto(program.Id, program.Name, program.Description,
            program.DurationWeeks, currentDtos, program.CreatedAt, program.UpdatedAt);
    }
}
