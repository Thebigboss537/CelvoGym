using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class ProgramConfiguration : IEntityTypeConfiguration<Program>
{
    public void Configure(EntityTypeBuilder<Program> b)
    {
        b.ToTable("programs");
        b.HasKey(p => p.Id);
        b.Property(p => p.Name).HasMaxLength(120).IsRequired();
        b.Property(p => p.Description).HasMaxLength(2000);
        b.Property(p => p.Notes).HasMaxLength(4000);
        b.Property(p => p.Objective).HasConversion<string>().HasMaxLength(32).IsRequired();
        b.Property(p => p.Level).HasConversion<string>().HasMaxLength(32).IsRequired();
        b.Property(p => p.Mode).HasConversion<string>().HasMaxLength(16).IsRequired();
        b.Property(p => p.ScheduleType).HasConversion<string>().HasMaxLength(16).IsRequired();
        b.Property(p => p.DaysPerWeek);
        b.Property(p => p.IsPublished).IsRequired();
        b.Property(p => p.CreatedAt).IsRequired();
        b.Property(p => p.UpdatedAt).IsRequired();

        b.HasOne(p => p.Trainer)
            .WithMany()
            .HasForeignKey(p => p.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasMany(p => p.Weeks)
            .WithOne(w => w.Program)
            .HasForeignKey(w => w.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(p => p.TrainerId);
        b.HasIndex(p => p.IsPublished);
    }
}
