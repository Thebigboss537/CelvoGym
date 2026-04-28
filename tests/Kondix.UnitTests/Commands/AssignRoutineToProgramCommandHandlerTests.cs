using FluentAssertions;
using Kondix.Application.Commands.Programs;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class AssignRoutineToProgramCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static (Program p, Routine r, Day d1, Day d2) Seed(KondixDbContext db, Guid trainerId, ProgramScheduleType st)
    {
        var routine = new Routine { Id = Guid.NewGuid(), TrainerId = trainerId, Name = "Push/Pull", IsActive = true };
        var day1 = new Day { Id = Guid.NewGuid(), Routine = routine, Name = "Push", SortOrder = 0 };
        var day2 = new Day { Id = Guid.NewGuid(), Routine = routine, Name = "Pull", SortOrder = 1 };
        routine.Days.Add(day1); routine.Days.Add(day2);

        var p = new Program
        {
            Id = Guid.NewGuid(), TrainerId = trainerId, Name = "P",
            Mode = ProgramMode.Fixed, ScheduleType = st,
            DaysPerWeek = st == ProgramScheduleType.Numbered ? 2 : null
        };
        for (var wi = 0; wi < 2; wi++)
        {
            var w = new ProgramWeek { WeekIndex = wi, Label = $"Semana {wi + 1}" };
            var slotCount = st == ProgramScheduleType.Numbered ? 2 : 7;
            for (var di = 0; di < slotCount; di++)
                w.Slots.Add(new ProgramSlot { DayIndex = di, Kind = ProgramSlotKind.Empty });
            p.Weeks.Add(w);
        }

        db.Routines.Add(routine);
        db.Programs.Add(p);
        db.SaveChanges();
        return (p, routine, day1, day2);
    }

    [Fact]
    public async Task Week_Mode_Maps_Days_To_Weekdays_Across_Selected_Weeks()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, r, d1, d2) = Seed(db, t, ProgramScheduleType.Week);

        var mapping = new Dictionary<Guid, int> { { d1.Id, 0 }, { d2.Id, 2 } }; // Mon, Wed
        await new AssignRoutineToProgramHandler(db).Handle(new AssignRoutineToProgramCommand(
            p.Id, t, r.Id, new[] { 0, 1 }, mapping, null), default);

        var refreshed = await db.Programs.Include(x => x.Weeks).ThenInclude(w => w.Slots).FirstAsync();
        var routineSlots = refreshed.Weeks.SelectMany(w => w.Slots)
            .Where(s => s.Kind == ProgramSlotKind.RoutineDay).ToList();
        routineSlots.Should().HaveCount(4); // 2 weeks × 2 days
        routineSlots.Should().OnlyContain(s => s.RoutineId == r.Id);
        routineSlots.Select(s => s.BlockId).Distinct().Should().HaveCount(1);

        foreach (var w in refreshed.Weeks)
        {
            w.Slots.First(s => s.DayIndex == 0).DayId.Should().Be(d1.Id);
            w.Slots.First(s => s.DayIndex == 2).DayId.Should().Be(d2.Id);
            w.Slots.First(s => s.DayIndex == 1).Kind.Should().Be(ProgramSlotKind.Empty);
        }
    }

    [Fact]
    public async Task Numbered_Mode_Uses_DayIds_List_Sequentially()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, r, d1, d2) = Seed(db, t, ProgramScheduleType.Numbered);

        await new AssignRoutineToProgramHandler(db).Handle(new AssignRoutineToProgramCommand(
            p.Id, t, r.Id, new[] { 0 }, null, new[] { d1.Id, d2.Id }), default);

        var refreshed = await db.Programs.Include(x => x.Weeks).ThenInclude(w => w.Slots).FirstAsync();
        var firstWeek = refreshed.Weeks.First(w => w.WeekIndex == 0);
        firstWeek.Slots.Should().HaveCount(2);
        firstWeek.Slots.OrderBy(s => s.DayIndex).Select(s => s.DayId).Should().Equal(d1.Id, d2.Id);
        firstWeek.Slots.Should().OnlyContain(s => s.Kind == ProgramSlotKind.RoutineDay);

        var secondWeek = refreshed.Weeks.First(w => w.WeekIndex == 1);
        secondWeek.Slots.Should().OnlyContain(s => s.Kind == ProgramSlotKind.Empty);
    }

    [Fact]
    public async Task Week_Mode_Without_Mapping_Throws()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, r, _, _) = Seed(db, t, ProgramScheduleType.Week);

        await FluentActions.Invoking(() => new AssignRoutineToProgramHandler(db)
            .Handle(new AssignRoutineToProgramCommand(p.Id, t, r.Id, new[] { 0 }, null, null), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*mapping*");
    }

    [Fact]
    public async Task Week_Mode_With_Weekday_Collision_Throws()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var (p, r, d1, d2) = Seed(db, t, ProgramScheduleType.Week);

        var mapping = new Dictionary<Guid, int> { { d1.Id, 0 }, { d2.Id, 0 } };
        await FluentActions.Invoking(() => new AssignRoutineToProgramHandler(db)
            .Handle(new AssignRoutineToProgramCommand(p.Id, t, r.Id, new[] { 0 }, mapping, null), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*same weekday*");
    }

    [Fact]
    public async Task Routine_From_Different_Trainer_Throws()
    {
        await using var db = NewDb();
        var ownerTrainer = Guid.NewGuid();
        var otherTrainer = Guid.NewGuid();
        var (p, _, _, _) = Seed(db, ownerTrainer, ProgramScheduleType.Week);

        var foreignRoutine = new Routine { Id = Guid.NewGuid(), TrainerId = otherTrainer, Name = "X", IsActive = true };
        var foreignDay = new Day { Id = Guid.NewGuid(), Routine = foreignRoutine, Name = "D", SortOrder = 0 };
        foreignRoutine.Days.Add(foreignDay);
        db.Routines.Add(foreignRoutine);
        await db.SaveChangesAsync();

        var mapping = new Dictionary<Guid, int> { { foreignDay.Id, 0 } };
        await FluentActions.Invoking(() => new AssignRoutineToProgramHandler(db)
            .Handle(new AssignRoutineToProgramCommand(p.Id, ownerTrainer, foreignRoutine.Id, new[] { 0 }, mapping, null), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Routine*");
    }
}
