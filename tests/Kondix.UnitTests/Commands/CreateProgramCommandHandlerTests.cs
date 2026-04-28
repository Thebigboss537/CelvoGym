using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class CreateProgramCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static Trainer SeedTrainer(KondixDbContext db)
    {
        var t = new Trainer
        {
            Id = Guid.NewGuid(),
            CelvoGuardUserId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            DisplayName = "T"
        };
        db.Trainers.Add(t);
        db.SaveChanges();
        return t;
    }

    [Fact]
    public async Task Creates_Program_With_Empty_Weeks_For_Fixed_Mode()
    {
        await using var db = NewDb();
        var trainer = SeedTrainer(db);

        var handler = new CreateProgramHandler(db);
        var id = await handler.Handle(new CreateProgramCommand(
            trainer.Id, "Hypertrophy", null,
            ProgramObjective.Hipertrofia, ProgramLevel.Intermedio,
            ProgramMode.Fixed, ProgramScheduleType.Week,
            null, 4), default);

        var program = await db.Programs.Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstAsync(p => p.Id == id);
        program.Weeks.Should().HaveCount(4);
        program.Weeks.OrderBy(w => w.WeekIndex).Select(w => w.Label)
            .Should().Equal("Semana 1", "Semana 2", "Semana 3", "Semana 4");
        program.Weeks.First().Slots.Should().HaveCount(7);
        program.Weeks.First().Slots.Should().OnlyContain(s => s.Kind == ProgramSlotKind.Empty);
        program.IsPublished.Should().BeFalse();
        program.DaysPerWeek.Should().BeNull();
    }

    [Fact]
    public async Task Loop_Mode_Forces_Single_Week_With_Base_Label()
    {
        await using var db = NewDb();
        var trainer = SeedTrainer(db);

        var handler = new CreateProgramHandler(db);
        var id = await handler.Handle(new CreateProgramCommand(
            trainer.Id, "Loop", null,
            ProgramObjective.Hipertrofia, ProgramLevel.Avanzado,
            ProgramMode.Loop, ProgramScheduleType.Week,
            null, 99), default);

        var program = await db.Programs.Include(p => p.Weeks).FirstAsync(p => p.Id == id);
        program.Weeks.Should().HaveCount(1);
        program.Weeks.First().Label.Should().Be("Semana base");
    }

    [Fact]
    public async Task Numbered_Mode_Has_DaysPerWeek_Slots_Per_Week()
    {
        await using var db = NewDb();
        var trainer = SeedTrainer(db);

        var handler = new CreateProgramHandler(db);
        var id = await handler.Handle(new CreateProgramCommand(
            trainer.Id, "Numbered", null,
            ProgramObjective.Fuerza, ProgramLevel.Principiante,
            ProgramMode.Fixed, ProgramScheduleType.Numbered,
            3, 6), default);

        var program = await db.Programs.Include(p => p.Weeks).ThenInclude(w => w.Slots)
            .FirstAsync(p => p.Id == id);
        program.Weeks.Should().HaveCount(6);
        program.Weeks.First().Slots.Should().HaveCount(3);
        program.DaysPerWeek.Should().Be(3);
        program.Weeks.SelectMany(w => w.Slots).Should().OnlyContain(s => s.Kind == ProgramSlotKind.Empty);
    }

    [Fact]
    public async Task Rejects_Unknown_Trainer()
    {
        await using var db = NewDb();
        var handler = new CreateProgramHandler(db);

        await FluentActions.Invoking(() => handler.Handle(new CreateProgramCommand(
            Guid.NewGuid(), "P", null,
            ProgramObjective.Otro, ProgramLevel.Todos,
            ProgramMode.Fixed, ProgramScheduleType.Week, null, 4), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Trainer*");
    }

    [Fact]
    public async Task Numbered_Without_DaysPerWeek_Throws()
    {
        await using var db = NewDb();
        var trainer = SeedTrainer(db);

        var handler = new CreateProgramHandler(db);
        await FluentActions.Invoking(() => handler.Handle(new CreateProgramCommand(
            trainer.Id, "P", null,
            ProgramObjective.Otro, ProgramLevel.Todos,
            ProgramMode.Fixed, ProgramScheduleType.Numbered, null, 4), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*DaysPerWeek*");
    }
}
