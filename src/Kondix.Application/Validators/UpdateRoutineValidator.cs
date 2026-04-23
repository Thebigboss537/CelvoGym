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
            day.RuleFor(d => d.Blocks).NotEmpty();

            day.RuleForEach(d => d.Blocks).ChildRules(block =>
            {
                block.RuleFor(b => b.RestSeconds).GreaterThanOrEqualTo(0);
                block.RuleFor(b => b.Exercises).NotEmpty();

                block.RuleForEach(b => b.Exercises).ChildRules(exercise =>
                {
                    exercise.RuleFor(e => e.Name).NotEmpty().MaximumLength(200);
                    exercise.RuleFor(e => e.Sets).NotEmpty();
                });
            });
        });
    }
}
