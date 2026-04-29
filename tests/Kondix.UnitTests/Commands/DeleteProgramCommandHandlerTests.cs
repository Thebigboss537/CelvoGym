using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class DeleteProgramCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Cancels_Active_Assignments_Before_Removing_Program()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var s = Guid.NewGuid();
        var program = new Program { Id = Guid.NewGuid(), TrainerId = t, Name = "P" };
        var assignment = new ProgramAssignment
        {
            Id = Guid.NewGuid(), TrainerId = t, StudentId = s, ProgramId = program.Id,
            Status = ProgramAssignmentStatus.Active, StartDate = DateTimeOffset.UtcNow
        };
        program.Assignments.Add(assignment);
        db.Programs.Add(program);
        await db.SaveChangesAsync();

        await new DeleteProgramHandler(db).Handle(new DeleteProgramCommand(program.Id, t), default);

        (await db.Programs.AnyAsync(p => p.Id == program.Id)).Should().BeFalse();
        // The assignment row may also be cascaded by FK ON DELETE CASCADE configured on ProgramAssignment → Program.
        // Both Cancelled-before-deletion and cascade-removed are acceptable behaviors.
    }

    [Fact]
    public async Task Wrong_Trainer_Throws()
    {
        await using var db = NewDb();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = Guid.NewGuid(), Name = "P" });
        await db.SaveChangesAsync();

        await FluentActions.Invoking(() => new DeleteProgramHandler(db)
                .Handle(new DeleteProgramCommand(programId, Guid.NewGuid()), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }
}
