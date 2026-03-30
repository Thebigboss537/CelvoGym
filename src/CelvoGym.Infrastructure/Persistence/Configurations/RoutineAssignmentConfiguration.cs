using CelvoGym.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class RoutineAssignmentConfiguration : IEntityTypeConfiguration<RoutineAssignment>
{
    public void Configure(EntityTypeBuilder<RoutineAssignment> builder)
    {
        builder.ToTable("routine_assignments");

        builder.HasKey(ra => ra.Id);
        builder.Property(ra => ra.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(ra => ra.IsActive).HasDefaultValue(true);
        builder.Property(ra => ra.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(ra => new { ra.RoutineId, ra.StudentId }).IsUnique();
        builder.HasIndex(ra => ra.StudentId);

        builder.HasOne(ra => ra.Routine)
            .WithMany(r => r.Assignments)
            .HasForeignKey(ra => ra.RoutineId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ra => ra.Student)
            .WithMany(s => s.RoutineAssignments)
            .HasForeignKey(ra => ra.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
