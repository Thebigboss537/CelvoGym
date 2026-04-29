using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class FillRestCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Converts_All_Empty_Slots_To_Rest_Leaves_RoutineDay_And_Existing_Rest_Alone()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = new Program { Id = Guid.NewGuid(), TrainerId = t, Name = "P", Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Week };
        var w = new ProgramWeek { WeekIndex = 0, Label = "S1" };
        w.Slots.Add(new ProgramSlot { DayIndex = 0, Kind = ProgramSlotKind.RoutineDay, RoutineId = Guid.NewGuid(), DayId = Guid.NewGuid(), BlockId = Guid.NewGuid() });
        w.Slots.Add(new ProgramSlot { DayIndex = 1, Kind = ProgramSlotKind.Empty });
        w.Slots.Add(new ProgramSlot { DayIndex = 2, Kind = ProgramSlotKind.Rest });
        w.Slots.Add(new ProgramSlot { DayIndex = 3, Kind = ProgramSlotKind.Empty });
        p.Weeks.Add(w);
        db.Programs.Add(p);
        await db.SaveChangesAsync();

        await new FillRestHandler(db).Handle(new FillRestCommand(p.Id, t), default);

        var refreshed = await db.ProgramSlots.OrderBy(s => s.DayIndex).ToListAsync();
        refreshed.Select(s => s.Kind).Should().Equal(
            ProgramSlotKind.RoutineDay,
            ProgramSlotKind.Rest,
            ProgramSlotKind.Rest,
            ProgramSlotKind.Rest);
    }

    [Fact]
    public async Task Rejects_In_Numbered_Mode()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = new Program { Id = Guid.NewGuid(), TrainerId = t, Name = "P", Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Numbered, DaysPerWeek = 3 };
        db.Programs.Add(p);
        await db.SaveChangesAsync();

        await FluentActions.Invoking(() => new FillRestHandler(db).Handle(new FillRestCommand(p.Id, t), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Numbered*");
    }
}
