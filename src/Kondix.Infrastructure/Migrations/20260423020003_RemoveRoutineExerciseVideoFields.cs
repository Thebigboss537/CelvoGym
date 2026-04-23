using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kondix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveRoutineExerciseVideoFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Best-effort data preservation: for every routine exercise that has
            // a video URL and a linked catalog entry, push that video up to the
            // catalog — but only when the catalog entry has no video yet, so we
            // don't overwrite a trainer's explicit catalog choice.
            migrationBuilder.Sql(@"
                UPDATE kondix.catalog_exercises c
                SET video_source = e.video_source,
                    video_url = e.video_url
                FROM kondix.exercises e
                WHERE e.catalog_exercise_id = c.id
                  AND e.video_url IS NOT NULL
                  AND (c.video_url IS NULL OR c.video_url = '');
            ");

            migrationBuilder.DropColumn(
                name: "video_source",
                schema: "kondix",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "video_url",
                schema: "kondix",
                table: "exercises");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "video_source",
                schema: "kondix",
                table: "exercises",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<string>(
                name: "video_url",
                schema: "kondix",
                table: "exercises",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }
    }
}
