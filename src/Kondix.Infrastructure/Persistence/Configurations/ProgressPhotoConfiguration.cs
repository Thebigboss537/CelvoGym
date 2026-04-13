using CelvoGym.Domain.Entities;
using CelvoGym.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class ProgressPhotoConfiguration : IEntityTypeConfiguration<ProgressPhoto>
{
    public void Configure(EntityTypeBuilder<ProgressPhoto> builder)
    {
        builder.ToTable("progress_photos");

        builder.HasKey(pp => pp.Id);
        builder.Property(pp => pp.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(pp => pp.PhotoUrl).HasMaxLength(500).IsRequired();
        builder.Property(pp => pp.Angle).HasConversion<string>().HasMaxLength(20);
        builder.Property(pp => pp.Notes).HasMaxLength(2000);
        builder.Property(pp => pp.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(pp => new { pp.StudentId, pp.TakenAt });

        builder.HasOne(pp => pp.Student)
            .WithMany()
            .HasForeignKey(pp => pp.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
