using Kondix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class WorkoutSessionConfiguration : IEntityTypeConfiguration<WorkoutSession>
{
    public void Configure(EntityTypeBuilder<WorkoutSession> builder)
    {
        builder.ToTable("workout_sessions");

        builder.HasKey(ws => ws.Id);
        builder.Property(ws => ws.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(ws => ws.StartedAt).HasDefaultValueSql("NOW()");
        builder.Property(ws => ws.Notes).HasMaxLength(2000);
        builder.Property(ws => ws.Mood).HasConversion<string>().HasMaxLength(20);
        builder.Property(ws => ws.FeedbackReviewedAt);
        builder.Property(ws => ws.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(ws => new { ws.StudentId, ws.RoutineId, ws.DayId });
        builder.HasIndex(ws => new { ws.AssignmentId, ws.WeekIndex, ws.SlotIndex, ws.Status });
        builder.HasIndex(ws => new { ws.StudentId, ws.CompletedAt }).HasFilter("\"feedback_reviewed_at\" IS NULL");

        builder.HasOne(ws => ws.Student)
            .WithMany(s => s.WorkoutSessions)
            .HasForeignKey(ws => ws.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(ws => ws.Status).HasConversion<string>().HasMaxLength(16).IsRequired();

        builder.HasOne(ws => ws.Assignment)
            .WithMany()
            .HasForeignKey(ws => ws.AssignmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ws => ws.Program)
            .WithMany()
            .HasForeignKey(ws => ws.ProgramId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ws => ws.Routine)
            .WithMany()
            .HasForeignKey(ws => ws.RoutineId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ws => ws.Day)
            .WithMany()
            .HasForeignKey(ws => ws.DayId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(ws => ws.WeekIndex).IsRequired();
        builder.Property(ws => ws.SlotIndex).IsRequired();
        builder.Property(ws => ws.UpdatedAt).IsRequired();

        builder.Property(ws => ws.IsRecovery).HasDefaultValue(false);
        builder.HasOne(ws => ws.RecoversSession)
            .WithMany()
            .HasForeignKey(ws => ws.RecoversSessionId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
