using CelvoGym.Application.Commands.Students;
using CelvoGym.Application.Validators;
using FluentValidation.TestHelper;

namespace CelvoGym.UnitTests.Validators;

public class InviteStudentValidatorTests
{
    private readonly InviteStudentValidator _validator = new();

    [Fact]
    public void ValidInvite_ShouldPass()
    {
        var command = new InviteStudentCommand(Guid.NewGuid(), "student@example.com", "John");
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void EmptyEmail_ShouldFail()
    {
        var command = new InviteStudentCommand(Guid.NewGuid(), "", "John");
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void InvalidEmailFormat_ShouldFail()
    {
        var command = new InviteStudentCommand(Guid.NewGuid(), "not-an-email", "John");
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }
}
