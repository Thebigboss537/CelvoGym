using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class ProgramAssignmentConfiguration : IEntityTypeConfiguration<ProgramAssignment>
{
    public void Configure(EntityTypeBuilder<ProgramAssignment> b)
    {
        b.ToTable("program_assignments");
        b.HasKey(a => a.Id);
        b.Property(a => a.Status).HasConversion<string>().HasMaxLength(16).IsRequired();
        b.Property(a => a.StartDate).IsRequired();
        b.Property(a => a.CreatedAt).IsRequired();
        b.Property(a => a.UpdatedAt).IsRequired();

        b.HasOne(a => a.Trainer).WithMany().HasForeignKey(a => a.TrainerId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(a => a.Student).WithMany(s => s.ProgramAssignments).HasForeignKey(a => a.StudentId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(a => a.Program).WithMany(p => p.Assignments).HasForeignKey(a => a.ProgramId).OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(a => new { a.StudentId, a.Status });
        b.HasIndex(a => a.TrainerId);
    }
}
