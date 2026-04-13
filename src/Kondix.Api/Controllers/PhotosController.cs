using Kondix.Api.Extensions;
using Kondix.Application.Commands.Body;
using Kondix.Application.DTOs;
using Kondix.Domain.Enums;
using Kondix.Domain.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/public/my/photos")]
public class PhotosController(IStorageService storage, IMediator mediator) : ControllerBase
{
    private const string Bucket = "kondix-photos";
    private const long MaxSize = 10 * 1024 * 1024; // 10MB
    private static readonly string[] AllowedTypes = ["image/jpeg", "image/png", "image/webp"];

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(
        IFormFile file,
        [FromForm] string angle,
        [FromForm] string? notes,
        CancellationToken ct)
    {
        var studentId = HttpContext.GetStudentId();

        if (file.Length == 0 || file.Length > MaxSize)
            return BadRequest(new { error = $"La foto debe ser menor a {MaxSize / (1024 * 1024)}MB" });

        if (!AllowedTypes.Contains(file.ContentType))
            return BadRequest(new { error = "Formatos permitidos: JPEG, PNG, WebP" });

        var fileName = $"{studentId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        await using var stream = file.OpenReadStream();
        var url = await storage.UploadAsync(Bucket, fileName, stream, file.ContentType, ct);

        if (!Enum.TryParse<PhotoAngle>(angle, true, out var photoAngle))
            photoAngle = PhotoAngle.Front;

        var result = await mediator.Send(new CreateProgressPhotoCommand(
            studentId, DateOnly.FromDateTime(DateTime.UtcNow), url, photoAngle, notes), ct);

        return Ok(result);
    }
}
