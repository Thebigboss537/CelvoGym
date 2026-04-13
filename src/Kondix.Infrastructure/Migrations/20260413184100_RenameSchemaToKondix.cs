using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kondix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameSchemaToKondix : Migration
    {
        // Schema was renamed manually via: ALTER SCHEMA gym RENAME TO kondix
        // This migration exists only to update EF Core's migration history.
        protected override void Up(MigrationBuilder migrationBuilder) { }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER SCHEMA kondix RENAME TO gym;");
        }
    }
}
