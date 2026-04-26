using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public sealed class ExerciseFeedbackConfiguration : IEntityTypeConfiguration<ExerciseFeedback>
{
    public void Configure(EntityTypeBuilder<ExerciseFeedback> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.ActualRpe).IsRequired();
        b.Property(x => x.Notes).HasMaxLength(2000);

        b.HasOne(x => x.Session)
            .WithMany()
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne(x => x.Exercise)
            .WithMany()
            .HasForeignKey(x => x.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(x => new { x.SessionId, x.ExerciseId }).IsUnique();
        b.HasIndex(x => new { x.ExerciseId, x.CreatedAt });
    }
}
