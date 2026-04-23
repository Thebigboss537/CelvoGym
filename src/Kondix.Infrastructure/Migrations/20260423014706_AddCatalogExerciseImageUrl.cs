using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kondix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogExerciseImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "image_url",
                schema: "kondix",
                table: "catalog_exercises",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "image_url",
                schema: "kondix",
                table: "catalog_exercises");
        }
    }
}
