using CelvoGym.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class SetLogConfiguration : IEntityTypeConfiguration<SetLog>
{
    public void Configure(EntityTypeBuilder<SetLog> builder)
    {
        builder.ToTable("set_logs");

        builder.HasKey(sl => sl.Id);
        builder.Property(sl => sl.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(sl => sl.Completed).HasDefaultValue(false);
        builder.Property(sl => sl.ActualWeight).HasMaxLength(50);
        builder.Property(sl => sl.ActualReps).HasMaxLength(50);
        builder.Property(sl => sl.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(sl => new { sl.StudentId, sl.SetId }).IsUnique();
        builder.HasIndex(sl => new { sl.StudentId, sl.RoutineId });

        builder.HasOne(sl => sl.Student)
            .WithMany(s => s.SetLogs)
            .HasForeignKey(sl => sl.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(sl => sl.Set)
            .WithMany(es => es.SetLogs)
            .HasForeignKey(sl => sl.SetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
