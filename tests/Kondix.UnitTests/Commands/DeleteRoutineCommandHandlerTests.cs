using FluentAssertions;
using Kondix.Application.Commands.Routines;
using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Kondix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Kondix.UnitTests.Commands;

public sealed class DeleteRoutineCommandHandlerTests
{
    private static KondixDbContext NewDb() =>
        new(new DbContextOptionsBuilder<KondixDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    [Fact]
    public async Task Deleting_Routine_Soft_Deletes_It()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var routine = new Routine { Id = Guid.NewGuid(), TrainerId = t, Name = "R", IsActive = true };
        db.Routines.Add(routine);
        await db.SaveChangesAsync();

        await new DeleteRoutineHandler(db).Handle(new DeleteRoutineCommand(routine.Id, t), default);

        var r = await db.Routines.FirstAsync(x => x.Id == routine.Id);
        r.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task Wrong_Trainer_Throws()
    {
        await using var db = NewDb();
        var routine = new Routine { Id = Guid.NewGuid(), TrainerId = Guid.NewGuid(), Name = "R", IsActive = true };
        db.Routines.Add(routine);
        await db.SaveChangesAsync();

        await FluentActions.Invoking(() =>
                new DeleteRoutineHandler(db).Handle(new DeleteRoutineCommand(routine.Id, Guid.NewGuid()), default))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found*");
    }

    [Fact]
    public async Task Deleting_Routine_Empties_Affected_Program_Slots()
    {
        await using var db = NewDb();
        var t = Guid.NewGuid();
        var routine = new Routine { Id = Guid.NewGuid(), TrainerId = t, Name = "R", IsActive = true };
        var day = new Day { Id = Guid.NewGuid(), RoutineId = routine.Id, Name = "Day", SortOrder = 0 };
        routine.Days.Add(day);

        var program = new Program
        {
            Id = Guid.NewGuid(), TrainerId = t, Name = "P",
            Mode = ProgramMode.Fixed, ScheduleType = ProgramScheduleType.Week
        };
        var w = new ProgramWeek { WeekIndex = 0, Label = "S1" };
        w.Slots.Add(new ProgramSlot
        {
            DayIndex = 0, Kind = ProgramSlotKind.RoutineDay,
            RoutineId = routine.Id, DayId = day.Id, BlockId = Guid.NewGuid()
        });
        program.Weeks.Add(w);

        db.Routines.Add(routine);
        db.Programs.Add(program);
        await db.SaveChangesAsync();

        await new DeleteRoutineHandler(db).Handle(new DeleteRoutineCommand(routine.Id, t), default);

        var slot = await db.ProgramSlots.FirstAsync();
        slot.Kind.Should().Be(ProgramSlotKind.Empty);
        slot.RoutineId.Should().BeNull();
        slot.BlockId.Should().BeNull();
    }
}
