using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class ProgramSlotConfiguration : IEntityTypeConfiguration<ProgramSlot>
{
    public void Configure(EntityTypeBuilder<ProgramSlot> b)
    {
        b.ToTable("program_slots");
        b.HasKey(s => s.Id);
        b.Property(s => s.DayIndex).IsRequired();
        b.Property(s => s.Kind).HasConversion<string>().HasMaxLength(16).IsRequired();
        b.Property(s => s.CreatedAt).IsRequired();

        b.HasOne(s => s.Routine)
            .WithMany()
            .HasForeignKey(s => s.RoutineId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasOne(s => s.Day)
            .WithMany()
            .HasForeignKey(s => s.DayId)
            .OnDelete(DeleteBehavior.SetNull);

        b.HasIndex(s => new { s.WeekId, s.DayIndex }).IsUnique();
        b.HasIndex(s => s.RoutineId);
        b.HasIndex(s => s.BlockId);
    }
}
