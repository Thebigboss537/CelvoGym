using Kondix.Application.Commands.Routines;
using Kondix.Application.Validators;
using Kondix.Domain.Enums;
using FluentAssertions;
using FluentValidation.TestHelper;

namespace Kondix.UnitTests.Validators;

public class CreateRoutineValidatorTests
{
    private readonly CreateRoutineValidator _validator = new();

    private static CreateRoutineCommand CreateValidCommand() => new(
        TrainerId: Guid.NewGuid(),
        Name: "Push Day",
        Description: "Chest, shoulders, triceps",
        Days:
        [
            new CreateDayInput(
                Name: "Day 1",
                Groups:
                [
                    new CreateExerciseGroupInput(
                        GroupType: GroupType.Single,
                        RestSeconds: 60,
                        Exercises:
                        [
                            new CreateExerciseInput(
                                Name: "Bench Press",
                                Notes: null,
                                VideoSource: VideoSource.None,
                                VideoUrl: null,
                                Tempo: "3010",
                                Sets:
                                [
                                    new CreateExerciseSetInput(
                                        SetType: SetType.Effective,
                                        TargetReps: "8-10",
                                        TargetWeight: "80kg",
                                        TargetRpe: 8,
                                        RestSeconds: 90)
                                ])
                        ])
                ])
        ]);

    [Fact]
    public void ValidCommand_ShouldPass()
    {
        var command = CreateValidCommand();
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void EmptyName_ShouldFail()
    {
        var command = CreateValidCommand() with { Name = "" };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void NameExceeding200Chars_ShouldFail()
    {
        var command = CreateValidCommand() with { Name = new string('A', 201) };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void EmptyDaysList_ShouldFail()
    {
        var command = CreateValidCommand() with { Days = [] };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Days);
    }

    [Fact]
    public void RpeOf0_ShouldFail()
    {
        var command = CreateValidCommand() with
        {
            Days =
            [
                new CreateDayInput("Day 1",
                [
                    new CreateExerciseGroupInput(GroupType.Single, 60,
                    [
                        new CreateExerciseInput("Bench Press", null, VideoSource.None, null, null,
                        [
                            new CreateExerciseSetInput(SetType.Effective, "8", "80kg", TargetRpe: 0, RestSeconds: 90)
                        ])
                    ])
                ])
            ]
        };

        var result = _validator.TestValidate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("TargetRpe"));
    }

    [Fact]
    public void RpeOf11_ShouldFail()
    {
        var command = CreateValidCommand() with
        {
            Days =
            [
                new CreateDayInput("Day 1",
                [
                    new CreateExerciseGroupInput(GroupType.Single, 60,
                    [
                        new CreateExerciseInput("Bench Press", null, VideoSource.None, null, null,
                        [
                            new CreateExerciseSetInput(SetType.Effective, "8", "80kg", TargetRpe: 11, RestSeconds: 90)
                        ])
                    ])
                ])
            ]
        };

        var result = _validator.TestValidate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("TargetRpe"));
    }

    [Fact]
    public void NegativeRestSeconds_ShouldFail()
    {
        var command = CreateValidCommand() with
        {
            Days =
            [
                new CreateDayInput("Day 1",
                [
                    new CreateExerciseGroupInput(GroupType.Single, RestSeconds: -1,
                    [
                        new CreateExerciseInput("Bench Press", null, VideoSource.None, null, null,
                        [
                            new CreateExerciseSetInput(SetType.Effective, "8", "80kg", TargetRpe: 8, RestSeconds: 90)
                        ])
                    ])
                ])
            ]
        };

        var result = _validator.TestValidate(command);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName.Contains("RestSeconds"));
    }
}
