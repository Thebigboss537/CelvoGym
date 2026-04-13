namespace CelvoGym.Application.DTOs;

public sealed record ExerciseProgressDto(
    string ExerciseName,
    List<ExerciseDataPointDto> DataPoints);

public sealed record ExerciseDataPointDto(
    string Date,
    string? MaxWeight,
    string? TotalReps,
    int Sets);

public sealed record StudentOverviewDto(
    int TotalSessions,
    int SessionsThisWeek,
    int AdherencePercentage,
    List<WeeklyVolumeDto> WeeklyVolume);

public sealed record WeeklyVolumeDto(
    string WeekStart,
    int Sessions,
    int CompletedSets);
