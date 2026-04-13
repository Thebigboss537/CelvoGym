using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class ProgramAssignmentConfiguration : IEntityTypeConfiguration<ProgramAssignment>
{
    public void Configure(EntityTypeBuilder<ProgramAssignment> builder)
    {
        builder.ToTable("program_assignments");

        builder.HasKey(pa => pa.Id);
        builder.Property(pa => pa.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(pa => pa.Mode)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(pa => pa.TrainingDays)
            .HasDefaultValueSql("ARRAY[]::integer[]");

        builder.Property(pa => pa.FixedScheduleJson)
            .HasColumnType("jsonb");

        builder.Property(pa => pa.StartDate).IsRequired();
        builder.Property(pa => pa.EndDate).IsRequired();

        builder.Property(pa => pa.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(ProgramAssignmentStatus.Active);

        builder.Property(pa => pa.RotationIndex).HasDefaultValue(0);
        builder.Property(pa => pa.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(pa => new { pa.ProgramId, pa.StudentId })
            .HasFilter("status = 'Active'")
            .IsUnique();

        builder.HasIndex(pa => pa.StudentId);
        builder.HasIndex(pa => new { pa.StudentId, pa.Status });

        builder.HasOne(pa => pa.Program)
            .WithMany(p => p.ProgramAssignments)
            .HasForeignKey(pa => pa.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pa => pa.Student)
            .WithMany(s => s.ProgramAssignments)
            .HasForeignKey(pa => pa.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
