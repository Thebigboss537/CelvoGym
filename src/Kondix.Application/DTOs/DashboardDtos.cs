namespace Kondix.Application.DTOs;

public sealed record DashboardDto(
    int TotalStudents,
    int ActiveThisWeek,
    List<RecentActivityDto> RecentActivity,
    List<AlertDto> Alerts,
    List<PinnedNoteDto> PinnedNotes);

public sealed record RecentActivityDto(
    Guid StudentId,
    string StudentName,
    string DayName,
    string Status,
    string TimeAgo);

public sealed record AlertDto(
    string Type,
    string Message,
    Guid? StudentId);

public sealed record PinnedNoteDto(
    Guid StudentId,
    string StudentName,
    string Text);
