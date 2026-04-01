using System.Security.Cryptography;
using CelvoGym.Application.Common;
using CelvoGym.Application.Common.Interfaces;
using CelvoGym.Application.DTOs;
using CelvoGym.Domain.Entities;
using CelvoGym.Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CelvoGym.Application.Commands.Students;

public sealed record InviteStudentCommand(
    Guid TrainerId,
    string Email,
    string? FirstName) : IRequest<StudentInvitationDto>;

public sealed class InviteStudentHandler(ICelvoGymDbContext db, IEmailService emailService)
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

        var trainer = await db.Trainers.FirstAsync(t => t.Id == request.TrainerId, cancellationToken);
        var encodedToken = Uri.EscapeDataString(token);
        var inviteLink = $"https://gym.celvo.dev/invite?token={encodedToken}";

        var html = $"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a1a;">Te invitaron a entrenar</h2>
                <p style="color: #333; font-size: 16px;">
                    <strong>{trainer.DisplayName}</strong> te invit&oacute; a seguir tu rutina de entrenamiento en CelvoGym.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{inviteLink}"
                       style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                        Aceptar invitaci&oacute;n
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Esta invitaci&oacute;n expira en 7 d&iacute;as. Si no esperabas este correo, puedes ignorarlo.
                </p>
            </div>
            """;

        await emailService.SendAsync(invitation.Email, "Te invitaron a entrenar en CelvoGym", html, cancellationToken);

        return new StudentInvitationDto(invitation.Id, invitation.Email,
            invitation.FirstName, token, invitation.ExpiresAt,
            false, invitation.CreatedAt);
    }
}
