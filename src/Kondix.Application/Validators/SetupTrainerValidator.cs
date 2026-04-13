using Kondix.Application.Commands.Onboarding;
using FluentValidation;

namespace Kondix.Application.Validators;

public sealed class SetupTrainerValidator : AbstractValidator<SetupTrainerCommand>
{
    public SetupTrainerValidator()
    {
        RuleFor(x => x.TenantId).NotEmpty();
        RuleFor(x => x.CelvoGuardUserId).NotEmpty();
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Bio).MaximumLength(2000);
    }
}
