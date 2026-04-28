using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class RemoveBlockCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Removes_All_Slots_With_BlockId_And_Sets_Them_Empty()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var blockId = Guid.NewGuid();
        var p = new Program { Id = Guid.NewGuid(), TrainerId = t, Name = "P", Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Week };
        for (var wi = 0; wi < 2; wi++)
        {
            var w = new ProgramWeek { WeekIndex = wi, Label = "S" };
            for (var di = 0; di < 7; di++)
            {
                var slot = new ProgramSlot { DayIndex = di, Kind = ProgramSlotKind.Empty };
                if (di == 0 || di == 2)
                {
                    slot.Kind = ProgramSlotKind.RoutineDay;
                    slot.RoutineId = Guid.NewGuid();
                    slot.DayId = Guid.NewGuid();
                    slot.BlockId = blockId;
                }
                w.Slots.Add(slot);
            }
            p.Weeks.Add(w);
        }
        db.Programs.Add(p);
        await db.SaveChangesAsync();

        await new RemoveBlockHandler(db).Handle(new RemoveBlockCommand(p.Id, t, blockId), default);

        var refreshed = await db.Programs.Include(x => x.Weeks).ThenInclude(w => w.Slots).FirstAsync();
        var slotsWithBlock = refreshed.Weeks.SelectMany(w => w.Slots).Where(s => s.BlockId == blockId).ToList();
        slotsWithBlock.Should().BeEmpty();
        refreshed.Weeks.SelectMany(w => w.Slots).Should().OnlyContain(s => s.Kind == ProgramSlotKind.Empty);
    }
}
