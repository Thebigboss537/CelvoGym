using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Routines;

public sealed record UpdateRoutineCommand(
    Guid RoutineId,
    Guid TrainerId,
    string Name,
    string? Description,
    List<CreateDayInput> Days) : IRequest<RoutineDetailDto>;

public sealed class UpdateRoutineHandler(ICelvoGymDbContext db)
    : IRequestHandler<UpdateRoutineCommand, RoutineDetailDto>
{
    public async Task<RoutineDetailDto> Handle(UpdateRoutineCommand request, CancellationToken cancellationToken)
    {
        var routine = await db.Routines
            .FirstOrDefaultAsync(r => r.Id == request.RoutineId && r.TrainerId == request.TrainerId && r.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Routine not found");

        await db.Days.Where(d => d.RoutineId == routine.Id).ExecuteDeleteAsync(cancellationToken);

        routine.Name = request.Name;
        routine.Description = request.Description;
        routine.UpdatedAt = DateTimeOffset.UtcNow;

        var (days, dayDtos) = RoutineBuilder.BuildDays(request.Days);
        foreach (var day in days) { day.RoutineId = routine.Id; db.Days.Add(day); }

        await db.SaveChangesAsync(cancellationToken);

        return new RoutineDetailDto(routine.Id, routine.Name, routine.Description,
            dayDtos, routine.CreatedAt, routine.UpdatedAt);
    }
}
