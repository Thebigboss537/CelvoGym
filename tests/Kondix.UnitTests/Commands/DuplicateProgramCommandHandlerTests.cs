using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class DuplicateProgramCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Deep_Clones_Weeks_And_Slots_With_New_Block_Ids()
    {
        await using var db = NewDb();
        var trainerId = Guid.NewGuid();
        var routineId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var blockId = Guid.NewGuid();

        var src = new Program
        {
            Id = Guid.NewGuid(), TrainerId = trainerId, Name = "Source", IsPublished = true,
            Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Week
        };
        var w = new ProgramWeek { WeekIndex = 0, Label = "Semana 1" };
        w.Slots.Add(new ProgramSlot
        {
            DayIndex = 0, Kind = ProgramSlotKind.RoutineDay,
            RoutineId = routineId, DayId = dayId, BlockId = blockId
        });
        w.Slots.Add(new ProgramSlot
        {
            DayIndex = 1, Kind = ProgramSlotKind.RoutineDay,
            RoutineId = routineId, DayId = dayId, BlockId = blockId  // same blockId
        });
        w.Slots.Add(new ProgramSlot { DayIndex = 2, Kind = ProgramSlotKind.Rest });
        src.Weeks.Add(w);
        db.Programs.Add(src);
        await db.SaveChangesAsync();

        var newId = await new DuplicateProgramHandler(db)
            .Handle(new DuplicateProgramCommand(src.Id, trainerId), default);

        var copy = await db.Programs.Include(p => p.Weeks).ThenInclude(x => x.Slots)
            .FirstAsync(p => p.Id == newId);

        copy.Should().NotBeSameAs(src);
        copy.Name.Should().Be("Source (copia)");
        copy.IsPublished.Should().BeFalse();
        copy.Weeks.Should().HaveCount(1);
        copy.Weeks.First().Slots.Should().HaveCount(3);

        var copiedRoutineSlots = copy.Weeks.First().Slots
            .Where(s => s.Kind == ProgramSlotKind.RoutineDay).ToList();
        copiedRoutineSlots.Should().HaveCount(2);
        copiedRoutineSlots.Should().OnlyContain(s => s.RoutineId == routineId);
        copiedRoutineSlots.Select(s => s.BlockId).Distinct().Should().HaveCount(1, "two slots in source share blockId");
        copiedRoutineSlots.First().BlockId.Should().NotBe(blockId, "BlockIds must be regenerated");
    }

    [Fact]
    public async Task Wrong_Trainer_Throws()
    {
        await using var db = NewDb();
        var programId = Guid.NewGuid();
        db.Programs.Add(new Program { Id = programId, TrainerId = Guid.NewGuid(), Name = "P" });
        await db.SaveChangesAsync();

        await FluentActions.Invoking(() => new DuplicateProgramHandler(db)
            .Handle(new DuplicateProgramCommand(programId, Guid.NewGuid()), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }
}
