using Kondix.Application.Common.Interfaces;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Programs;

public sealed record CreateProgramCommand(
    Guid TrainerId,
    string Name,
    string? Description,
    ProgramObjective Objective,
    ProgramLevel Level,
    ProgramMode Mode,
    ProgramScheduleType ScheduleType,
    int? DaysPerWeek,
    int DurationWeeks) : IRequest<Guid>;

public sealed class CreateProgramHandler(IKondixDbContext db) : IRequestHandler<CreateProgramCommand, Guid>
{
    public async Task<Guid> Handle(CreateProgramCommand request, CancellationToken ct)
    {
        var trainerExists = await db.Trainers.AnyAsync(t => t.Id == request.TrainerId, ct);
        if (!trainerExists) throw new InvalidOperationException("Trainer not found");

        var effectiveWeeks = request.Mode == ProgramMode.Loop ? 1 : request.DurationWeeks;
        var slotsPerWeek = request.ScheduleType == ProgramScheduleType.Numbered
            ? (request.DaysPerWeek ?? throw new InvalidOperationException("DaysPerWeek required for Numbered schedule type"))
            : 7;

        var now = DateTimeOffset.UtcNow;
        var program = new Program
        {
            TrainerId = request.TrainerId,
            Name = request.Name,
            Description = request.Description,
            Objective = request.Objective,
            Level = request.Level,
            Mode = request.Mode,
            ScheduleType = request.ScheduleType,
            DaysPerWeek = request.ScheduleType == ProgramScheduleType.Numbered ? request.DaysPerWeek : null,
            IsPublished = false,
            UpdatedAt = now
        };

        for (var wi = 0; wi < effectiveWeeks; wi++)
        {
            var week = new ProgramWeek
            {
                WeekIndex = wi,
                Label = request.Mode == ProgramMode.Loop ? "Semana base" : $"Semana {wi + 1}"
            };
            for (var di = 0; di < slotsPerWeek; di++)
            {
                week.Slots.Add(new ProgramSlot { DayIndex = di, Kind = ProgramSlotKind.Empty });
            }
            program.Weeks.Add(week);
        }

        db.Programs.Add(program);
        await db.SaveChangesAsync(ct);
        return program.Id;
    }
}
