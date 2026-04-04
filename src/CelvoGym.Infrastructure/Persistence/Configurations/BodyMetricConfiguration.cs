using CelvoGym.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class BodyMetricConfiguration : IEntityTypeConfiguration<BodyMetric>
{
    public void Configure(EntityTypeBuilder<BodyMetric> builder)
    {
        builder.ToTable("body_metrics");

        builder.HasKey(bm => bm.Id);
        builder.Property(bm => bm.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(bm => bm.Weight).HasPrecision(5, 2);
        builder.Property(bm => bm.BodyFat).HasPrecision(4, 1);
        builder.Property(bm => bm.Notes).HasMaxLength(2000);
        builder.Property(bm => bm.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(bm => new { bm.StudentId, bm.RecordedAt });

        builder.HasOne(bm => bm.Student)
            .WithMany()
            .HasForeignKey(bm => bm.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
