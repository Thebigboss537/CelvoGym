using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.PersonalRecords;

public sealed record GetPersonalRecordsQuery(
    Guid StudentId) : IRequest<List<PersonalRecordDto>>;

public sealed class GetPersonalRecordsHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetPersonalRecordsQuery, List<PersonalRecordDto>>
{
    public async Task<List<PersonalRecordDto>> Handle(GetPersonalRecordsQuery request, CancellationToken cancellationToken)
    {
        return await db.PersonalRecords
            .AsNoTracking()
            .Where(pr => pr.StudentId == request.StudentId)
            .OrderBy(pr => pr.ExerciseName)
            .Select(pr => new PersonalRecordDto(pr.Id, pr.ExerciseName, pr.Weight, pr.Reps, pr.AchievedAt))
            .ToListAsync(cancellationToken);
    }
}
