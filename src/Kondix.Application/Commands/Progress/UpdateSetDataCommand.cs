using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Progress;

public sealed record UpdateSetDataCommand(
    Guid StudentId,
    Guid SessionId,
    Guid SetId,
    Guid RoutineId,
    string? Weight,
    string? Reps,
    int? Rpe) : IRequest<SetLogDto>;

public sealed class UpdateSetDataHandler(IKondixDbContext db)
    : IRequestHandler<UpdateSetDataCommand, SetLogDto>
{
    public async Task<SetLogDto> Handle(UpdateSetDataCommand request, CancellationToken cancellationToken)
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
                ActualWeight = request.Weight,
                ActualReps = request.Reps,
                ActualRpe = request.Rpe,
                SnapshotExerciseName = exerciseSet?.Exercise.Name,
                SnapshotTargetWeight = exerciseSet?.TargetWeight,
                SnapshotTargetReps = exerciseSet?.TargetReps
            };
            db.SetLogs.Add(log);

            try
            {
                await db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (
                !cancellationToken.IsCancellationRequested &&
                ex.InnerException?.Message.Contains("ix_set_logs_session_id_set_id") == true)
            {
                // Race condition: concurrent request already created the log — retry as update.
                log = await db.SetLogs
                    .FirstAsync(sl => sl.SessionId == request.SessionId
                        && sl.SetId == request.SetId, cancellationToken);
                log.ActualWeight = request.Weight;
                log.ActualReps = request.Reps;
                log.ActualRpe = request.Rpe;
                await db.SaveChangesAsync(cancellationToken);
            }
        }
        else
        {
            log.ActualWeight = request.Weight;
            log.ActualReps = request.Reps;
            log.ActualRpe = request.Rpe;
            await db.SaveChangesAsync(cancellationToken);
        }

        return new SetLogDto(log.Id, log.SetId, log.Completed,
            log.CompletedAt, log.ActualWeight, log.ActualReps, log.ActualRpe);
    }
}
