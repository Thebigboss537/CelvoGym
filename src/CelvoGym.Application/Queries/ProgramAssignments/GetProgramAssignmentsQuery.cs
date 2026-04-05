using CelvoGym.Application.Common.Helpers;
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
            var currentWeek = ProgramWeekHelper.CalculateCurrentWeek(pa.StartDate);

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
