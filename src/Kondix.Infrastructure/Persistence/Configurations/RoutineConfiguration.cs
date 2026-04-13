using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class RoutineConfiguration : IEntityTypeConfiguration<Routine>
{
    public void Configure(EntityTypeBuilder<Routine> builder)
    {
        builder.ToTable("routines");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(r => r.Name).HasMaxLength(200).IsRequired();
        builder.Property(r => r.Description).HasMaxLength(2000);
        builder.Property(r => r.SortOrder).HasDefaultValue(0);
        builder.Property(r => r.IsActive).HasDefaultValue(true);
        builder.Property(r => r.Tags).HasDefaultValueSql("ARRAY[]::text[]");
        builder.Property(r => r.Category).HasMaxLength(100);
        builder.Property(r => r.CreatedAt).HasDefaultValueSql("NOW()");
        builder.Property(r => r.UpdatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(r => r.TrainerId);

        builder.HasOne(r => r.Trainer)
            .WithMany(t => t.Routines)
            .HasForeignKey(r => r.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
