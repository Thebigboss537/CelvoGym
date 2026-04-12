using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Students;

public sealed record GetStudentOverviewQuery(Guid TrainerId, Guid StudentId) : IRequest<StudentOverviewDto>;

public sealed class GetStudentOverviewHandler(ICelvoGymDbContext db)
    : IRequestHandler<GetStudentOverviewQuery, StudentOverviewDto>
{
    public async Task<StudentOverviewDto> Handle(GetStudentOverviewQuery request, CancellationToken cancellationToken)
    {
        // Verify trainer-student relationship
        var hasAccess = await db.TrainerStudents
            .AnyAsync(ts => ts.TrainerId == request.TrainerId
                && ts.StudentId == request.StudentId
                && ts.IsActive, cancellationToken);

        if (!hasAccess)
            throw new InvalidOperationException("Student not found");

        var now = DateTimeOffset.UtcNow;
        var weekStart = now.AddDays(-(int)now.DayOfWeek + (int)DayOfWeek.Monday);
        if (now.DayOfWeek == DayOfWeek.Sunday) weekStart = weekStart.AddDays(-7);
        var weekStartDate = weekStart.Date;

        // Total completed sessions
        var totalSessions = await db.WorkoutSessions
            .CountAsync(ws => ws.StudentId == request.StudentId
                && ws.CompletedAt != null, cancellationToken);

        // Sessions this week
        var sessionsThisWeek = await db.WorkoutSessions
            .CountAsync(ws => ws.StudentId == request.StudentId
                && ws.CompletedAt != null
                && ws.StartedAt >= weekStartDate, cancellationToken);

        // Adherence: sessions this week / expected training days this week
        // Get active assignment to know expected training days
        var activeAssignment = await db.ProgramAssignments
            .AsNoTracking()
            .FirstOrDefaultAsync(pa => pa.StudentId == request.StudentId
                && pa.Status == Domain.Enums.ProgramAssignmentStatus.Active, cancellationToken);

        var expectedDays = activeAssignment?.TrainingDays?.Count ?? 0;
        var adherence = expectedDays > 0
            ? Math.Min(100, (int)Math.Round((double)sessionsThisWeek / expectedDays * 100))
            : 0;

        // Weekly volume (last 6 weeks) — materialize then group in memory
        var sixWeeksAgo = now.AddDays(-42);
        var recentSessions = await db.WorkoutSessions
            .AsNoTracking()
            .Where(ws => ws.StudentId == request.StudentId
                && ws.CompletedAt != null
                && ws.StartedAt >= sixWeeksAgo)
            .Select(ws => new { ws.StartedAt, SetCount = ws.SetLogs.Count(sl => sl.Completed) })
            .ToListAsync(cancellationToken);

        var weeklyVolume = recentSessions
            .GroupBy(s => s.StartedAt.Date.AddDays(-(int)s.StartedAt.DayOfWeek + (int)DayOfWeek.Monday))
            .OrderBy(g => g.Key)
            .Select(g => new WeeklyVolumeDto(
                g.Key.ToString("yyyy-MM-dd"),
                g.Count(),
                g.Sum(s => s.SetCount)))
            .ToList();

        return new StudentOverviewDto(totalSessions, sessionsThisWeek, adherence, weeklyVolume);
    }
}
