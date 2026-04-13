using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class CatalogExerciseConfiguration : IEntityTypeConfiguration<CatalogExercise>
{
    public void Configure(EntityTypeBuilder<CatalogExercise> builder)
    {
        builder.ToTable("catalog_exercises");

        builder.HasKey(ce => ce.Id);
        builder.Property(ce => ce.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(ce => ce.Name).HasMaxLength(200).IsRequired();
        builder.Property(ce => ce.MuscleGroup).HasMaxLength(100);
        builder.Property(ce => ce.VideoSource).HasConversion<string>().HasMaxLength(20)
            .HasDefaultValue(VideoSource.None);
        builder.Property(ce => ce.VideoUrl).HasMaxLength(500);
        builder.Property(ce => ce.Notes).HasMaxLength(2000);
        builder.Property(ce => ce.IsActive).HasDefaultValue(true);
        builder.Property(ce => ce.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(ce => new { ce.TrainerId, ce.Name });

        builder.HasOne(ce => ce.Trainer)
            .WithMany()
            .HasForeignKey(ce => ce.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
