using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Progress;

public sealed record ToggleSetCommand(
    Guid StudentId,
    Guid SessionId,
    Guid SetId,
    Guid RoutineId) : IRequest<SetLogDto>;

public sealed class ToggleSetHandler(ICelvoGymDbContext db)
    : IRequestHandler<ToggleSetCommand, SetLogDto>
{
    public async Task<SetLogDto> Handle(ToggleSetCommand request, CancellationToken cancellationToken)
    {
        var session = await db.WorkoutSessions
            .FirstOrDefaultAsync(ws => ws.Id == request.SessionId
                && ws.StudentId == request.StudentId, cancellationToken)
            ?? throw new InvalidOperationException("Session not found");

        var log = await db.SetLogs
            .FirstOrDefaultAsync(sl => sl.SessionId == request.SessionId
                && sl.SetId == request.SetId, cancellationToken);

        if (log is null)
        {
            var exerciseSet = await db.ExerciseSets
                .Include(es => es.Exercise)
                .FirstOrDefaultAsync(es => es.Id == request.SetId, cancellationToken);

            log = new SetLog
            {
                SessionId = request.SessionId,
                StudentId = request.StudentId,
                SetId = request.SetId,
                RoutineId = request.RoutineId,
                Completed = true,
                CompletedAt = DateTimeOffset.UtcNow,
                ActualWeight = exerciseSet?.TargetWeight,
                ActualReps = exerciseSet?.TargetReps,
                SnapshotExerciseName = exerciseSet?.Exercise.Name,
                SnapshotTargetWeight = exerciseSet?.TargetWeight,
                SnapshotTargetReps = exerciseSet?.TargetReps
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
