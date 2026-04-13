using Kondix.Application.Common;
using Kondix.Application.Common.Interfaces;
using Kondix.Application.DTOs;
using Kondix.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Kondix.Application.Commands.Students;

public sealed record AcceptInvitationCommand(
    string Token,
    Guid CelvoGuardUserId,
    string DisplayName) : IRequest<StudentDto>;

public sealed class AcceptInvitationHandler(IKondixDbContext db)
    : IRequestHandler<AcceptInvitationCommand, StudentDto>
{
    public async Task<StudentDto> Handle(AcceptInvitationCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = TokenHasher.Hash(request.Token);

        var invitation = await db.StudentInvitations
            .Include(i => i.Trainer)
            .FirstOrDefaultAsync(i => i.TokenHash == tokenHash
                && i.AcceptedAt == null
                && i.ExpiresAt > DateTimeOffset.UtcNow, cancellationToken)
            ?? throw new InvalidOperationException("Invalid or expired invitation");

        // Check if student already exists
        var student = await db.Students
            .FirstOrDefaultAsync(s => s.CelvoGuardUserId == request.CelvoGuardUserId, cancellationToken);

        if (student is null)
        {
            student = new Student
            {
                CelvoGuardUserId = request.CelvoGuardUserId,
                DisplayName = request.DisplayName,
                ActiveTrainerId = invitation.Trainer.Id,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.Students.Add(student);
        }
        else
        {
            // Student exists — check if already linked to a trainer (1:1 MVP)
            var existingLink = await db.TrainerStudents
                .AnyAsync(ts => ts.StudentId == student.Id && ts.IsActive, cancellationToken);

            if (existingLink)
                throw new InvalidOperationException("Student already has an active trainer");

            student.ActiveTrainerId = invitation.Trainer.Id;
            student.UpdatedAt = DateTimeOffset.UtcNow;
        }

        // Create the M:N link
        db.TrainerStudents.Add(new TrainerStudent
        {
            TrainerId = invitation.Trainer.Id,
            StudentId = student.Id
        });

        // Mark invitation as accepted
        invitation.AcceptedAt = DateTimeOffset.UtcNow;
        invitation.AcceptedByStudentId = student.Id;

        await db.SaveChangesAsync(cancellationToken);

        return new StudentDto(student.Id, student.DisplayName,
            student.AvatarUrl, student.IsActive, student.CreatedAt);
    }
}
