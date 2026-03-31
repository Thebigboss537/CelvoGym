using System.Security.Cryptography;
using CelvoGym.Application.Common;
using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using MediatR;

namespace CelvoGym.Application.Commands.Students;

public sealed record InviteStudentCommand(
    Guid TrainerId,
    string Email,
    string? FirstName) : IRequest<StudentInvitationDto>;

public sealed class InviteStudentHandler(ICelvoGymDbContext db)
    : IRequestHandler<InviteStudentCommand, StudentInvitationDto>
{
    public async Task<StudentInvitationDto> Handle(InviteStudentCommand request, CancellationToken cancellationToken)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var tokenHash = TokenHasher.Hash(token);

        var invitation = new StudentInvitation
        {
            TrainerId = request.TrainerId,
            Email = request.Email.Trim().ToLowerInvariant(),
            TokenHash = tokenHash,
            FirstName = request.FirstName,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7)
        };

        db.StudentInvitations.Add(invitation);
        await db.SaveChangesAsync(cancellationToken);

        // TODO: Send invitation email via Resend

        return new StudentInvitationDto(invitation.Id, invitation.Email,
            invitation.FirstName, token, invitation.ExpiresAt,
            false, invitation.CreatedAt);
    }
}
