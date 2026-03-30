using CelvoGym.Application.Commands.Students;
using FluentValidation;

namespace CelvoGym.Application.Validators;

public sealed class InviteStudentValidator : AbstractValidator<InviteStudentCommand>
{
    public InviteStudentValidator()
    {
        RuleFor(x => x.TrainerId).NotEmpty();
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(x => x.FirstName).MaximumLength(100);
    }
}
