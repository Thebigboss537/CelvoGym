namespace Kondix.UnitTests.Commands;

/// <summary>
/// Tests skipped in Programs v3 Phase 1 refactor.
/// StartSessionCommand handler was stubbed (NotImplementedException) because
/// ProgramAssignment lost Mode/TrainingDays/EndDate and Program lost ProgramRoutines.
/// Phase 5 will rewrite the handler and restore these tests.
/// </summary>
public sealed class StartSessionCommandHandlerTests
{
    [Fact(Skip = "Phase 5 of Programs v3 will rewrite StartSessionHandler")]
    public Task Creates_New_Session_When_No_Active_Session_Exists() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 of Programs v3 will rewrite StartSessionHandler")]
    public Task Returns_Existing_Active_Session_When_Present() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 of Programs v3 will rewrite StartSessionHandler")]
    public Task Throws_When_Routine_Not_Assigned() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 of Programs v3 will rewrite StartSessionHandler")]
    public Task Throws_When_Day_Not_In_Routine() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 of Programs v3 will rewrite StartSessionHandler")]
    public Task Recovery_Sets_IsRecovery_True_For_Valid_Planned_Date() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 of Programs v3 will rewrite StartSessionHandler")]
    public Task Recovery_Throws_When_Planned_Date_Too_Old() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 of Programs v3 will rewrite StartSessionHandler")]
    public Task Recovery_Throws_When_Normal_Session_Already_Completed_That_Day() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 of Programs v3 will rewrite StartSessionHandler")]
    public Task Recovery_Throws_When_Already_Recovered() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 of Programs v3 will rewrite StartSessionHandler")]
    public Task Recovery_Throws_When_Planned_Date_Not_A_Training_Day() => Task.CompletedTask;
}
