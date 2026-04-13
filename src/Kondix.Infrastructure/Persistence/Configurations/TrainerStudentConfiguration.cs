using CelvoGym.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class TrainerStudentConfiguration : IEntityTypeConfiguration<TrainerStudent>
{
    public void Configure(EntityTypeBuilder<TrainerStudent> builder)
    {
        builder.ToTable("trainer_students");

        builder.HasKey(ts => ts.Id);
        builder.Property(ts => ts.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(ts => ts.IsActive).HasDefaultValue(true);
        builder.Property(ts => ts.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(ts => new { ts.TrainerId, ts.StudentId }).IsUnique();
        builder.HasIndex(ts => ts.StudentId);

        builder.HasOne(ts => ts.Trainer)
            .WithMany(t => t.TrainerStudents)
            .HasForeignKey(ts => ts.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ts => ts.Student)
            .WithMany(s => s.TrainerStudents)
            .HasForeignKey(ts => ts.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
