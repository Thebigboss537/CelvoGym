using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Students;

public sealed record GetStudentsQuery(Guid TrainerId) : IRequest<List<StudentDto>>;

public sealed class GetStudentsHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetStudentsQuery, List<StudentDto>>
{
    public async Task<List<StudentDto>> Handle(GetStudentsQuery request, CancellationToken cancellationToken)
    {
        return await db.TrainerStudents
            .AsNoTracking()
            .Where(ts => ts.TrainerId == request.TrainerId && ts.IsActive)
            .OrderByDescending(ts => ts.CreatedAt)
            .Select(ts => new StudentDto(
                ts.Student.Id,
                ts.Student.DisplayName,
                ts.Student.AvatarUrl,
                ts.Student.IsActive,
                ts.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
