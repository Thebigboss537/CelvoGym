using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Progress;

public sealed record ToggleSetCommand(
    Guid StudentId,
    Guid SetId,
    Guid RoutineId) : IRequest<SetLogDto>;

public sealed class ToggleSetHandler(ICelvoGymDbContext db)
    : IRequestHandler<ToggleSetCommand, SetLogDto>
{
    public async Task<SetLogDto> Handle(ToggleSetCommand request, CancellationToken cancellationToken)
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
                Completed = true,
                CompletedAt = DateTimeOffset.UtcNow
            };
            db.SetLogs.Add(log);
        }
        else
        {
            log.Completed = !log.Completed;
            log.CompletedAt = log.Completed ? DateTimeOffset.UtcNow : null;
        }

        await db.SaveChangesAsync(cancellationToken);

        return new SetLogDto(log.Id, log.SetId, log.Completed,
            log.CompletedAt, log.ActualWeight, log.ActualReps, log.ActualRpe);
    }
}
