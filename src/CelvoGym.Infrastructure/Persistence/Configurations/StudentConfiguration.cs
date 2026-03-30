using CelvoGym.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.ToTable("students");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(s => s.CelvoGuardUserId).IsRequired();
        builder.Property(s => s.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(s => s.AvatarUrl).HasMaxLength(500);
        builder.Property(s => s.IsActive).HasDefaultValue(true);
        builder.Property(s => s.CreatedAt).HasDefaultValueSql("NOW()");
        builder.Property(s => s.UpdatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(s => s.CelvoGuardUserId).IsUnique();
        builder.HasIndex(s => s.ActiveTrainerId);

        builder.HasOne(s => s.ActiveTrainer)
            .WithMany()
            .HasForeignKey(s => s.ActiveTrainerId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
