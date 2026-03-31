using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using CelvoGym.Domain.Enums;
using MediatR;

namespace CelvoGym.Application.Commands.Routines;

public sealed record CreateRoutineCommand(
    Guid TrainerId,
    string Name,
    string? Description,
    List<CreateDayInput> Days) : IRequest<RoutineDetailDto>;

public sealed record CreateDayInput(
    string Name,
    List<CreateExerciseGroupInput> Groups);

public sealed record CreateExerciseGroupInput(
    GroupType GroupType,
    int RestSeconds,
    List<CreateExerciseInput> Exercises);

public sealed record CreateExerciseInput(
    string Name,
    string? Notes,
    VideoSource VideoSource,
    string? VideoUrl,
    string? Tempo,
    List<CreateExerciseSetInput> Sets);

public sealed record CreateExerciseSetInput(
    SetType SetType,
    string? TargetReps,
    string? TargetWeight,
    int? TargetRpe,
    int? RestSeconds);

public sealed class CreateRoutineHandler(ICelvoGymDbContext db)
    : IRequestHandler<CreateRoutineCommand, RoutineDetailDto>
{
    public async Task<RoutineDetailDto> Handle(CreateRoutineCommand request, CancellationToken cancellationToken)
    {
        var routine = new Routine
        {
            TrainerId = request.TrainerId,
            Name = request.Name,
            Description = request.Description,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var (days, dayDtos) = RoutineBuilder.BuildDays(request.Days);
        foreach (var day in days) routine.Days.Add(day);

        db.Routines.Add(routine);
        await db.SaveChangesAsync(cancellationToken);

        return new RoutineDetailDto(routine.Id, routine.Name, routine.Description,
            dayDtos, routine.CreatedAt, routine.UpdatedAt);
    }
}
