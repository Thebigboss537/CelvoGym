using CelvoGym.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class TrainerConfiguration : IEntityTypeConfiguration<Trainer>
{
    public void Configure(EntityTypeBuilder<Trainer> builder)
    {
        builder.ToTable("trainers");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(t => t.TenantId).IsRequired();
        builder.Property(t => t.CelvoGuardUserId).IsRequired();
        builder.Property(t => t.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Bio).HasMaxLength(2000);
        builder.Property(t => t.AvatarUrl).HasMaxLength(500);
        builder.Property(t => t.IsActive).HasDefaultValue(true);
        builder.Property(t => t.IsApproved).HasDefaultValue(false);
        builder.Property(t => t.CreatedAt).HasDefaultValueSql("NOW()");
        builder.Property(t => t.UpdatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(t => t.TenantId).IsUnique();
        builder.HasIndex(t => t.CelvoGuardUserId).IsUnique();
    }
}
