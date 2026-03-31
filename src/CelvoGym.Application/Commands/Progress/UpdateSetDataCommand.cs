using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Progress;

public sealed record UpdateSetDataCommand(
    Guid StudentId,
    Guid SetId,
    Guid RoutineId,
    string? Weight,
    string? Reps,
    int? Rpe) : IRequest<SetLogDto>;

public sealed class UpdateSetDataHandler(ICelvoGymDbContext db)
    : IRequestHandler<UpdateSetDataCommand, SetLogDto>
{
    public async Task<SetLogDto> Handle(UpdateSetDataCommand request, CancellationToken cancellationToken)
    {
        var hasAssignment = await db.RoutineAssignments
            .AnyAsync(ra => ra.RoutineId == request.RoutineId && ra.StudentId == request.StudentId && ra.IsActive, cancellationToken);
        if (!hasAssignment) throw new InvalidOperationException("Routine not assigned to this student");

        var log = await db.SetLogs
            .FirstOrDefaultAsync(sl => sl.StudentId == request.StudentId
                && sl.SetId == request.SetId, cancellationToken);

        if (log is null)
        {
            log = new SetLog
            {
                StudentId = request.StudentId,
                SetId = request.SetId,
                RoutineId = request.RoutineId,
                ActualWeight = request.Weight,
                ActualReps = request.Reps,
                ActualRpe = request.Rpe
            };
            db.SetLogs.Add(log);
        }
        else
        {
            log.ActualWeight = request.Weight;
            log.ActualReps = request.Reps;
            log.ActualRpe = request.Rpe;
        }

        await db.SaveChangesAsync(cancellationToken);

        return new SetLogDto(log.Id, log.SetId, log.Completed,
            log.CompletedAt, log.ActualWeight, log.ActualReps, log.ActualRpe);
    }
}
