using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Routines;

public sealed record UpdateRoutineCommand(
    Guid RoutineId,
    Guid TrainerId,
    string Name,
    string? Description,
    List<CreateDayInput> Days,
    List<string>? Tags = null,
    string? Category = null) : IRequest<RoutineDetailDto>;

public sealed class UpdateRoutineHandler(IKondixDbContext db)
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
        routine.Tags = request.Tags ?? [];
        routine.Category = request.Category;
        routine.UpdatedAt = DateTimeOffset.UtcNow;

        var (days, dayDtos) = RoutineBuilder.BuildDays(request.Days);
        foreach (var day in days) { day.RoutineId = routine.Id; db.Days.Add(day); }

        await db.SaveChangesAsync(cancellationToken);

        return new RoutineDetailDto(routine.Id, routine.Name, routine.Description,
            dayDtos, routine.Tags, routine.Category, routine.CreatedAt, routine.UpdatedAt);
    }
}
