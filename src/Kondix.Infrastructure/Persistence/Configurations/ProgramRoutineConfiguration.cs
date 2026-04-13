using CelvoGym.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class ProgramRoutineConfiguration : IEntityTypeConfiguration<ProgramRoutine>
{
    public void Configure(EntityTypeBuilder<ProgramRoutine> builder)
    {
        builder.ToTable("program_routines");

        builder.HasKey(pr => pr.Id);
        builder.Property(pr => pr.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(pr => pr.Label).HasMaxLength(100);
        builder.Property(pr => pr.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(pr => new { pr.ProgramId, pr.SortOrder });

        builder.HasOne(pr => pr.Program)
            .WithMany(p => p.ProgramRoutines)
            .HasForeignKey(pr => pr.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pr => pr.Routine)
            .WithMany()
            .HasForeignKey(pr => pr.RoutineId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
