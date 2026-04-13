using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class BodyMeasurementConfiguration : IEntityTypeConfiguration<BodyMeasurement>
{
    public void Configure(EntityTypeBuilder<BodyMeasurement> builder)
    {
        builder.ToTable("body_measurements");

        builder.HasKey(bm => bm.Id);
        builder.Property(bm => bm.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(bm => bm.Type).HasConversion<string>().HasMaxLength(30);
        builder.Property(bm => bm.Value).HasPrecision(5, 1);
        builder.Property(bm => bm.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasOne(bm => bm.BodyMetric)
            .WithMany(m => m.Measurements)
            .HasForeignKey(bm => bm.BodyMetricId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
