using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class ExerciseBlockConfiguration : IEntityTypeConfiguration<ExerciseBlock>
{
    public void Configure(EntityTypeBuilder<ExerciseBlock> builder)
    {
        builder.ToTable("exercise_blocks");

        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(b => b.BlockType)
            .HasConversion<string>()
            .HasMaxLength(20);
        builder.Property(b => b.RestSeconds).HasDefaultValue(0);
        builder.Property(b => b.SortOrder).HasDefaultValue(0);
        builder.Property(b => b.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(b => b.DayId);

        builder.HasOne(b => b.Day)
            .WithMany(d => d.Blocks)
            .HasForeignKey(b => b.DayId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
