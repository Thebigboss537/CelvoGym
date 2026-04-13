using CelvoGym.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class AssignmentTemplateConfiguration : IEntityTypeConfiguration<AssignmentTemplate>
{
    public void Configure(EntityTypeBuilder<AssignmentTemplate> builder)
    {
        builder.ToTable("assignment_templates");

        builder.HasKey(at => at.Id);
        builder.Property(at => at.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(at => at.Name).HasMaxLength(200).IsRequired();
        builder.Property(at => at.ScheduledDays).HasDefaultValueSql("ARRAY[]::integer[]");
        builder.Property(at => at.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(at => at.TrainerId);

        builder.HasOne(at => at.Trainer)
            .WithMany()
            .HasForeignKey(at => at.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(at => at.Program)
            .WithMany()
            .HasForeignKey(at => at.ProgramId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
