using CelvoGym.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class DayConfiguration : IEntityTypeConfiguration<Day>
{
    public void Configure(EntityTypeBuilder<Day> builder)
    {
        builder.ToTable("days");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(d => d.Name).HasMaxLength(200).IsRequired();
        builder.Property(d => d.SortOrder).HasDefaultValue(0);
        builder.Property(d => d.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(d => d.RoutineId);

        builder.HasOne(d => d.Routine)
            .WithMany(r => r.Days)
            .HasForeignKey(d => d.RoutineId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
