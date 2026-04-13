using Kondix.Application.Common;
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Queries.Invitations;

public sealed record ValidateInvitationQuery(string Token) : IRequest<InvitationInfoDto>;

public sealed class ValidateInvitationHandler(IKondixDbContext db)
    : IRequestHandler<ValidateInvitationQuery, InvitationInfoDto>
{
    public async Task<InvitationInfoDto> Handle(ValidateInvitationQuery request, CancellationToken cancellationToken)
    {
        var tokenHash = TokenHasher.Hash(request.Token);

        var invitation = await db.StudentInvitations
            .AsNoTracking()
            .Include(i => i.Trainer)
            .FirstOrDefaultAsync(i => i.TokenHash == tokenHash
                && i.AcceptedAt == null
                && i.ExpiresAt > DateTimeOffset.UtcNow, cancellationToken)
            ?? throw new InvalidOperationException("Invalid or expired invitation");

        return new InvitationInfoDto(
            invitation.Trainer.DisplayName,
            invitation.Trainer.AvatarUrl,
            invitation.Email,
            invitation.Trainer.TenantId);
    }
}
