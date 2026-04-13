using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class StudentInvitationConfiguration : IEntityTypeConfiguration<StudentInvitation>
{
    public void Configure(EntityTypeBuilder<StudentInvitation> builder)
    {
        builder.ToTable("student_invitations");

        builder.HasKey(si => si.Id);
        builder.Property(si => si.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(si => si.Email).HasMaxLength(320).IsRequired();
        builder.Property(si => si.TokenHash).HasMaxLength(88).IsRequired();
        builder.Property(si => si.FirstName).HasMaxLength(100);
        builder.Property(si => si.ExpiresAt).IsRequired();
        builder.Property(si => si.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(si => si.TrainerId);
        builder.HasIndex(si => si.TokenHash).IsUnique();

        builder.HasOne(si => si.Trainer)
            .WithMany(t => t.Invitations)
            .HasForeignKey(si => si.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
