namespace Kondix.Application.DTOs;

public sealed record TrainerNoteDto(
    Guid Id,
    string Text,
    bool IsPinned,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
