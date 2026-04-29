using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class SetSlotCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static (Program p, ProgramWeek w) Seed(KondixDbContext db, Guid trainerId, ProgramScheduleType st)
    {
        var p = new Program { Id = Guid.NewGuid(), TrainerId = trainerId, Name = "P", ScheduleType = st, Mode = ProgramMode.Fixed };
        if (st == ProgramScheduleType.Numbered) p.DaysPerWeek = 3;
        var w = new ProgramWeek { WeekIndex = 0, Label = "Semana 1" };
        var count = st == ProgramScheduleType.Numbered ? 3 : 7;
        for (var d = 0; d < count; d++) w.Slots.Add(new ProgramSlot { DayIndex = d, Kind = ProgramSlotKind.Empty });
        p.Weeks.Add(w);
        db.Programs.Add(p);
        db.SaveChanges();
        return (p, w);
    }

    [Fact]
    public async Task Set_To_Rest_Updates_Kind()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, _) = Seed(db, t, ProgramScheduleType.Week);

        await new SetSlotHandler(db).Handle(new SetSlotCommand(p.Id, t, 0, 2, ProgramSlotKind.Rest), default);

        var slot = await db.ProgramSlots.FirstAsync(s => s.DayIndex == 2);
        slot.Kind.Should().Be(ProgramSlotKind.Rest);
    }

    [Fact]
    public async Task Set_To_Empty_Clears_Routine_Refs()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, _) = Seed(db, t, ProgramScheduleType.Week);
        var slot = await db.ProgramSlots.FirstAsync(s => s.DayIndex == 0);
        slot.Kind = ProgramSlotKind.RoutineDay;
        slot.RoutineId = Guid.NewGuid();
        slot.DayId = Guid.NewGuid();
        slot.BlockId = Guid.NewGuid();
        await db.SaveChangesAsync();

        await new SetSlotHandler(db).Handle(new SetSlotCommand(p.Id, t, 0, 0, ProgramSlotKind.Empty), default);

        var refreshed = await db.ProgramSlots.FirstAsync(s => s.Id == slot.Id);
        refreshed.Kind.Should().Be(ProgramSlotKind.Empty);
        refreshed.RoutineId.Should().BeNull();
        refreshed.DayId.Should().BeNull();
        refreshed.BlockId.Should().BeNull();
    }

    [Fact]
    public async Task Rejects_RoutineDay_Kind()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, _) = Seed(db, t, ProgramScheduleType.Week);

        await FluentActions.Invoking(() => new SetSlotHandler(db)
            .Handle(new SetSlotCommand(p.Id, t, 0, 0, ProgramSlotKind.RoutineDay), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*assign-routine*");
    }

    [Fact]
    public async Task Rejects_Rest_In_Numbered_Mode()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, _) = Seed(db, t, ProgramScheduleType.Numbered);

        await FluentActions.Invoking(() => new SetSlotHandler(db)
            .Handle(new SetSlotCommand(p.Id, t, 0, 0, ProgramSlotKind.Rest), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Numbered*");
    }
}
