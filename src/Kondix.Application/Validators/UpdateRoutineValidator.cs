using Kondix.Application.Commands.Routines;
using FluentValidation;

namespace Kondix.Application.Validators;

public sealed class UpdateRoutineValidator : AbstractValidator<UpdateRoutineCommand>
{
    public UpdateRoutineValidator()
    {
        RuleFor(x => x.RoutineId).NotEmpty();
        RuleFor(x => x.TrainerId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Days).NotEmpty().WithMessage("At least one day is required");

        RuleForEach(x => x.Days).ChildRules(day =>
        {
            day.RuleFor(d => d.Name).NotEmpty().MaximumLength(200);
            day.RuleFor(d => d.Groups).NotEmpty();

            day.RuleForEach(d => d.Groups).ChildRules(group =>
            {
                group.RuleFor(g => g.RestSeconds).GreaterThanOrEqualTo(0);
                group.RuleFor(g => g.Exercises).NotEmpty();

                group.RuleForEach(g => g.Exercises).ChildRules(exercise =>
                {
                    exercise.RuleFor(e => e.Name).NotEmpty().MaximumLength(200);
                    exercise.RuleFor(e => e.Sets).NotEmpty();
                });
            });
        });
    }
}
