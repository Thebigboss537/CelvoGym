using CelvoGym.Domain.Entities;
using CelvoGym.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class ExerciseGroupConfiguration : IEntityTypeConfiguration<ExerciseGroup>
{
    public void Configure(EntityTypeBuilder<ExerciseGroup> builder)
    {
        builder.ToTable("exercise_groups");

        builder.HasKey(eg => eg.Id);
        builder.Property(eg => eg.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(eg => eg.GroupType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(GroupType.Single);
        builder.Property(eg => eg.RestSeconds).HasDefaultValue(0);
        builder.Property(eg => eg.SortOrder).HasDefaultValue(0);
        builder.Property(eg => eg.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(eg => eg.DayId);

        builder.HasOne(eg => eg.Day)
            .WithMany(d => d.ExerciseGroups)
            .HasForeignKey(eg => eg.DayId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
