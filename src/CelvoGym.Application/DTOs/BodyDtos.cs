using CelvoGym.Domain.Enums;

namespace CelvoGym.Application.DTOs;

public sealed record BodyMetricDto(
    Guid Id,
    DateOnly RecordedAt,
    decimal? Weight,
    decimal? BodyFat,
    string? Notes,
    List<BodyMeasurementDto> Measurements);

public sealed record BodyMeasurementDto(
    MeasurementType Type,
    decimal Value);

public sealed record CreateBodyMeasurementInput(
    MeasurementType Type,
    decimal Value);

public sealed record ProgressPhotoDto(
    Guid Id,
    DateOnly TakenAt,
    string PhotoUrl,
    PhotoAngle Angle,
    string? Notes);
