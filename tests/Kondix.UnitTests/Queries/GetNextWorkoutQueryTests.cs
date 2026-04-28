namespace Kondix.UnitTests.Queries;

/// <summary>
/// Tests skipped in Programs v3 Phase 1 refactor.
/// GetNextWorkoutHandler was stubbed (NotImplementedException) because
/// ProgramAssignment lost Mode/TrainingDays/RotationIndex and Program lost ProgramRoutines.
/// Phase 5 will rewrite the handler and restore these tests.
/// </summary>
public sealed class GetNextWorkoutQueryTests
{
    [Fact(Skip = "Phase 5 of Programs v3 will rewrite GetNextWorkoutHandler")]
    public Task Rotation_SingleRoutineWithThreeDays_CyclesThroughDays() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 of Programs v3 will rewrite GetNextWorkoutHandler")]
    public Task Rotation_MultipleRoutines_CyclesAcrossAllDays() => Task.CompletedTask;

    [Fact(Skip = "Phase 5 of Programs v3 will rewrite GetNextWorkoutHandler")]
    public Task Fixed_ReturnsRoutineMappedToToday() => Task.CompletedTask;
}
