using Kondix.Api.Extensions;
using Kondix.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/videos")]
public class VideosController(IStorageService storage) : ControllerBase
{
    private const string Bucket = "celvogym-videos";
    private const long MaxSize = 50 * 1024 * 1024; // 50MB
    private static readonly string[] AllowedTypes = ["video/mp4", "video/webm", "video/quicktime"];

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);

        if (file.Length == 0 || file.Length > MaxSize)
            return BadRequest(new { error = $"File must be between 1 byte and {MaxSize / (1024 * 1024)}MB" });

        if (!AllowedTypes.Contains(file.ContentType))
            return BadRequest(new { error = $"Allowed types: {string.Join(", ", AllowedTypes)}" });

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        await using var stream = file.OpenReadStream();
        var url = await storage.UploadAsync(Bucket, fileName, stream, file.ContentType, ct);

        return Ok(new { url, key = fileName });
    }

    [HttpDelete("{key}")]
    public async Task<IActionResult> Delete(string key, CancellationToken ct)
    {
        HttpContext.RequirePermission(Permissions.GymManage);
        await storage.DeleteAsync(Bucket, key, ct);
        return NoContent();
    }
}
