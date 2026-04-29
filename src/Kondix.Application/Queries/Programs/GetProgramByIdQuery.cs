using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Programs;

public sealed record GetProgramByIdQuery(Guid ProgramId, Guid TrainerId) : IRequest<ProgramDetailDto>;

public sealed class GetProgramByIdHandler(IKondixDbContext db)
    : IRequestHandler<GetProgramByIdQuery, ProgramDetailDto>
{
    public async Task<ProgramDetailDto> Handle(GetProgramByIdQuery request, CancellationToken ct)
    {
        var program = await db.Programs
            .AsNoTracking()
            .Where(p => p.Id == request.ProgramId && p.TrainerId == request.TrainerId)
            .Select(p => new
            {
                p.Id, p.Name, p.Description, p.Notes,
                p.Objective, p.Level, p.Mode, p.ScheduleType, p.DaysPerWeek,
                p.IsPublished, p.CreatedAt, p.UpdatedAt,
                AssignedCount = p.Assignments.Count(a => a.Status == Domain.Enums.ProgramAssignmentStatus.Active),
                Weeks = p.Weeks
                    .OrderBy(w => w.WeekIndex)
                    .Select(w => new ProgramWeekDto(
                        w.Id,
                        w.WeekIndex,
                        w.Label,
                        w.Slots
                            .OrderBy(s => s.DayIndex)
                            .Select(s => new ProgramSlotDto(
                                s.Id,
                                s.DayIndex,
                                s.Kind,
                                s.RoutineId,
                                s.Routine == null ? null : s.Routine.Name,
                                s.DayId,
                                s.Day == null ? null : s.Day.Name,
                                s.BlockId))
                            .ToList()))
                    .ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (program is null)
            throw new InvalidOperationException("Program not found");

        return new ProgramDetailDto(
            program.Id, program.Name, program.Description, program.Notes,
            program.Objective, program.Level, program.Mode, program.ScheduleType, program.DaysPerWeek,
            program.IsPublished, program.AssignedCount,
            program.CreatedAt, program.UpdatedAt,
            program.Weeks);
    }
}
