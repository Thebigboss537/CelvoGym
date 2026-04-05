using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.ProgramAssignments;

public sealed record GetProgramAssignmentsQuery(
    Guid TrainerId) : IRequest<List<ProgramAssignmentDto>>;

public sealed class GetProgramAssignmentsHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetProgramAssignmentsQuery, List<ProgramAssignmentDto>>
{
    public async Task<List<ProgramAssignmentDto>> Handle(GetProgramAssignmentsQuery request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var assignments = await db.ProgramAssignments
            .AsNoTracking()
            .Include(pa => pa.Program)
            .Include(pa => pa.Student)
            .Where(pa => pa.Program.TrainerId == request.TrainerId
                && pa.Status == ProgramAssignmentStatus.Active)
            .OrderByDescending(pa => pa.CreatedAt)
            .ToListAsync(cancellationToken);

        return assignments.Select(pa =>
        {
            var daysSinceStart = today.DayNumber - pa.StartDate.DayNumber;
            var currentWeek = daysSinceStart < 0 ? 1 : Math.Max(1, (int)Math.Ceiling((daysSinceStart + 1) / 7.0));

            return new ProgramAssignmentDto(
                pa.Id, pa.ProgramId, pa.Program.Name,
                pa.StudentId, pa.Student.DisplayName,
                pa.Mode.ToString(), pa.Status.ToString(),
                pa.TrainingDays, pa.StartDate.ToString("yyyy-MM-dd"),
                pa.EndDate.ToString("yyyy-MM-dd"),
                currentWeek, pa.Program.DurationWeeks,
                pa.CreatedAt);
        }).ToList();
    }
}
