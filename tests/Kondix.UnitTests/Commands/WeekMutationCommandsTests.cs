using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class WeekMutationCommandsTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static Program SeedFixedProgram(KondixDbContext db, Guid trainerId, int weeksCount)
    {
        var p = new Program
        {
            Id = Guid.NewGuid(), TrainerId = trainerId, Name = "P",
            Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Week
        };
        for (var i = 0; i < weeksCount; i++)
        {
            var w = new ProgramWeek { WeekIndex = i, Label = $"Semana {i + 1}" };
            for (var d = 0; d < 7; d++) w.Slots.Add(new ProgramSlot { DayIndex = d, Kind = ProgramSlotKind.Empty });
            p.Weeks.Add(w);
        }
        db.Programs.Add(p);
        db.SaveChanges();
        return p;
    }

    [Fact]
    public async Task AddWeek_Appends_Empty_Week()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = SeedFixedProgram(db, t, 2);

        await new AddWeekHandler(db).Handle(new AddWeekCommand(p.Id, t), default);

        var refreshed = await db.Programs.Include(x => x.Weeks).ThenInclude(w => w.Slots).FirstAsync();
        refreshed.Weeks.Should().HaveCount(3);
        var lastWeek = refreshed.Weeks.OrderBy(w => w.WeekIndex).Last();
        lastWeek.WeekIndex.Should().Be(2);
        lastWeek.Label.Should().Be("Semana 3");
        lastWeek.Slots.Should().HaveCount(7);
        lastWeek.Slots.Should().OnlyContain(s => s.Kind == ProgramSlotKind.Empty);
    }

    [Fact]
    public async Task AddWeek_Rejects_Loop_Mode()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = SeedFixedProgram(db, t, 1);
        var loaded = await db.Programs.FirstAsync();
        loaded.Mode = ProgramMode.Loop;
        await db.SaveChangesAsync();

        await FluentActions.Invoking(() => new AddWeekHandler(db).Handle(new AddWeekCommand(p.Id, t), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Loop*");
    }

    [Fact]
    public async Task DuplicateWeek_Inserts_Copy_At_Next_Position_And_Reindexes()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = SeedFixedProgram(db, t, 3);
        var loaded = await db.Programs.Include(x => x.Weeks).ThenInclude(w => w.Slots).FirstAsync();
        var w1 = loaded.Weeks.First(w => w.WeekIndex == 1);
        var slot = w1.Slots.First();
        slot.Kind = ProgramSlotKind.RoutineDay;
        slot.RoutineId = Guid.NewGuid();
        slot.DayId = Guid.NewGuid();
        slot.BlockId = Guid.NewGuid();
        await db.SaveChangesAsync();

        await new DuplicateWeekHandler(db).Handle(new DuplicateWeekCommand(p.Id, t, 1), default);

        var refreshed = await db.Programs.Include(x => x.Weeks).ThenInclude(w => w.Slots).FirstAsync();
        refreshed.Weeks.Should().HaveCount(4);
        var ordered = refreshed.Weeks.OrderBy(w => w.WeekIndex).ToList();
        ordered.Select(w => w.WeekIndex).Should().Equal(0, 1, 2, 3);
        ordered.Select(w => w.Label).Should().Equal("Semana 1", "Semana 2", "Semana 3", "Semana 4");
        ordered[2].Slots.Should().Contain(s => s.Kind == ProgramSlotKind.RoutineDay,
            "the copy of week 1 should preserve its routineDay slots at the new index 2");
    }

    [Fact]
    public async Task DeleteWeek_Reindexes_Following_Weeks()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = SeedFixedProgram(db, t, 4);

        await new DeleteWeekHandler(db).Handle(new DeleteWeekCommand(p.Id, t, 1), default);

        var refreshed = await db.Programs.Include(x => x.Weeks).FirstAsync();
        refreshed.Weeks.Should().HaveCount(3);
        refreshed.Weeks.OrderBy(w => w.WeekIndex).Select(w => w.WeekIndex).Should().Equal(0, 1, 2);
        refreshed.Weeks.OrderBy(w => w.WeekIndex).Select(w => w.Label)
            .Should().Equal("Semana 1", "Semana 2", "Semana 3");
    }

    [Fact]
    public async Task DeleteWeek_Refuses_Last_Week()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var p = SeedFixedProgram(db, t, 1);

        await FluentActions.Invoking(() => new DeleteWeekHandler(db).Handle(new DeleteWeekCommand(p.Id, t, 0), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*at least one week*");
    }
}
