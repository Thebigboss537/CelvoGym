using Kondix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Api.Controllers;

[ApiController]
[Route("api/v1/internal/test")]
public class InternalTestController(KondixDbContext db, IConfiguration config) : ControllerBase
{
    private bool AuthorizeInternal()
    {
        var expected = config["Testing:InternalApiKey"];
        if (string.IsNullOrEmpty(expected)) return false;
        var provided = Request.Headers["X-Internal-Key"].ToString();
        return !string.IsNullOrEmpty(provided) && provided == expected;
    }

    [HttpPost("approve-trainer")]
    public async Task<IActionResult> ApproveTrainer(
        [FromBody] ApproveTrainerRequest request,
        CancellationToken ct)
    {
        if (!AuthorizeInternal()) return Unauthorized();

        var trainer = await db.Trainers.FirstOrDefaultAsync(t => t.TenantId == request.TenantId, ct);
        if (trainer is null) return NotFound(new { error = "trainer not found" });

        trainer.IsApproved = true;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("cleanup")]
    public async Task<IActionResult> Cleanup(
        [FromQuery] Guid tenantId,
        CancellationToken ct)
    {
        if (!AuthorizeInternal()) return Unauthorized();

        // Remove students whose active trainer belongs to this tenant
        var trainerIds = await db.Trainers
            .Where(t => t.TenantId == tenantId)
            .Select(t => t.Id)
            .ToListAsync(ct);

        var studentsToRemove = await db.Students
            .Where(s => s.ActiveTrainerId.HasValue && trainerIds.Contains(s.ActiveTrainerId.Value))
            .ToListAsync(ct);

        db.Students.RemoveRange(studentsToRemove);

        var trainersToRemove = await db.Trainers
            .Where(t => t.TenantId == tenantId)
            .ToListAsync(ct);

        db.Trainers.RemoveRange(trainersToRemove);

        await db.SaveChangesAsync(ct);

        return NoContent();
    }
}

public sealed record ApproveTrainerRequest(Guid TenantId);
