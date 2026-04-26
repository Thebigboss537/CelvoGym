using Kondix.Application.Commands.Catalog;
using Kondix.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Onboarding;

public sealed record ApproveTrainerCommand(Guid TrainerId) : IRequest<ApprovalResult>
{
    public const string TrainerNotFoundMessage = "Trainer not found";
}

public sealed record ApprovalResult(
    DateTimeOffset? ApprovedAt,
    int ExercisesSeeded,
    bool AlreadyApproved);

public sealed class ApproveTrainerCommandHandler(IKondixDbContext db, IMediator mediator)
    : IRequestHandler<ApproveTrainerCommand, ApprovalResult>
{
    public async Task<ApprovalResult> Handle(ApproveTrainerCommand request, CancellationToken cancellationToken)
    {
        var trainer = await db.Trainers.FirstOrDefaultAsync(t => t.Id == request.TrainerId, cancellationToken)
            ?? throw new InvalidOperationException(ApproveTrainerCommand.TrainerNotFoundMessage);

        if (trainer.IsApproved)
            return new ApprovalResult(trainer.ApprovedAt, 0, true);

        trainer.IsApproved = true;
        trainer.ApprovedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var seeded = await mediator.Send(new SeedCatalogCommand(trainer.Id), cancellationToken);

        return new ApprovalResult(trainer.ApprovedAt, seeded, false);
    }
}
