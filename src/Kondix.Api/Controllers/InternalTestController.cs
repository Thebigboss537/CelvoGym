using Kondix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Api.Controllers;

// Test-support controller. Registered only in Development/Testing; returns
// 404 in Production. Injects KondixDbContext directly (not IKondixDbContext)
// because cleanup needs ad-hoc delete access the Application interface
// does not expose. Do NOT follow this pattern in production controllers.
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
        trainer.ApprovedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("cleanup")]
    public async Task<IActionResult> Cleanup(
        [FromQuery] Guid tenantId,
        CancellationToken ct)
    {
        if (!AuthorizeInternal()) return Unauthorized();

        // Collect trainer IDs for this tenant to scope all related deletes.
        var trainerIds = await db.Trainers
            .Where(t => t.TenantId == tenantId)
            .Select(t => t.Id)
            .ToListAsync(ct);

        // 1. Remove TrainerStudent junction rows first (FK → Trainer and Student).
        //    EF configures cascade-on-delete in production (Npgsql), but the InMemory
        //    provider does not enforce FK cascades, so we delete explicitly here.
        var trainerStudentsToRemove = await db.TrainerStudents
            .Where(ts => trainerIds.Contains(ts.TrainerId))
            .ToListAsync(ct);
        db.TrainerStudents.RemoveRange(trainerStudentsToRemove);

        // 2. Remove every student linked to this tenant (via junction or ActiveTrainerId).
        //    Student has no TenantId, so we derive scope from the trainer IDs above,
        //    collecting both students referenced through the junction and those with
        //    ActiveTrainerId pointing to a tenant trainer.
        var studentIdsViaJunction = trainerStudentsToRemove
            .Select(ts => ts.StudentId)
            .ToHashSet();

        var studentsToRemove = await db.Students
            .Where(s =>
                studentIdsViaJunction.Contains(s.Id)
                || (s.ActiveTrainerId.HasValue && trainerIds.Contains(s.ActiveTrainerId.Value)))
            .ToListAsync(ct);
        db.Students.RemoveRange(studentsToRemove);

        // 3. Remove trainers for this tenant.
        var trainersToRemove = await db.Trainers
            .Where(t => t.TenantId == tenantId)
            .ToListAsync(ct);
        db.Trainers.RemoveRange(trainersToRemove);

        await db.SaveChangesAsync(ct);

        return NoContent();
    }
}

public sealed record ApproveTrainerRequest(Guid TenantId);
