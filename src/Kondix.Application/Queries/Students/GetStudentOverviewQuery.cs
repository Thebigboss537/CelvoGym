using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Students;

public sealed record GetStudentOverviewQuery(Guid TrainerId, Guid StudentId) : IRequest<StudentOverviewDto>;

public sealed class GetStudentOverviewHandler(IKondixDbContext db)
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
        var daysFromMonday = ((int)now.DayOfWeek + 6) % 7; // Monday=0, Sunday=6
        var weekStartDate = new DateTimeOffset(now.Date.AddDays(-daysFromMonday), TimeSpan.Zero);

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

        // TODO Phase 5: restore expected days from v3 ProgramAssignment shape (TrainingDays removed).
        var expectedDays = 0;
        var adherence = expectedDays > 0
            ? Math.Min(100, (int)Math.Round((double)sessionsThisWeek / expectedDays * 100))
            : 0;

        // Weekly volume (last 6 weeks) — materialize then group in memory
        var sixWeeksAgo = new DateTimeOffset(now.Date.AddDays(-42), TimeSpan.Zero);
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
