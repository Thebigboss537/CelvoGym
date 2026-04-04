using CelvoGym.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CelvoGym.Infrastructure.Persistence.Configurations;

public class PersonalRecordConfiguration : IEntityTypeConfiguration<PersonalRecord>
{
    public void Configure(EntityTypeBuilder<PersonalRecord> builder)
    {
        builder.ToTable("personal_records");

        builder.HasKey(pr => pr.Id);
        builder.Property(pr => pr.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(pr => pr.ExerciseName).HasMaxLength(200).IsRequired();
        builder.Property(pr => pr.Weight).HasMaxLength(50).IsRequired();
        builder.Property(pr => pr.Reps).HasMaxLength(50);
        builder.Property(pr => pr.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(pr => new { pr.StudentId, pr.ExerciseName }).IsUnique();

        builder.HasOne(pr => pr.Student)
            .WithMany()
            .HasForeignKey(pr => pr.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pr => pr.Session)
            .WithMany()
            .HasForeignKey(pr => pr.SessionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
