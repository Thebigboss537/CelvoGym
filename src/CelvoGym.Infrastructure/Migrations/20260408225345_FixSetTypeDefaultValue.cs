using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CelvoGym.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixSetTypeDefaultValue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "set_type",
                schema: "gym",
                table: "exercise_sets",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Effective");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "set_type",
                schema: "gym",
                table: "exercise_sets",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Effective",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);
        }
    }
}
