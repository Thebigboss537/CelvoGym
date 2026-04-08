using CelvoGym.Domain.Entities;
using CelvoGym.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class ExerciseSetConfiguration : IEntityTypeConfiguration<ExerciseSet>
{
    public void Configure(EntityTypeBuilder<ExerciseSet> builder)
    {
        builder.ToTable("exercise_sets");

        builder.HasKey(es => es.Id);
        builder.Property(es => es.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(es => es.SetType)
            .HasConversion<string>()
            .HasMaxLength(20);
        builder.Property(es => es.TargetReps).HasMaxLength(50);
        builder.Property(es => es.TargetWeight).HasMaxLength(50);
        builder.Property(es => es.SortOrder).HasDefaultValue(0);
        builder.Property(es => es.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(es => es.ExerciseId);

        builder.HasOne(es => es.Exercise)
            .WithMany(e => e.Sets)
            .HasForeignKey(es => es.ExerciseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
