namespace Kondix.Application.DTOs;

public sealed record PersonalRecordDto(
    Guid Id,
    string ExerciseName,
    string Weight,
    string? Reps,
    DateTimeOffset AchievedAt);

public sealed record NewPrDto(
    string ExerciseName,
    string Weight,
    string? PreviousWeight);
