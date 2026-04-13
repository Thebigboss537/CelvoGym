using Kondix.Application.Common.Helpers;
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.ProgramAssignments;

public sealed record GetProgramAssignmentsQuery(
    Guid TrainerId) : IRequest<List<ProgramAssignmentDto>>;

public sealed class GetProgramAssignmentsHandler(IKondixDbContext db)
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
