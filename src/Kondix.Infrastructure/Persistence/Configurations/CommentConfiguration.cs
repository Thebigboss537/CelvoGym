using Kondix.Domain.Entities;
using Kondix.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kondix.Infrastructure.Persistence.Configurations;

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.ToTable("comments");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(c => c.AuthorId).IsRequired();
        builder.Property(c => c.AuthorType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();
        builder.Property(c => c.Text).HasMaxLength(2000).IsRequired();
        builder.Property(c => c.CreatedAt).HasDefaultValueSql("NOW()");

        builder.HasIndex(c => new { c.RoutineId, c.DayId });
    }
}
