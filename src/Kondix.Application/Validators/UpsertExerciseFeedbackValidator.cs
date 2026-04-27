using FluentValidation;
using Kondix.Application.Commands.Sessions;

namespace Kondix.Application.Validators;

public sealed class UpsertExerciseFeedbackValidator : AbstractValidator<UpsertExerciseFeedbackCommand>
{
    public UpsertExerciseFeedbackValidator()
    {
        RuleFor(x => x.ActualRpe).InclusiveBetween(1, 10);
        RuleFor(x => x.Notes).MaximumLength(2000);
    }
}
