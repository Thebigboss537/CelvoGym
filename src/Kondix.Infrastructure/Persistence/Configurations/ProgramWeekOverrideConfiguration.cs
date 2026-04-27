using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public sealed class ProgramWeekOverrideConfiguration : IEntityTypeConfiguration<ProgramWeekOverride>
{
    public void Configure(EntityTypeBuilder<ProgramWeekOverride> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
        builder.Property(x => x.WeekIndex).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(2000).IsRequired();

        builder.HasOne(x => x.Program)
            .WithMany()
            .HasForeignKey(x => x.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.ProgramId, x.WeekIndex }).IsUnique();
    }
}
