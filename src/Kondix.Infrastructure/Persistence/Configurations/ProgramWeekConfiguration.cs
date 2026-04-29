using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class ProgramWeekConfiguration : IEntityTypeConfiguration<ProgramWeek>
{
    public void Configure(EntityTypeBuilder<ProgramWeek> b)
    {
        b.ToTable("program_weeks");
        b.HasKey(w => w.Id);
        b.Property(w => w.WeekIndex).IsRequired();
        b.Property(w => w.Label).HasMaxLength(64).IsRequired();
        b.Property(w => w.CreatedAt).IsRequired();

        b.HasMany(w => w.Slots)
            .WithOne(s => s.Week)
            .HasForeignKey(s => s.WeekId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(w => new { w.ProgramId, w.WeekIndex }).IsUnique();
    }
}
