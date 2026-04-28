using FluentValidation;
using Kondix.Application.Commands.Programs;

namespace Kondix.Application.Validators;

public sealed class CreateProgramValidator : AbstractValidator<CreateProgramCommand>
{
    public CreateProgramValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.DurationWeeks).GreaterThan(0).LessThanOrEqualTo(52);
        RuleFor(x => x.DaysPerWeek)
            .NotNull().When(x => x.ScheduleType == Domain.Enums.ProgramScheduleType.Numbered)
            .WithMessage("DaysPerWeek required for Numbered scheduleType");
        RuleFor(x => x.DaysPerWeek)
            .InclusiveBetween(1, 7).When(x => x.DaysPerWeek.HasValue);
        RuleFor(x => x.DurationWeeks)
            .Equal(1).When(x => x.Mode == Domain.Enums.ProgramMode.Loop)
            .WithMessage("Loop programs must have DurationWeeks=1");
    }
}
