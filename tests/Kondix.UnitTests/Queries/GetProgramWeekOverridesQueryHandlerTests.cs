namespace Kondix.UnitTests.Queries;

/// <summary>
/// Tests skipped in Programs v3 Phase 1 refactor.
/// GetProgramWeekOverridesQuery and ProgramWeekOverride entity were removed as part of
/// the Programs v3 redesign (week structure is now ProgramWeek/ProgramSlot).
/// Phase 5 will add appropriate tests for the new week structure.
/// </summary>
public sealed class GetProgramWeekOverridesQueryHandlerTests
{
    [Fact(Skip = "Removed in Programs v3: ProgramWeekOverride entity no longer exists. Phase 5 adds new tests.")]
    public Task Returns_Overrides_Ordered_By_Week() => Task.CompletedTask;

    [Fact(Skip = "Removed in Programs v3: ProgramWeekOverride entity no longer exists. Phase 5 adds new tests.")]
    public Task Throws_When_Trainer_Does_Not_Own_Program() => Task.CompletedTask;
}
