namespace Kondix.Application.Common.Helpers;

public static class ProgramWeekHelper
{
    public static int CalculateCurrentWeek(DateOnly startDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var daysSinceStart = today.DayNumber - startDate.DayNumber;
        return daysSinceStart < 0 ? 1 : Math.Max(1, (int)Math.Ceiling((daysSinceStart + 1) / 7.0));
    }
}
