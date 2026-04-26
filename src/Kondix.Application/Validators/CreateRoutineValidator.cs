using Kondix.Application.Commands.Routines;
using FluentValidation;

namespace Kondix.Application.Validators;

public sealed class CreateRoutineValidator : AbstractValidator<CreateRoutineCommand>
{
    public CreateRoutineValidator()
    {
        RuleFor(x => x.TrainerId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Days).NotEmpty().WithMessage("At least one day is required");

        RuleForEach(x => x.Days).ChildRules(day =>
        {
            day.RuleFor(d => d.Name).NotEmpty().MaximumLength(200);
            day.RuleFor(d => d.Blocks).NotEmpty().WithMessage("At least one exercise block is required");

            day.RuleForEach(d => d.Blocks).ChildRules(block =>
            {
                block.RuleFor(b => b.RestSeconds).GreaterThanOrEqualTo(0);
                block.RuleFor(b => b.Exercises).NotEmpty().WithMessage("At least one exercise is required");

                block.RuleForEach(b => b.Exercises).ChildRules(exercise =>
                {
                    exercise.RuleFor(e => e.Name).NotEmpty().MaximumLength(200);
                    exercise.RuleFor(e => e.Notes).MaximumLength(2000);
                    exercise.RuleFor(e => e.Tempo).MaximumLength(20);
                    exercise.RuleFor(e => e.Sets).NotEmpty().WithMessage("At least one set is required");

                    exercise.RuleForEach(e => e.Sets).ChildRules(set =>
                    {
                        set.RuleFor(s => s.TargetReps).MaximumLength(50);
                        set.RuleFor(s => s.TargetWeight).MaximumLength(50);
                        set.RuleFor(s => s.TargetRpe).InclusiveBetween(1, 10)
                            .When(s => s.TargetRpe.HasValue);
                        set.RuleFor(s => s.RestSeconds).GreaterThanOrEqualTo(0)
                            .When(s => s.RestSeconds.HasValue);
                    });
                });
            });
        });
    }
}
