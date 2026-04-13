using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class TrainerNoteConfiguration : IEntityTypeConfiguration<TrainerNote>
{
    public void Configure(EntityTypeBuilder<TrainerNote> builder)
    {
        builder.ToTable("trainer_notes");

        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(n => n.Text).HasMaxLength(2000).IsRequired();
        builder.Property(n => n.IsPinned).HasDefaultValue(false);
        builder.Property(n => n.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(n => new { n.TrainerId, n.StudentId });

        builder.HasOne(n => n.Trainer)
            .WithMany()
            .HasForeignKey(n => n.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.Student)
            .WithMany()
            .HasForeignKey(n => n.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
