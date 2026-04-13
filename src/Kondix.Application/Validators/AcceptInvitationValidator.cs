using Kondix.Application.Commands.Students;
using FluentValidation;

namespace Kondix.Application.Validators;

public sealed class AcceptInvitationValidator : AbstractValidator<AcceptInvitationCommand>
{
    public AcceptInvitationValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.CelvoGuardUserId).NotEmpty();
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(200);
    }
}
