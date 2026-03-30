using System.Security.Cryptography;
using System.Text;
using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Queries.Invitations;

public sealed record ValidateInvitationQuery(string Token) : IRequest<InvitationInfoDto>;

public sealed class ValidateInvitationHandler(ICelvoGymDbContext db)
    : IRequestHandler<ValidateInvitationQuery, InvitationInfoDto>
{
    public async Task<InvitationInfoDto> Handle(ValidateInvitationQuery request, CancellationToken cancellationToken)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.Token)));

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
            invitation.Email);
    }
}
