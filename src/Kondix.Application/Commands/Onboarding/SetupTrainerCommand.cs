using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Onboarding;

public sealed record SetupTrainerCommand(
    Guid TenantId,
    Guid CelvoGuardUserId,
    string DisplayName,
    string? Bio) : IRequest<TrainerDto>;

public sealed class SetupTrainerHandler(IKondixDbContext db)
    : IRequestHandler<SetupTrainerCommand, TrainerDto>
{
    public async Task<TrainerDto> Handle(SetupTrainerCommand request, CancellationToken cancellationToken)
    {
        var exists = await db.Trainers
            .AnyAsync(t => t.TenantId == request.TenantId, cancellationToken);

        if (exists)
            throw new InvalidOperationException("Trainer profile already exists for this tenant");

        var trainer = new Trainer
        {
            TenantId = request.TenantId,
            CelvoGuardUserId = request.CelvoGuardUserId,
            DisplayName = request.DisplayName,
            Bio = request.Bio,
            IsApproved = false,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Trainers.Add(trainer);
        await db.SaveChangesAsync(cancellationToken);

        return new TrainerDto(trainer.Id, trainer.DisplayName, trainer.Bio,
            trainer.AvatarUrl, trainer.IsApproved, trainer.CreatedAt);
    }
}
