using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Dashboard;

public sealed record GetDashboardQuery(
    Guid TrainerId) : IRequest<DashboardDto>;

public sealed class GetDashboardHandler(IKondixDbContext db)
    : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    public async Task<DashboardDto> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var weekAgo = now.AddDays(-7);
        var fiveDaysAgo = now.AddDays(-5);

        var studentLinks = await db.TrainerStudents
            .AsNoTracking()
            .Where(ts => ts.TrainerId == request.TrainerId && ts.IsActive)
            .Select(ts => new { ts.StudentId, ts.Student.DisplayName })
            .ToListAsync(cancellationToken);

        var studentIds = studentLinks.Select(ts => ts.StudentId).ToHashSet();
        var studentNames = studentLinks.ToDictionary(ts => ts.StudentId, ts => ts.DisplayName);
        var totalStudents = studentIds.Count;

        var recentSessions = await db.WorkoutSessions
            .AsNoTracking()
            .Include(ws => ws.Day)
            .Where(ws => studentIds.Contains(ws.StudentId) && ws.StartedAt >= weekAgo)
            .OrderByDescending(ws => ws.StartedAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        var activeStudentIds = recentSessions.Select(s => s.StudentId).Distinct().Count();

        var recentActivity = recentSessions.Take(10).Select(s => new RecentActivityDto(
            s.StudentId,
            studentNames.GetValueOrDefault(s.StudentId, ""),
            s.Day.Name,
            s.CompletedAt.HasValue ? "completed" : "in_progress",
            FormatTimeAgo(now - s.StartedAt)
        )).ToList();

        var recentStudentIds = await db.WorkoutSessions
            .AsNoTracking()
            .Where(ws => studentIds.Contains(ws.StudentId) && ws.StartedAt >= fiveDaysAgo)
            .Select(ws => ws.StudentId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var inactiveStudents = studentIds.Except(recentStudentIds).ToList();

        var alerts = new List<AlertDto>();
        foreach (var sid in inactiveStudents)
        {
            if (studentNames.TryGetValue(sid, out var name))
                alerts.Add(new AlertDto("inactive", $"{name} no entrena hace más de 5 días", sid));
        }

        var today = DateOnly.FromDateTime(now.UtcDateTime);
        var endingSoon = await db.ProgramAssignments
            .AsNoTracking()
            .Include(pa => pa.Student)
            .Where(pa => pa.Status == Domain.Enums.ProgramAssignmentStatus.Active
                && pa.EndDate <= today.AddDays(7)
                && pa.EndDate >= today
                && studentIds.Contains(pa.StudentId))
            .ToListAsync(cancellationToken);

        foreach (var pa in endingSoon)
        {
            var daysLeft = pa.EndDate.DayNumber - today.DayNumber;
            alerts.Add(new AlertDto("program_ending",
                $"Programa de {pa.Student.DisplayName} termina en {daysLeft} día{(daysLeft != 1 ? "s" : "")}",
                pa.StudentId));
        }

        // Pinned notes
        var pinnedNotes = await db.TrainerNotes
            .AsNoTracking()
            .Include(n => n.Student)
            .Where(n => n.TrainerId == request.TrainerId && n.IsPinned)
            .OrderByDescending(n => n.UpdatedAt)
            .Take(5)
            .Select(n => new PinnedNoteDto(n.StudentId, n.Student.DisplayName, n.Text))
            .ToListAsync(cancellationToken);

        return new DashboardDto(totalStudents, activeStudentIds, recentActivity, alerts, pinnedNotes);
    }

    private static string FormatTimeAgo(TimeSpan diff)
    {
        if (diff.TotalMinutes < 1) return "ahora";
        if (diff.TotalMinutes < 60) return $"hace {(int)diff.TotalMinutes}m";
        if (diff.TotalHours < 24) return $"hace {(int)diff.TotalHours}h";
        return $"hace {(int)diff.TotalDays}d";
    }
}
